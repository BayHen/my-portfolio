"""Public media references and authenticated media management."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.admin_auth import audit, require_admin, require_write
from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.db.session import get_db
from app.models.entities import AdminSession, MediaAsset, MediaAssignment, Project
from app.services.media_storage import delete_media, local_directory, store_media

Db = Annotated[Session, Depends(get_db)]
Config = Annotated[Settings, Depends(get_settings)]
Read = Annotated[AdminSession, Depends(require_admin)]
Write = Annotated[AdminSession, Depends(require_write)]

GLOBAL_SLOTS = {"hero_avatar", "hero_background", "about_profile", "open_graph"}
PROJECT_SLOTS = {"project_thumbnail", "project_gallery"}


def require_proxy(request: Request, settings: Config) -> None:
    if (
        settings.admin_proxy_token
        and request.headers.get("X-Admin-Proxy-Token") != settings.admin_proxy_token
    ):
        raise AppError("forbidden", 403, "Access denied.")


public_router = APIRouter(prefix="/api/v1/media", tags=["media"])
admin_router = APIRouter(
    prefix="/api/v1/admin/media", tags=["admin-media"], dependencies=[Depends(require_proxy)]
)


class AltIn(BaseModel):
    alt: str = Field(min_length=3, max_length=300)


class AssignmentIn(BaseModel):
    asset_id: str
    project_id: int | None = None


class GalleryIn(BaseModel):
    asset_ids: list[str] = Field(max_length=30)


def asset_data(item: MediaAsset) -> dict:
    return {
        "id": item.id,
        "url": item.url,
        "alt": item.alt,
        "content_type": item.content_type,
        "byte_size": item.byte_size,
        "width": item.width,
        "height": item.height,
        "created_at": item.created_at.isoformat(),
        "usage": [
            {"slot": usage.slot, "project_id": usage.project_id, "position": usage.position}
            for usage in item.assignments
        ],
    }


def asset_or_404(db: Session, asset_id: str) -> MediaAsset:
    item = db.get(MediaAsset, asset_id)
    if not item:
        raise AppError("not_found", 404, "Media asset not found.")
    return item


def file_response(item: MediaAsset, settings: Settings):
    if item.storage_backend == "s3":
        if not settings.s3_public_base_url:
            raise AppError("storage_unavailable", 503, "Media storage is not configured.")
        return RedirectResponse(f"{settings.s3_public_base_url.rstrip('/')}/{item.storage_key}")
    filename = item.storage_key.removeprefix("media/")
    if item.storage_backend != "local" or "/" in filename or not filename:
        raise AppError("not_found", 404, "Media file not found.")
    path = local_directory(settings) / filename
    if not path.is_file():
        raise AppError("not_found", 404, "Media file not found.")
    return FileResponse(
        path, media_type=item.content_type, headers={"Cache-Control": "public, max-age=60"}
    )


@public_router.get("/assignments")
def public_assignments(db: Db):
    assignments = db.scalars(
        select(MediaAssignment)
        .outerjoin(Project, MediaAssignment.project_id == Project.id)
        .where(or_(MediaAssignment.project_id.is_(None), Project.published_at.is_not(None)))
        .order_by(MediaAssignment.project_id, MediaAssignment.slot, MediaAssignment.position)
    ).all()
    return [
        {
            "slot": item.slot,
            "project_id": item.project_id,
            "project_slug": db.get(Project, item.project_id).slug if item.project_id else None,
            "position": item.position,
            "asset": {"id": item.asset.id, "url": item.asset.url, "alt": item.asset.alt},
        }
        for item in assignments
    ]


@public_router.get("/files/{filename}")
def public_file(filename: str, db: Db, settings: Config):
    item = db.get(MediaAsset, filename)
    if not item:
        raise AppError("not_found", 404, "Media file not found.")
    visible = db.scalar(
        select(MediaAssignment.id)
        .outerjoin(Project, MediaAssignment.project_id == Project.id)
        .where(
            MediaAssignment.asset_id == item.id,
            or_(MediaAssignment.project_id.is_(None), Project.published_at.is_not(None)),
        )
        .limit(1)
    )
    if not visible:
        raise AppError("not_found", 404, "Media file not found.")
    return file_response(item, settings)


@admin_router.get("")
def list_media(
    db: Db,
    _: Read,
    search: str = Query(default="", max_length=100),
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    query = select(MediaAsset)
    if search:
        query = query.where(MediaAsset.alt.ilike(f"%{search}%"))
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(
        query.order_by(MediaAsset.created_at.desc(), MediaAsset.id).limit(limit).offset(offset)
    ).all()
    return {
        "items": [asset_data(item) for item in items],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@admin_router.get("/assignments")
def admin_assignments(db: Db, _: Read):
    items = db.scalars(
        select(MediaAssignment).order_by(
            MediaAssignment.project_id, MediaAssignment.slot, MediaAssignment.position
        )
    ).all()
    return [
        {
            "slot": item.slot,
            "project_id": item.project_id,
            "position": item.position,
            "asset": {"id": item.asset.id, "url": item.asset.url, "alt": item.asset.alt},
        }
        for item in items
    ]


@admin_router.get("/{asset_id}")
def media_detail(asset_id: str, db: Db, _: Read):
    return asset_data(asset_or_404(db, asset_id))


@admin_router.post("", status_code=201)
async def upload_media(
    db: Db,
    session: Write,
    settings: Config,
    file: Annotated[UploadFile, File()],
    alt: Annotated[str, Form(min_length=3, max_length=300)],
):
    stored = await store_media(file, settings)
    item = MediaAsset(
        id=str(UUID(stored.key.removeprefix("media/").split(".")[0])),
        storage_key=stored.key,
        storage_backend=stored.backend,
        url=stored.url,
        alt=alt.strip(),
        content_type=stored.content_type,
        byte_size=stored.byte_size,
        width=stored.width,
        height=stored.height,
    )
    try:
        db.add(item)
        audit(
            db,
            "media_uploaded",
            actor_id=session.account_id,
            target_type="media",
            target_id=item.id,
        )
        db.commit()
    except Exception:
        db.rollback()
        delete_media(stored.key, stored.backend, settings)
        raise
    db.refresh(item)
    return asset_data(item)


@admin_router.get("/{asset_id}/file")
def admin_file(asset_id: str, db: Db, _: Read, settings: Config):
    return file_response(asset_or_404(db, asset_id), settings)


@admin_router.patch("/{asset_id}")
def update_media(asset_id: str, data: AltIn, db: Db, session: Write):
    item = asset_or_404(db, asset_id)
    item.alt = data.alt.strip()
    audit(db, "media_updated", actor_id=session.account_id, target_type="media", target_id=item.id)
    db.commit()
    return asset_data(item)


@admin_router.put("/{asset_id}/file")
async def replace_media(
    asset_id: str, db: Db, session: Write, settings: Config, file: Annotated[UploadFile, File()]
):
    item = asset_or_404(db, asset_id)
    stored = await store_media(file, settings)
    previous = (item.storage_key, item.storage_backend)
    try:
        item.storage_key, item.storage_backend = stored.key, stored.backend
        version = stored.key.removeprefix("media/").split(".", 1)[0]
        item.url = f"{item.url.split('?', 1)[0]}?v={version}"
        item.content_type, item.byte_size = stored.content_type, stored.byte_size
        item.width, item.height = stored.width, stored.height
        audit(
            db,
            "media_replaced",
            actor_id=session.account_id,
            target_type="media",
            target_id=item.id,
        )
        db.commit()
    except Exception:
        db.rollback()
        delete_media(stored.key, stored.backend, settings)
        raise
    delete_media(*previous, settings)
    return asset_data(item)


@admin_router.delete("/{asset_id}", status_code=204)
def remove_media(asset_id: str, db: Db, session: Write, settings: Config):
    item = asset_or_404(db, asset_id)
    if item.assignments:
        raise AppError("media_in_use", 409, "Remove image assignments before deleting.")
    key, backend = item.storage_key, item.storage_backend
    db.delete(item)
    audit(db, "media_deleted", actor_id=session.account_id, target_type="media", target_id=asset_id)
    db.commit()
    delete_media(key, backend, settings)


@admin_router.put("/assignments/{slot}")
def assign_media(slot: str, data: AssignmentIn, db: Db, session: Write):
    if slot not in GLOBAL_SLOTS | {"project_thumbnail"}:
        raise AppError("invalid_slot", 400, "Unsupported image slot.")
    if (slot in GLOBAL_SLOTS and data.project_id is not None) or (
        slot in PROJECT_SLOTS and data.project_id is None
    ):
        raise AppError("invalid_slot", 400, "Invalid project for image slot.")
    asset_or_404(db, data.asset_id)
    if data.project_id is not None and not db.get(Project, data.project_id):
        raise AppError("not_found", 404, "Project not found.")
    current = db.scalar(
        select(MediaAssignment).where(
            MediaAssignment.slot == slot, MediaAssignment.project_id == data.project_id
        )
    )
    if current:
        current.asset_id = data.asset_id
    else:
        db.add(
            MediaAssignment(
                slot=slot, project_id=data.project_id, asset_id=data.asset_id, position=0
            )
        )
    audit(
        db,
        "media_assigned",
        actor_id=session.account_id,
        target_type="media",
        target_id=data.asset_id,
    )
    db.commit()
    return {"slot": slot, "project_id": data.project_id, "asset_id": data.asset_id}


@admin_router.delete("/assignments/{slot}", status_code=204)
def unassign_media(slot: str, db: Db, session: Write, project_id: int | None = None):
    if slot not in GLOBAL_SLOTS | {"project_thumbnail"}:
        raise AppError("invalid_slot", 400, "Unsupported image slot.")
    item = db.scalar(
        select(MediaAssignment).where(
            MediaAssignment.slot == slot, MediaAssignment.project_id == project_id
        )
    )
    if not item:
        raise AppError("not_found", 404, "Assignment not found.")
    db.delete(item)
    audit(
        db,
        "media_unassigned",
        actor_id=session.account_id,
        target_type="media",
        target_id=item.asset_id,
    )
    db.commit()


@admin_router.put("/projects/{project_id}/gallery")
def set_gallery(project_id: int, data: GalleryIn, db: Db, session: Write):
    if not db.get(Project, project_id):
        raise AppError("not_found", 404, "Project not found.")
    if len(data.asset_ids) != len(set(data.asset_ids)):
        raise AppError("invalid_gallery", 400, "Gallery images must be unique.")
    assets = db.scalars(select(MediaAsset.id).where(MediaAsset.id.in_(data.asset_ids))).all()
    if len(assets) != len(data.asset_ids):
        raise AppError("invalid_gallery", 400, "Unknown media asset.")
    existing = db.scalars(
        select(MediaAssignment).where(
            MediaAssignment.slot == "project_gallery", MediaAssignment.project_id == project_id
        )
    ).all()
    for item in existing:
        db.delete(item)
    db.flush()
    for position, asset_id in enumerate(data.asset_ids):
        db.add(
            MediaAssignment(
                slot="project_gallery", project_id=project_id, asset_id=asset_id, position=position
            )
        )
    audit(
        db,
        "gallery_updated",
        actor_id=session.account_id,
        target_type="project",
        target_id=str(project_id),
    )
    db.commit()
    return {"asset_ids": data.asset_ids}

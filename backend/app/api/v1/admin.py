"""Private administration API. Every content route requires a database session."""

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, Request, Response, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.admin_auth import (
    COOKIE_NAME,
    audit,
    cookie_options,
    login,
    require_admin,
    require_write,
)
from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.db.session import get_db
from app.models.entities import (
    AdminSession,
    ContactMessage,
    Experience,
    Profile,
    Project,
    ProjectImage,
    Technology,
)
from app.schemas.admin import (
    ExperienceIn,
    ImageOrderIn,
    LoginIn,
    MessageReadIn,
    ProfileIn,
    ProjectIn,
    TechnologyIn,
)
from app.services.images import delete_image_object, key_from_url, upload_image


def require_proxy(request: Request, settings: Annotated[Settings, Depends(get_settings)]) -> None:
    if (
        settings.admin_proxy_token
        and request.headers.get("X-Admin-Proxy-Token") != settings.admin_proxy_token
    ):
        raise AppError("forbidden", 403, "Access denied.")


router = APIRouter(prefix="/api/v1/admin", tags=["admin"], dependencies=[Depends(require_proxy)])
Db = Annotated[Session, Depends(get_db)]
Read = Annotated[AdminSession, Depends(require_admin)]
Write = Annotated[AdminSession, Depends(require_write)]
Config = Annotated[Settings, Depends(get_settings)]


def missing(kind: str):
    raise AppError("not_found", 404, f"{kind} not found.")


def project_data(item: Project) -> dict:
    return {
        "id": item.id,
        "slug": item.slug,
        "title": item.title,
        "summary": item.summary,
        "description": item.description,
        "category": item.category,
        "status": item.status,
        "is_featured": item.is_featured,
        "published_at": item.published_at.isoformat() if item.published_at else None,
        "technology_ids": [technology.id for technology in item.technologies],
        "images": [
            {"id": image.id, "src": image.src, "alt": image.alt, "position": image.position}
            for image in item.images
        ],
        **{
            field: getattr(item, field)
            for field in (
                "problem",
                "goals",
                "solution",
                "responsibilities",
                "architecture",
                "features",
                "challenges",
                "testing",
                "results",
                "lessons_learned",
                "repository_url",
                "live_url",
            )
        },
    }


@router.post("/login")
def sign_in(data: LoginIn, request: Request, response: Response, db: Db, settings: Config):
    ip = request.client.host if request.client else "unknown"
    account, token, csrf = login(db, str(data.email), data.password, ip, settings)
    response.set_cookie(COOKIE_NAME, token, **cookie_options(settings))
    return {"email": account.email, "csrf_token": csrf}


@router.get("/session")
def session_info(session: Read):
    return {
        "email": session.account.email,
        "expires_at": session.expires_at.isoformat(),
        "csrf_token": session.csrf_token,
    }


@router.post("/logout")
def sign_out(response: Response, db: Db, session: Write, settings: Config):
    session.revoked_at = datetime.now(timezone.utc)
    audit(db, "logout", actor_id=session.account_id)
    db.commit()
    response.delete_cookie(
        COOKIE_NAME, path="/", secure=settings.admin_cookie_secure, httponly=True, samesite="strict"
    )
    return {"ok": True}


@router.get("/overview")
def overview(db: Db, _: Read):
    return {
        "projects": db.scalar(select(func.count(Project.id))) or 0,
        "drafts": db.scalar(select(func.count(Project.id)).where(Project.published_at.is_(None)))
        or 0,
        "messages_unread": db.scalar(
            select(func.count(ContactMessage.id)).where(ContactMessage.read_at.is_(None))
        )
        or 0,
    }


@router.get("/projects")
def list_admin_projects(db: Db, _: Read):
    return [
        project_data(item) for item in db.scalars(select(Project).order_by(Project.id.desc())).all()
    ]


@router.get("/projects/{project_id}")
def get_admin_project(project_id: int, db: Db, _: Read):
    item = db.get(Project, project_id)
    if not item:
        missing("Project")
    return project_data(item)


def save_project(db: Session, item: Project, data: ProjectIn, actor_id: int, action: str):
    duplicate = db.scalar(select(Project).where(Project.slug == data.slug, Project.id != item.id))
    if duplicate:
        raise AppError("slug_conflict", 409, "Project slug already exists.")
    technologies = list(
        db.scalars(select(Technology).where(Technology.id.in_(data.technology_ids))).all()
    )
    if len(technologies) != len(set(data.technology_ids)):
        raise AppError("invalid_technologies", 400, "Unknown or duplicate technology IDs.")
    for field, value in data.model_dump(
        exclude={"technology_ids", "repository_url", "live_url"}
    ).items():
        setattr(item, field, value)
    item.repository_url = str(data.repository_url) if data.repository_url else None
    item.live_url = str(data.live_url) if data.live_url else None
    item.technologies = technologies
    db.add(item)
    db.flush()
    audit(db, action, actor_id=actor_id, target_type="project", target_id=str(item.id))
    db.commit()
    db.refresh(item)
    return project_data(item)


@router.post("/projects", status_code=201)
def create_project(data: ProjectIn, db: Db, session: Write):
    return save_project(db, Project(), data, session.account_id, "project_created")


@router.put("/projects/{project_id}")
def update_project(project_id: int, data: ProjectIn, db: Db, session: Write):
    item = db.get(Project, project_id)
    if not item:
        missing("Project")
    return save_project(db, item, data, session.account_id, "project_updated")


@router.post("/projects/{project_id}/publish")
def publish_project(project_id: int, db: Db, session: Write):
    item = db.get(Project, project_id)
    if not item:
        missing("Project")
    if not item.title or not item.summary or not item.description:
        raise AppError("incomplete_project", 400, "Project content is incomplete.")
    item.published_at = datetime.now(timezone.utc)
    if item.status == "draft":
        item.status = "published"
    audit(
        db,
        "project_published",
        actor_id=session.account_id,
        target_type="project",
        target_id=str(project_id),
    )
    db.commit()
    return project_data(item)


@router.post("/projects/{project_id}/unpublish")
def unpublish_project(project_id: int, db: Db, session: Write):
    item = db.get(Project, project_id)
    if not item:
        missing("Project")
    item.published_at = None
    if item.status == "published":
        item.status = "draft"
    audit(
        db,
        "project_unpublished",
        actor_id=session.account_id,
        target_type="project",
        target_id=str(project_id),
    )
    db.commit()
    return project_data(item)


@router.delete("/projects/{project_id}", status_code=204)
def delete_project(project_id: int, db: Db, session: Write):
    item = db.get(Project, project_id)
    if not item:
        missing("Project")
    if item.images:
        raise AppError("images_attached", 409, "Remove project images before deleting.")
    db.delete(item)
    audit(
        db,
        "project_deleted",
        actor_id=session.account_id,
        target_type="project",
        target_id=str(project_id),
    )
    db.commit()


@router.get("/technologies")
def admin_technologies(db: Db, _: Read):
    return [
        {"id": item.id, "name": item.name, "category": item.category, "group": item.group}
        for item in db.scalars(select(Technology).order_by(Technology.name)).all()
    ]


@router.post("/technologies", status_code=201)
def create_technology(data: TechnologyIn, db: Db, session: Write):
    if db.scalar(select(Technology.id).where(Technology.name == data.name)):
        raise AppError("name_conflict", 409, "Technology already exists.")
    item = Technology(**data.model_dump())
    db.add(item)
    db.flush()
    audit(
        db,
        "technology_created",
        actor_id=session.account_id,
        target_type="technology",
        target_id=str(item.id),
    )
    db.commit()
    return {"id": item.id, **data.model_dump()}


@router.put("/technologies/{technology_id}")
def update_technology(technology_id: int, data: TechnologyIn, db: Db, session: Write):
    item = db.get(Technology, technology_id)
    if not item:
        missing("Technology")
    if db.scalar(
        select(Technology.id).where(Technology.name == data.name, Technology.id != technology_id)
    ):
        raise AppError("name_conflict", 409, "Technology already exists.")
    for field, value in data.model_dump().items():
        setattr(item, field, value)
    audit(
        db,
        "technology_updated",
        actor_id=session.account_id,
        target_type="technology",
        target_id=str(item.id),
    )
    db.commit()
    return {"id": item.id, **data.model_dump()}


@router.delete("/technologies/{technology_id}", status_code=204)
def delete_technology(technology_id: int, db: Db, session: Write):
    item = db.get(Technology, technology_id)
    if not item:
        missing("Technology")
    if db.scalar(
        select(Project.id).where(Project.technologies.any(Technology.id == technology_id))
    ):
        raise AppError("technology_in_use", 409, "Technology is assigned to a project.")
    db.delete(item)
    audit(
        db,
        "technology_deleted",
        actor_id=session.account_id,
        target_type="technology",
        target_id=str(technology_id),
    )
    db.commit()


def experience_data(item: Experience) -> dict:
    return {
        "id": item.id,
        "role": item.role,
        "organization": item.organization,
        "summary": item.summary,
        "start_date": item.start_date,
        "end_date": item.end_date,
        "current": item.current,
        "position": item.position,
        "published_at": item.published_at.isoformat() if item.published_at else None,
    }


@router.get("/experiences")
def admin_experiences(db: Db, _: Read):
    return [
        experience_data(item)
        for item in db.scalars(
            select(Experience).order_by(Experience.position, Experience.id)
        ).all()
    ]


def save_experience(db: Session, item: Experience, data: ExperienceIn, actor_id: int, action: str):
    item.role, item.organization, item.summary = data.role, data.organization, data.summary
    item.start_date = data.start_date.isoformat()
    item.end_date = data.end_date.isoformat() if data.end_date else None
    item.current = data.current
    item.position = data.position
    db.add(item)
    db.flush()
    audit(db, action, actor_id=actor_id, target_type="experience", target_id=str(item.id))
    db.commit()
    return experience_data(item)


@router.post("/experiences", status_code=201)
def create_experience(data: ExperienceIn, db: Db, session: Write):
    return save_experience(db, Experience(), data, session.account_id, "experience_created")


@router.put("/experiences/{experience_id}")
def update_experience(experience_id: int, data: ExperienceIn, db: Db, session: Write):
    item = db.get(Experience, experience_id)
    if not item:
        missing("Experience")
    return save_experience(db, item, data, session.account_id, "experience_updated")


@router.post("/experiences/{experience_id}/publish")
def publish_experience(experience_id: int, db: Db, session: Write):
    item = db.get(Experience, experience_id)
    if not item:
        missing("Experience")
    item.published_at = datetime.now(timezone.utc)
    audit(
        db,
        "experience_published",
        actor_id=session.account_id,
        target_type="experience",
        target_id=str(experience_id),
    )
    db.commit()
    return experience_data(item)


@router.post("/experiences/{experience_id}/unpublish")
def unpublish_experience(experience_id: int, db: Db, session: Write):
    item = db.get(Experience, experience_id)
    if not item:
        missing("Experience")
    item.published_at = None
    audit(
        db,
        "experience_unpublished",
        actor_id=session.account_id,
        target_type="experience",
        target_id=str(experience_id),
    )
    db.commit()
    return experience_data(item)


@router.delete("/experiences/{experience_id}", status_code=204)
def delete_experience(experience_id: int, db: Db, session: Write):
    item = db.get(Experience, experience_id)
    if not item:
        missing("Experience")
    db.delete(item)
    audit(
        db,
        "experience_deleted",
        actor_id=session.account_id,
        target_type="experience",
        target_id=str(experience_id),
    )
    db.commit()


@router.get("/profile")
def admin_profile(db: Db, _: Read):
    item = db.get(Profile, 1)
    if not item:
        return None
    return {
        field: getattr(item, field)
        for field in (
            "name",
            "headline",
            "introduction",
            "bio",
            "location",
            "interests",
            "skills",
            "education",
            "social_links",
            "resume_url",
            "public_email",
        )
    } | {"published_at": item.published_at.isoformat() if item.published_at else None}


@router.put("/profile")
def update_profile(data: ProfileIn, db: Db, session: Write):
    item = db.get(Profile, 1) or Profile(id=1)
    values = data.model_dump()
    values["social_links"] = [
        {"label": link.label, "url": str(link.url)} for link in data.social_links
    ]
    values["resume_url"] = str(data.resume_url) if data.resume_url else None
    values["public_email"] = str(data.public_email) if data.public_email else None
    for field, value in values.items():
        setattr(item, field, value)
    db.add(item)
    audit(db, "settings_updated", actor_id=session.account_id, target_type="profile", target_id="1")
    db.commit()
    return admin_profile(db, session)


@router.post("/profile/publish")
def publish_profile(db: Db, session: Write):
    item = db.get(Profile, 1)
    if not item:
        missing("Profile")
    item.published_at = datetime.now(timezone.utc)
    audit(
        db, "settings_published", actor_id=session.account_id, target_type="profile", target_id="1"
    )
    db.commit()
    return admin_profile(db, session)


@router.post("/profile/unpublish")
def unpublish_profile(db: Db, session: Write):
    item = db.get(Profile, 1)
    if not item:
        missing("Profile")
    item.published_at = None
    audit(
        db,
        "settings_unpublished",
        actor_id=session.account_id,
        target_type="profile",
        target_id="1",
    )
    db.commit()
    return admin_profile(db, session)


@router.get("/messages")
def messages(
    db: Db,
    _: Read,
    search: str | None = Query(default=None, max_length=100),
    read: bool | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    query = select(ContactMessage)
    if search:
        query = query.where(
            ContactMessage.email.ilike(f"%{search}%") | ContactMessage.name.ilike(f"%{search}%")
        )
    if read is not None:
        query = query.where(
            ContactMessage.read_at.is_not(None) if read else ContactMessage.read_at.is_(None)
        )
    items = db.scalars(
        query.order_by(ContactMessage.created_at.desc()).limit(limit).offset(offset)
    ).all()
    return [
        {
            "id": item.id,
            "name": item.name,
            "email": item.email,
            "message": item.message,
            "notification_status": item.notification_status,
            "created_at": item.created_at.isoformat(),
            "read_at": item.read_at.isoformat() if item.read_at else None,
        }
        for item in items
    ]


@router.patch("/messages/{message_id}")
def mark_message(message_id: int, data: MessageReadIn, db: Db, session: Write):
    item = db.get(ContactMessage, message_id)
    if not item:
        missing("Message")
    item.read_at = datetime.now(timezone.utc) if data.read else None
    audit(
        db,
        "message_status_updated",
        actor_id=session.account_id,
        target_type="message",
        target_id=str(message_id),
    )
    db.commit()
    return {"id": item.id, "read_at": item.read_at.isoformat() if item.read_at else None}


@router.delete("/messages/{message_id}", status_code=204)
def delete_message(message_id: int, db: Db, session: Write):
    item = db.get(ContactMessage, message_id)
    if not item:
        missing("Message")
    db.delete(item)
    audit(
        db,
        "message_deleted",
        actor_id=session.account_id,
        target_type="message",
        target_id=str(message_id),
    )
    db.commit()


@router.post("/projects/{project_id}/images", status_code=201)
async def add_image(
    project_id: int,
    db: Db,
    session: Write,
    settings: Config,
    file: Annotated[UploadFile, File()],
    alt: Annotated[str, Form(min_length=3, max_length=300)],
):
    project = db.get(Project, project_id)
    if not project:
        missing("Project")
    url, key = await upload_image(file, settings)
    try:
        image = ProjectImage(project_id=project_id, src=url, alt=alt, position=len(project.images))
        db.add(image)
        db.flush()
        audit(
            db,
            "image_uploaded",
            actor_id=session.account_id,
            target_type="project_image",
            target_id=str(image.id),
        )
        db.commit()
    except Exception:
        db.rollback()
        delete_image_object(key, settings)
        raise
    return {"id": image.id, "src": image.src, "alt": image.alt, "position": image.position}


@router.put("/projects/{project_id}/images/order")
def order_images(project_id: int, data: ImageOrderIn, db: Db, session: Write):
    project = db.get(Project, project_id)
    if not project:
        missing("Project")
    images = {image.id: image for image in project.images}
    if len(data.image_ids) != len(images) or set(data.image_ids) != set(images):
        raise AppError("invalid_order", 400, "Image order must include every image once.")
    for position, image_id in enumerate(data.image_ids):
        images[image_id].position = position
    audit(
        db,
        "images_reordered",
        actor_id=session.account_id,
        target_type="project",
        target_id=str(project_id),
    )
    db.commit()
    return {"image_ids": data.image_ids}


@router.patch("/projects/{project_id}/images/{image_id}")
def update_image(
    project_id: int,
    image_id: int,
    db: Db,
    session: Write,
    alt: str = Query(min_length=3, max_length=300),
    position: int = Query(ge=0),
):
    image = db.scalar(
        select(ProjectImage).where(
            ProjectImage.id == image_id, ProjectImage.project_id == project_id
        )
    )
    if not image:
        missing("Image")
    image.alt, image.position = alt, position
    audit(
        db,
        "image_updated",
        actor_id=session.account_id,
        target_type="project_image",
        target_id=str(image_id),
    )
    db.commit()
    return {"id": image.id, "src": image.src, "alt": image.alt, "position": image.position}


@router.delete("/projects/{project_id}/images/{image_id}", status_code=204)
def delete_image(project_id: int, image_id: int, db: Db, session: Write, settings: Config):
    image = db.scalar(
        select(ProjectImage).where(
            ProjectImage.id == image_id, ProjectImage.project_id == project_id
        )
    )
    if not image:
        missing("Image")
    key = key_from_url(image.src, settings)
    db.delete(image)
    audit(
        db,
        "image_deleted",
        actor_id=session.account_id,
        target_type="project_image",
        target_id=str(image_id),
    )
    db.commit()
    if key:
        delete_image_object(key, settings)

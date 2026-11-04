from typing import Annotated

from fastapi import APIRouter, Depends, Header, Query, Request
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.db.session import get_db
from app.repositories import public as repo
from app.schemas.public import (
    ContactIn,
    ContactOut,
    ExperienceOut,
    ProfileOut,
    ProjectOut,
    ProjectPage,
    TechnologyOut,
)
from app.services.contact import store_contact

router = APIRouter(prefix="/api/v1")
Db = Annotated[Session, Depends(get_db)]


@router.get("/health")
def health(db: Db) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ok"}


@router.get("/projects", response_model=ProjectPage)
def projects(
    db: Db,
    limit: Annotated[int, Query(ge=1, le=50)] = 12,
    offset: Annotated[int, Query(ge=0)] = 0,
    technology: Annotated[str | None, Query(max_length=100)] = None,
    featured: bool | None = None,
) -> ProjectPage:
    items, total = repo.list_projects(
        db, limit=limit, offset=offset, technology=technology, featured=featured
    )
    return ProjectPage(
        items=[ProjectOut.model_validate(item) for item in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/projects/{slug}", response_model=ProjectOut)
def project_detail(slug: str, db: Db) -> ProjectOut:
    project = repo.get_published_project(db, slug)
    if not project:
        raise AppError("not_found", 404, "Project not found.")
    return ProjectOut.model_validate(project)


@router.get("/technologies", response_model=list[TechnologyOut])
def technologies(
    db: Db, category: str | None = Query(default=None, max_length=40)
) -> list[TechnologyOut]:
    items = repo.list_technologies(db)
    return [
        TechnologyOut.model_validate(item)
        for item in items
        if not category or item.category == category
    ]


@router.get("/profile", response_model=ProfileOut)
def profile(db: Db) -> ProfileOut:
    item = repo.get_public_profile(db)
    if not item:
        raise AppError("not_found", 404, "Profile not found.")
    return ProfileOut.model_validate(item)


@router.get("/experiences", response_model=list[ExperienceOut])
def experiences(db: Db) -> list[ExperienceOut]:
    return [ExperienceOut.model_validate(item) for item in repo.list_experiences(db)]


@router.post("/contact", response_model=ContactOut, status_code=201)
def contact(
    data: ContactIn,
    db: Db,
    request: Request,
    idempotency_key: Annotated[str, Header(min_length=16, max_length=100, alias="Idempotency-Key")],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ContactOut:
    if data.website:
        raise AppError("invalid_request", 400, "Invalid request.")
    if request.headers.get("content-length") and int(request.headers["content-length"]) > 7000:
        raise AppError("payload_too_large", 413, "Payload too large.")
    trusted_proxy = (
        settings.contact_proxy_token
        and request.headers.get("X-Contact-Proxy-Token") == settings.contact_proxy_token
    )
    client_ip = request.headers.get("X-Contact-Client-IP") if trusted_proxy else None
    client_ip = client_ip or (request.client.host if request.client else "unknown")
    return store_contact(db, data, key=idempotency_key, client_ip=client_ip, settings=settings)

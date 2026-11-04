from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import ContactMessage, Experience, Profile, Project, Technology


def list_projects(
    db: Session, *, limit: int, offset: int, technology: str | None, featured: bool | None
) -> tuple[list[Project], int]:
    query = select(Project).where(Project.published_at.is_not(None))
    if technology:
        query = query.where(Project.technologies.any(Technology.name == technology))
    if featured is not None:
        query = query.where(Project.is_featured == featured)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = list(
        db.scalars(
            query.order_by(Project.published_at.desc(), Project.id.desc())
            .limit(limit)
            .offset(offset)
        ).all()
    )
    return items, total


def get_published_project(db: Session, slug: str) -> Project | None:
    return db.scalar(select(Project).where(Project.slug == slug, Project.published_at.is_not(None)))


def list_technologies(db: Session) -> list[Technology]:
    return list(db.scalars(select(Technology).order_by(Technology.category, Technology.name)).all())


def get_public_profile(db: Session) -> Profile | None:
    return db.scalar(select(Profile).where(Profile.id == 1, Profile.published_at.is_not(None)))


def list_experiences(db: Session) -> list[Experience]:
    return list(
        db.scalars(
            select(Experience)
            .where(Experience.published_at.is_not(None))
            .order_by(Experience.position, Experience.id)
        ).all()
    )


def find_contact_by_key(db: Session, key: str) -> ContactMessage | None:
    return db.scalar(select(ContactMessage).where(ContactMessage.idempotency_key == key))


def recent_contact_count(db: Session, ip_hash: str) -> int:
    since = datetime.now(timezone.utc) - timedelta(minutes=10)
    return (
        db.scalar(
            select(func.count(ContactMessage.id)).where(
                ContactMessage.ip_hash == ip_hash, ContactMessage.created_at >= since
            )
        )
        or 0
    )

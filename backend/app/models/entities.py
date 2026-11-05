from datetime import datetime

from sqlalchemy import (
    JSON,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

project_technologies = Table(
    "project_technologies",
    Base.metadata,
    Column("project_id", ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("technology_id", ForeignKey("technologies.id", ondelete="RESTRICT"), primary_key=True),
)


class Project(Base):
    __tablename__ = "projects"
    __table_args__ = (Index("ix_projects_published_featured", "published_at", "is_featured"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    summary: Mapped[str] = mapped_column(String(500))
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(80), default="draft")
    is_featured: Mapped[bool] = mapped_column(default=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    problem: Mapped[str | None] = mapped_column(Text)
    goals: Mapped[list[str] | None] = mapped_column(JSON)
    solution: Mapped[str | None] = mapped_column(Text)
    responsibilities: Mapped[list[str] | None] = mapped_column(JSON)
    architecture: Mapped[str | None] = mapped_column(Text)
    features: Mapped[list[str] | None] = mapped_column(JSON)
    challenges: Mapped[str | None] = mapped_column(Text)
    testing: Mapped[str | None] = mapped_column(Text)
    results: Mapped[str | None] = mapped_column(Text)
    lessons_learned: Mapped[str | None] = mapped_column(Text)
    repository_url: Mapped[str | None] = mapped_column(String(500))
    live_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    technologies: Mapped[list["Technology"]] = relationship(
        secondary=project_technologies, lazy="selectin"
    )
    images: Mapped[list["ProjectImage"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="ProjectImage.position",
    )


class Technology(Base):
    __tablename__ = "technologies"
    __table_args__ = (UniqueConstraint("name", name="uq_technologies_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(40))
    group: Mapped[str | None] = mapped_column(String(40))


class ProjectImage(Base):
    __tablename__ = "project_images"
    __table_args__ = (CheckConstraint("position >= 0", name="ck_project_images_position"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    src: Mapped[str] = mapped_column(String(500))
    alt: Mapped[str] = mapped_column(String(300))
    position: Mapped[int] = mapped_column(Integer, default=0)
    project: Mapped[Project] = relationship(back_populates="images")


class MediaAsset(Base):
    __tablename__ = "media_assets"
    __table_args__ = (
        CheckConstraint("byte_size > 0", name="ck_media_assets_size"),
        CheckConstraint("width > 0 AND height > 0", name="ck_media_assets_dimensions"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    storage_key: Mapped[str] = mapped_column(String(200), unique=True)
    storage_backend: Mapped[str] = mapped_column(String(10))
    url: Mapped[str] = mapped_column(String(600))
    alt: Mapped[str] = mapped_column(String(300))
    content_type: Mapped[str] = mapped_column(String(40))
    byte_size: Mapped[int] = mapped_column(Integer)
    width: Mapped[int] = mapped_column(Integer)
    height: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    assignments: Mapped[list["MediaAssignment"]] = relationship(back_populates="asset")


class MediaAssignment(Base):
    __tablename__ = "media_assignments"
    __table_args__ = (
        CheckConstraint("position >= 0", name="ck_media_assignments_position"),
        UniqueConstraint("slot", "project_id", "position", name="uq_media_assignment_position"),
        Index("ix_media_assignments_asset_id", "asset_id"),
        Index(
            "uq_media_global_slot",
            "slot",
            unique=True,
            postgresql_where=text("project_id IS NULL"),
            sqlite_where=text("project_id IS NULL"),
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    asset_id: Mapped[str] = mapped_column(ForeignKey("media_assets.id", ondelete="RESTRICT"))
    slot: Mapped[str] = mapped_column(String(40), index=True)
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    position: Mapped[int] = mapped_column(Integer, default=0)
    asset: Mapped[MediaAsset] = relationship(back_populates="assignments")


class Experience(Base):
    __tablename__ = "experiences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    role: Mapped[str] = mapped_column(String(160))
    organization: Mapped[str] = mapped_column(String(160))
    start_date: Mapped[str] = mapped_column(String(30))
    end_date: Mapped[str | None] = mapped_column(String(30))
    current: Mapped[bool] = mapped_column(default=False)
    summary: Mapped[str] = mapped_column(Text)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    position: Mapped[int] = mapped_column(Integer, default=0)


class Profile(Base):
    __tablename__ = "profile"
    __table_args__ = (CheckConstraint("id = 1", name="ck_profile_singleton"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    name: Mapped[str] = mapped_column(String(160))
    headline: Mapped[str] = mapped_column(String(250))
    introduction: Mapped[str | None] = mapped_column(Text)
    bio: Mapped[str] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(String(160))
    interests: Mapped[list[str] | None] = mapped_column(JSON)
    skills: Mapped[list[str] | None] = mapped_column(JSON)
    education: Mapped[list[dict] | None] = mapped_column(JSON)
    social_links: Mapped[list[dict] | None] = mapped_column(JSON)
    resume_url: Mapped[str | None] = mapped_column(String(500))
    public_email: Mapped[str | None] = mapped_column(String(254))
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class ContactMessage(Base):
    __tablename__ = "contact_messages"
    __table_args__ = (Index("ix_contact_messages_ip_created", "ip_hash", "created_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    idempotency_key: Mapped[str] = mapped_column(String(100), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(254))
    message: Mapped[str] = mapped_column(Text)
    ip_hash: Mapped[str] = mapped_column(String(64))
    notification_status: Mapped[str] = mapped_column(String(30), default="not_configured")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AdminAccount(Base):
    __tablename__ = "admin_accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AdminSession(Base):
    __tablename__ = "admin_sessions"
    __table_args__ = (Index("ix_admin_sessions_expiry", "expires_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("admin_accounts.id", ondelete="CASCADE"))
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    csrf_token: Mapped[str] = mapped_column(String(64))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    account: Mapped[AdminAccount] = relationship()


class LoginAttempt(Base):
    __tablename__ = "login_attempts"
    __table_args__ = (Index("ix_login_attempts_ip_created", "ip_hash", "created_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ip_hash: Mapped[str] = mapped_column(String(64))
    succeeded: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    actor_id: Mapped[int | None] = mapped_column(
        ForeignKey("admin_accounts.id", ondelete="SET NULL")
    )
    action: Mapped[str] = mapped_column(String(80))
    target_type: Mapped[str | None] = mapped_column(String(80))
    target_id: Mapped[str | None] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

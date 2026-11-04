"""Import verified portfolio content without deleting existing records."""

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from pydantic import BaseModel, Field, HttpUrl
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_session_factory
from app.models.entities import Experience, Profile, Project, ProjectImage, Technology


class TechnologyInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    category: str = Field(min_length=1, max_length=40)
    group: str | None = Field(default=None, max_length=40)


class ImageInput(BaseModel):
    src: str = Field(min_length=1, max_length=500)
    alt: str = Field(min_length=1, max_length=300)


class ProjectInput(BaseModel):
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=120)
    title: str = Field(min_length=1, max_length=200)
    summary: str = Field(min_length=1, max_length=500)
    description: str = Field(min_length=1)
    category: str | None = None
    status: str = "draft"
    featured: bool = False
    placeholder: bool = False
    publish: bool = False
    technologies: list[str] = Field(default_factory=list)
    images: list[ImageInput] = Field(default_factory=list)
    problem: str | None = None
    goals: list[str] | None = None
    solution: str | None = None
    responsibilities: list[str] | None = None
    architecture: str | None = None
    features: list[str] | None = None
    challenges: str | None = None
    testing: str | None = None
    results: str | None = None
    lessons_learned: str | None = None
    repository_url: HttpUrl | None = None
    live_url: HttpUrl | None = None


class ProfileInput(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    headline: str = Field(min_length=1, max_length=250)
    bio: str = Field(min_length=1)
    introduction: str | None = None
    location: str | None = None
    interests: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    education: list[dict] = Field(default_factory=list)
    social_links: list[dict] = Field(default_factory=list)
    resume_url: str | None = None
    public_email: str | None = None
    placeholder: bool = False
    publish: bool = False


class ExperienceInput(BaseModel):
    role: str
    organization: str
    start_date: str
    end_date: str | None = None
    summary: str
    position: int = 0
    placeholder: bool = False
    publish: bool = False


class ContentInput(BaseModel):
    technologies: list[TechnologyInput] = Field(default_factory=list)
    projects: list[ProjectInput] = Field(default_factory=list)
    profile: ProfileInput | None = None
    experiences: list[ExperienceInput] = Field(default_factory=list)


PROJECT_FIELDS = (
    "title",
    "summary",
    "description",
    "category",
    "status",
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
)


def import_content(db: Session, content: ContentInput) -> dict[str, int]:
    counts = {"technologies": 0, "projects": 0, "profile": 0, "experiences": 0}
    names = [item.name for item in content.technologies]
    slugs = [item.slug for item in content.projects]
    if len(names) != len(set(names)) or len(slugs) != len(set(slugs)):
        raise ValueError("Duplicate technology name or project slug in import file")

    technologies: dict[str, Technology] = {}
    for item in content.technologies:
        record = db.scalar(select(Technology).where(Technology.name == item.name))
        if record is None:
            record = Technology(name=item.name)
            db.add(record)
        record.category = item.category
        record.group = item.group
        technologies[item.name] = record
        counts["technologies"] += 1

    for item in content.projects:
        if item.placeholder:
            continue
        missing = set(item.technologies) - technologies.keys()
        if missing:
            raise ValueError(f"Unknown technologies for {item.slug}: {sorted(missing)}")
        record = db.scalar(select(Project).where(Project.slug == item.slug))
        if record is None:
            record = Project(slug=item.slug)
            db.add(record)
        for field in PROJECT_FIELDS:
            setattr(record, field, getattr(item, field))
        record.is_featured = item.featured
        record.repository_url = str(item.repository_url) if item.repository_url else None
        record.live_url = str(item.live_url) if item.live_url else None
        record.published_at = (
            record.published_at or datetime.now(timezone.utc) if item.publish else None
        )
        record.technologies = [technologies[name] for name in item.technologies]
        record.images = [
            ProjectImage(src=image.src, alt=image.alt, position=index)
            for index, image in enumerate(item.images)
        ]
        counts["projects"] += 1

    if content.profile and not content.profile.placeholder:
        item = content.profile
        record = db.get(Profile, 1)
        if record is None:
            record = Profile(id=1)
            db.add(record)
        for field in (
            "name",
            "headline",
            "bio",
            "introduction",
            "location",
            "interests",
            "skills",
            "education",
            "social_links",
            "resume_url",
            "public_email",
        ):
            setattr(record, field, getattr(item, field))
        record.published_at = (
            record.published_at or datetime.now(timezone.utc) if item.publish else None
        )
        counts["profile"] = 1

    for item in content.experiences:
        if item.placeholder:
            continue
        record = db.scalar(
            select(Experience).where(
                Experience.role == item.role,
                Experience.organization == item.organization,
                Experience.start_date == item.start_date,
            )
        )
        if record is None:
            record = Experience(
                role=item.role, organization=item.organization, start_date=item.start_date
            )
            db.add(record)
        record.end_date = item.end_date
        record.summary = item.summary
        record.position = item.position
        record.published_at = (
            record.published_at or datetime.now(timezone.utc) if item.publish else None
        )
        counts["experiences"] += 1
    db.flush()
    return counts


def main() -> None:
    parser = argparse.ArgumentParser(description="Import verified DEVFOLIO content")
    parser.add_argument("source", type=Path)
    parser.add_argument("--commit", action="store_true", help="Save changes; default is dry run")
    args = parser.parse_args()
    content = ContentInput.model_validate(json.loads(args.source.read_text(encoding="utf-8")))
    with get_session_factory()() as db:
        counts = import_content(db, content)
        if args.commit:
            db.commit()
        else:
            db.rollback()
    print(json.dumps({"committed": args.commit, "processed": counts}, ensure_ascii=False))


if __name__ == "__main__":
    main()

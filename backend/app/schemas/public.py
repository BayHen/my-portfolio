from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TechnologyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: str
    category: str
    group: str | None


class ImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    src: str
    alt: str


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    slug: str
    title: str
    summary: str
    description: str
    category: str | None
    status: str
    is_featured: bool
    published_at: datetime
    problem: str | None
    goals: list[str] | None
    solution: str | None
    responsibilities: list[str] | None
    architecture: str | None
    features: list[str] | None
    challenges: str | None
    testing: str | None
    results: str | None
    lessons_learned: str | None
    repository_url: str | None
    live_url: str | None
    technologies: list[TechnologyOut]
    thumbnail: ImageOut | None = None
    images: list[ImageOut]


class ProjectPage(BaseModel):
    items: list[ProjectOut]
    total: int
    limit: int
    offset: int


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: str
    headline: str
    introduction: str | None
    bio: str
    location: str | None
    interests: list[str] | None
    skills: list[str] | None
    education: list[dict] | None
    social_links: list[dict] | None
    resume_url: str | None
    public_email: str | None


class ExperienceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    role: str
    organization: str
    start_date: str
    end_date: str | None
    summary: str


class ContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    message: str = Field(min_length=10, max_length=5000)
    website: str = Field(default="", max_length=200)


class ContactOut(BaseModel):
    stored: bool
    notification: str

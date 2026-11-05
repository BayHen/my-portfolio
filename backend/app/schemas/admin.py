from datetime import date

from pydantic import BaseModel, EmailStr, Field, HttpUrl, field_validator, model_validator


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ProjectIn(BaseModel):
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=120)
    title: str = Field(min_length=1, max_length=200)
    summary: str = Field(min_length=1, max_length=500)
    description: str = Field(min_length=1, max_length=50000)
    category: str | None = Field(default=None, max_length=80)
    status: str = Field(default="draft", max_length=80)
    is_featured: bool = False
    technology_ids: list[int] = Field(default_factory=list, max_length=30)
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

    @field_validator("repository_url", "live_url")
    @classmethod
    def secure_project_urls(cls, value):
        if value and value.scheme != "https":
            raise ValueError("Public URLs must use HTTPS")
        return value


class TechnologyIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    category: str = Field(min_length=1, max_length=40)
    group: str | None = Field(default=None, max_length=40)


class ExperienceIn(BaseModel):
    role: str = Field(min_length=1, max_length=160)
    organization: str = Field(min_length=1, max_length=160)
    summary: str = Field(min_length=1, max_length=10000)
    start_date: date
    end_date: date | None = None
    current: bool = False
    position: int = Field(default=0, ge=0)

    @model_validator(mode="after")
    def check_dates(self):
        if self.current and self.end_date:
            raise ValueError("Current experience cannot have an end date")
        if not self.current and self.end_date is None:
            raise ValueError("Finished experience requires an end date")
        if self.end_date and self.end_date < self.start_date:
            raise ValueError("End date must follow start date")
        return self


class SocialLinkIn(BaseModel):
    label: str = Field(min_length=1, max_length=100)
    url: HttpUrl

    @field_validator("url")
    @classmethod
    def secure_url(cls, value):
        if value.scheme != "https":
            raise ValueError("Public URLs must use HTTPS")
        return value


class ProfileIn(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    headline: str = Field(min_length=1, max_length=250)
    introduction: str | None = None
    bio: str = Field(min_length=1, max_length=20000)
    location: str | None = Field(default=None, max_length=160)
    interests: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    education: list[dict] = Field(default_factory=list)
    social_links: list[SocialLinkIn] = Field(default_factory=list)
    resume_url: HttpUrl | None = None
    public_email: EmailStr | None = None

    @field_validator("resume_url")
    @classmethod
    def secure_resume_url(cls, value):
        if value and value.scheme != "https":
            raise ValueError("Resume URL must use HTTPS")
        return value


class ImageOrderIn(BaseModel):
    image_ids: list[int] = Field(min_length=1)


class MessageReadIn(BaseModel):
    read: bool

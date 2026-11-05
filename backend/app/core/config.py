from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    app_env: str = "development"
    debug: bool = False
    cors_origins: list[str] = Field(default_factory=list)
    frontend_origin: str = "http://localhost:3000"
    contact_hash_secret: str = Field(min_length=24)
    contact_notify_resend_api_key: str | None = None
    contact_notify_from_email: str | None = None
    contact_notify_to_email: str | None = None
    contact_proxy_token: str | None = None
    admin_session_hours: int = Field(default=8, ge=1, le=72)
    admin_cookie_secure: bool = True
    admin_proxy_token: str | None = None
    s3_bucket: str | None = None
    s3_region: str = "us-east-1"
    s3_endpoint_url: str | None = None
    s3_public_base_url: str | None = None

    @model_validator(mode="after")
    def production_admin_security(self):
        if any(
            origin == "*" or not origin.startswith(("http://", "https://"))
            for origin in self.cors_origins
        ):
            raise ValueError("CORS_ORIGINS must contain explicit HTTP origins")
        if self.app_env == "production" and self.debug:
            raise ValueError("DEBUG must be false in production")
        if self.app_env == "production" and (
            not self.admin_cookie_secure
            or not self.admin_proxy_token
            or len(self.admin_proxy_token) < 32
        ):
            raise ValueError("Production admin requires secure cookies and a long proxy token")
        if (
            self.app_env == "production"
            and self.s3_public_base_url
            and not self.s3_public_base_url.startswith("https://")
        ):
            raise ValueError("Production image URLs must use HTTPS")
        return self

    @property
    def notification_configured(self) -> bool:
        return all(
            (
                self.contact_notify_resend_api_key,
                self.contact_notify_from_email,
                self.contact_notify_to_email,
            )
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    app_env: str = "development"
    frontend_origin: str = "http://localhost:3000"
    contact_hash_secret: str = Field(min_length=24)
    contact_notify_resend_api_key: str | None = None
    contact_notify_from_email: str | None = None
    contact_notify_to_email: str | None = None
    contact_proxy_token: str | None = None

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

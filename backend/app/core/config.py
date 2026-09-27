"""Application settings, read from backend/.env (never committed) and the process environment."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore")

    # Database
    database_url: str
    database_url_direct: str | None = None
    test_database_url: str | None = None

    # Auth
    jwt_secret: str = Field(min_length=32)
    jwt_expire_days: int = Field(default=7, ge=1, le=30)
    cookie_secure: bool = True

    # First admin (used by `python -m app.cli create-admin`)
    admin_email: str | None = None
    admin_password: str | None = None
    admin_name: str = "Restaurant Admin"

    # Web
    frontend_url: str = "http://localhost:3000"
    trust_proxy: bool = False
    ratelimit_storage_uri: str = "memory://"
    ratelimit_enabled: bool = True
    free_delivery_threshold: int = Field(default=1500, ge=0)
    log_level: str = "info"

    @field_validator("database_url", "database_url_direct", "test_database_url")
    @classmethod
    def _use_psycopg_driver(cls, value: str | None) -> str | None:
        """Accept a plain Neon `postgresql://` string and pin it to the psycopg 3 driver."""
        if value and value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        if value and value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)
        return value

    @property
    def frontend_origins(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.frontend_url.split(",") if origin.strip()]

    @property
    def migration_database_url(self) -> str:
        """Alembic uses the direct (unpooled) Neon host when provided."""
        return self.database_url_direct or self.database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()  # values come from the environment

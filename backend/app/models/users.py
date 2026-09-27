"""Customer and admin accounts."""

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, text
from sqlmodel import Field, SQLModel

from app.models._types import tstz


class User(SQLModel, table=True):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('customer','admin')", name="ck_users_role"),
        CheckConstraint("email IS NOT NULL OR phone IS NOT NULL", name="ck_users_contact"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    email: str | None = Field(default=None, unique=True)  # lowercased
    phone: str | None = Field(default=None, unique=True)  # normalised +923XXXXXXXXX
    password_hash: str  # Argon2id
    role: str = Field(default="customer", sa_column_kwargs={"server_default": text("'customer'")})
    is_active: bool = Field(default=True, sa_column_kwargs={"server_default": text("true")})
    created_at: datetime | None = Field(default=None, sa_column=tstz())
    last_login_at: datetime | None = Field(default=None, sa_column=tstz(nullable=True, now=False))

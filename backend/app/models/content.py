"""Reviews, contact messages, newsletter sign-ups and sample testimonials."""

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, Column, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlmodel import Field, SQLModel

from app.models._types import tstz


class Review(SQLModel, table=True):
    __tablename__ = "review"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_review_rating"),
        CheckConstraint("status IN ('pending','approved','rejected')", name="ck_review_status"),
    )

    id: int | None = Field(default=None, primary_key=True)
    order_id: uuid.UUID = Field(
        sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("orders.id"), unique=True, nullable=False)
    )  # one review per order
    user_id: uuid.UUID = Field(sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False))
    rating: int
    comment: str | None = None
    status: str = Field(default="pending", sa_column_kwargs={"server_default": text("'pending'")})
    created_at: datetime | None = Field(default=None, sa_column=tstz())
    moderated_at: datetime | None = Field(default=None, sa_column=tstz(nullable=True, now=False))
    moderated_by: uuid.UUID | None = Field(
        default=None, sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    )


class ContactMessage(SQLModel, table=True):
    __tablename__ = "contact_message"

    id: int | None = Field(default=None, primary_key=True)
    name: str
    phone: str | None = None
    email: str | None = None
    message: str
    is_read: bool = Field(default=False, sa_column_kwargs={"server_default": text("false")})
    created_at: datetime | None = Field(default=None, sa_column=tstz())


class NewsletterSubscriber(SQLModel, table=True):
    __tablename__ = "newsletter_subscriber"

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True)  # lowercased
    created_at: datetime | None = Field(default=None, sa_column=tstz())


class SampleTestimonial(SQLModel, table=True):
    """Phase 1 sample reviews, shown (labelled) until 3 real reviews are approved."""

    __tablename__ = "sample_testimonial"

    id: str = Field(primary_key=True)
    name: str
    area: str
    quote: str
    rating: int

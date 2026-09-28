"""Review shapes (contracts/openapi.yaml: ReviewInput, AdminReview, Testimonial)."""

from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.base import CamelModel, CamelRequest


class ReviewInput(CamelRequest):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=3, max_length=500)


class ModerateInput(CamelRequest):
    status: Literal["approved", "rejected"]


class AdminReviewOut(CamelModel):
    id: int
    order_id: str  # "KBG-10001"
    customer_name: str
    area_name: str
    rating: int
    comment: str | None
    status: Literal["pending", "approved", "rejected"]
    created_at: datetime


class TestimonialOut(CamelModel):
    __test__ = False  # not a pytest class, despite the name

    id: str
    name: str
    area: str
    quote: str
    rating: int
    month: str | None = None  # "2026-09" for real reviews
    is_sample: bool

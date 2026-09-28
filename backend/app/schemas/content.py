"""Contact-form and newsletter shapes (contracts/openapi.yaml: content tag and admin messages)."""

from datetime import datetime

from pydantic import Field, model_validator

from app.schemas.base import CamelModel, CamelRequest


class ContactMessageInput(CamelRequest):
    name: str = Field(min_length=2, max_length=60)
    phone: str | None = Field(default=None, max_length=30)
    email: str | None = Field(default=None, max_length=254)
    message: str = Field(min_length=10, max_length=1000)

    @model_validator(mode="after")
    def _needs_a_way_to_reply(self) -> "ContactMessageInput":
        if not (self.phone and self.phone.strip()) and not (self.email and self.email.strip()):
            raise ValueError("Add a phone number or an email so we can reply.")
        return self


class NewsletterInput(CamelRequest):
    email: str = Field(max_length=254)


class ContactMessageOut(CamelModel):
    id: int
    name: str
    phone: str | None = None
    email: str | None = None
    message: str
    is_read: bool
    created_at: datetime


class ContactMessagePatch(CamelRequest):
    is_read: bool


class SubscriberOut(CamelModel):
    email: str
    created_at: datetime

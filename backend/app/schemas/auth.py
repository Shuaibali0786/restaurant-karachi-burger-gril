"""Login/signup/session shapes (contracts/openapi.yaml: auth tag)."""

from pydantic import Field, model_validator

from app.schemas.base import CamelModel, CamelRequest


class LoginInput(CamelRequest):
    identifier: str = Field(max_length=254)  # email or phone
    password: str = Field(max_length=128)


class SessionUser(CamelModel):
    id: str
    name: str
    email: str | None = None
    phone: str | None = None
    role: str


class SignupInput(CamelRequest):
    name: str = Field(min_length=2, max_length=60)
    email: str | None = Field(default=None, max_length=254)
    phone: str | None = Field(default=None, max_length=30)
    password: str = Field(min_length=8, max_length=128)

    @model_validator(mode="after")
    def _needs_a_contact(self) -> "SignupInput":
        if not (self.email and self.email.strip()) and not (self.phone and self.phone.strip()):
            raise ValueError("Provide an email or a mobile number.")
        return self


class ReorderLine(CamelModel):
    item_slug: str
    option_id: str
    addon_ids: list[str]
    note: str
    quantity: int


class ReorderResult(CamelModel):
    lines: list[ReorderLine]
    skipped: list[str]

"""Login/session shapes (contracts/openapi.yaml: auth tag). Signup is User Story 5."""

from pydantic import Field

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

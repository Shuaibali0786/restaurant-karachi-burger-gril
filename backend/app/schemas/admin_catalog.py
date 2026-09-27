"""Admin menu-editing shapes (contracts/openapi.yaml: AdminMenuItem, MenuItemPatch).

Exposed early (ahead of the full admin menu screen in US6) so staff can mark an item sold out
through the API/`/docs` while the admin UI is still being built.
"""

from pydantic import Field, model_validator

from app.schemas.base import CamelModel, CamelRequest


class AdminMenuItemOut(CamelModel):
    slug: str
    name: str
    category: str
    base_price: int
    available: bool
    sold_out: bool


class MenuItemPatch(CamelRequest):
    base_price: int | None = Field(default=None, ge=1, le=100_000)
    available: bool | None = None
    sold_out: bool | None = None

    @model_validator(mode="after")
    def _at_least_one_field(self) -> "MenuItemPatch":
        if self.base_price is None and self.available is None and self.sold_out is None:
            raise ValueError("Provide at least one of basePrice, available or soldOut.")
        return self

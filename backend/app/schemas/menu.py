"""Menu response shapes (contracts/openapi.yaml). Field names match frontend/src/lib/types.ts."""

from typing import Annotated, Literal

from pydantic import Field

from app.schemas.base import CamelModel


class OptionOut(CamelModel):
    id: str
    label: str
    price_delta: int
    includes: str | None = None


class AddonOut(CamelModel):
    id: str
    label: str
    price: int


class OptionGroupOut(CamelModel):
    label: str
    required: Literal[True] = True
    options: list[OptionOut]


class CategoryOut(CamelModel):
    id: str
    name: str
    image: str
    image_alt: str
    order: int
    option_group: OptionGroupOut
    addons: list[AddonOut]


class MenuItemViewOut(CamelModel):
    slug: str
    name: str
    category: str
    base_price: int
    image: str
    image_alt: str
    description: str
    tag: str | None
    rating: float
    popularity: int
    featured: list[str]
    options: list[OptionOut]
    addons: list[AddonOut]
    sold_out: bool
    available: bool


class PricePromoOut(CamelModel):
    id: str
    title: str
    kind: Literal["price"]
    item_slug: str
    price: int
    was_price: int
    image: str


class WeekdayPercentPromoOut(CamelModel):
    id: str
    title: str
    kind: Literal["weekday-percent"]
    item_slug: str
    weekday: int
    percent: int
    image: str


PromoOut = Annotated[PricePromoOut | WeekdayPercentPromoOut, Field(discriminator="kind")]


class DeliveryAreaOut(CamelModel):
    id: str
    name: str
    fee: int

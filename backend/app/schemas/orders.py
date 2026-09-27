"""Order request/response shapes (contracts/openapi.yaml). No price fields are accepted from the
client (`extra="forbid"`): the server prices everything (FR-005)."""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import Field

from app.schemas.base import CamelModel, CamelRequest


class CustomerIn(CamelRequest):
    name: str = Field(min_length=2, max_length=60)
    phone: str = Field(max_length=32)


class DeliveryIn(CamelRequest):
    area: str
    address: str = Field(min_length=10, max_length=200)
    landmark: str | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=200)


class TimingAsapIn(CamelRequest):
    type: Literal["asap"]


class TimingScheduledIn(CamelRequest):
    type: Literal["scheduled"]
    slot: datetime


TimingIn = Annotated[TimingAsapIn | TimingScheduledIn, Field(discriminator="type")]


class OrderLineIn(CamelRequest):
    item_slug: str
    option_id: str
    addon_ids: list[str] = Field(default_factory=list, max_length=10)
    note: str = Field(default="", max_length=500)
    quantity: int = Field(ge=1, le=20)
    # Used only to explain an ended deal to the customer; never affects the price.
    added_at: datetime


class PlaceOrderInput(CamelRequest):
    customer: CustomerIn
    delivery: DeliveryIn
    timing: TimingIn
    payment: Literal["cod"]
    lines: list[OrderLineIn] = Field(min_length=1, max_length=50)


# ---------------------------------------------------------------- responses


class OrderLineOut(CamelModel):
    item_slug: str
    name: str
    option_id: str
    option_label: str
    addon_ids: list[str]
    addon_labels: list[str]
    note: str
    quantity: int
    unit_price: int
    discount: int
    line_total: int


class TotalsOut(CamelModel):
    subtotal: int
    discount: int
    delivery: int
    total: int


class OrderCustomerOut(CamelModel):
    name: str
    phone: str


class OrderDeliveryOut(CamelModel):
    area: str
    area_name: str
    address: str | None = None
    landmark: str | None = None
    notes: str | None = None


class TimingAsapOut(CamelModel):
    type: Literal["asap"] = "asap"


class TimingScheduledOut(CamelModel):
    type: Literal["scheduled"] = "scheduled"
    slot: datetime


TimingOut = Annotated[TimingAsapOut | TimingScheduledOut, Field(discriminator="type")]

OrderStatus = Literal["confirmed", "preparing", "on-the-way", "delivered", "cancelled"]


class StatusEventOut(CamelModel):
    status: OrderStatus
    at: datetime


class ReviewSummaryOut(CamelModel):
    rating: int
    status: Literal["pending", "approved", "rejected"]


class OrderOut(CamelModel):
    id: str  # "KBG-10001"
    customer: OrderCustomerOut
    delivery: OrderDeliveryOut
    timing: TimingOut
    payment: Literal["cod"]
    lines: list[OrderLineOut]
    totals: TotalsOut
    placed_at: datetime
    status: OrderStatus
    status_history: list[StatusEventOut]
    viewer: Literal["public", "owner", "admin"]
    review: ReviewSummaryOut | None = None

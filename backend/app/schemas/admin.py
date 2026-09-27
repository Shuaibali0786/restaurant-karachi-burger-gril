"""Admin dashboard shapes (contracts/openapi.yaml: admin tag)."""

from datetime import date, datetime

from app.schemas.base import CamelModel, CamelRequest
from app.schemas.orders import OrderStatus, TimingOut


class AdminOrderSummary(CamelModel):
    id: str
    customer_name: str
    area_name: str
    status: OrderStatus
    total: int
    item_count: int
    timing: TimingOut
    placed_at: datetime


class StatusChangeInput(CamelRequest):
    status: OrderStatus
    expected_status: OrderStatus


class TodaySummary(CamelModel):
    business_date: date
    order_count: int
    sales_total: int
    by_status: dict[str, int]

"""Orders, their line snapshots and the status history."""

import uuid
from datetime import date, datetime

from sqlalchemy import BigInteger, CheckConstraint, Column, ForeignKey, Index, Text, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlmodel import Field, SQLModel

from app.models._types import tstz

ORDER_STATUSES = ("confirmed", "preparing", "on-the-way", "delivered", "cancelled")


class Order(SQLModel, table=True):
    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint("timing_type IN ('asap','scheduled')", name="ck_orders_timing_type"),
        CheckConstraint("(timing_type = 'scheduled') = (scheduled_for IS NOT NULL)", name="ck_orders_scheduled_for"),
        CheckConstraint("payment = 'cod'", name="ck_orders_payment"),
        CheckConstraint(
            "status IN ('confirmed','preparing','on-the-way','delivered','cancelled')", name="ck_orders_status"
        ),
        CheckConstraint(
            "subtotal >= 0 AND discount >= 0 AND delivery_fee >= 0 AND total >= 0", name="ck_orders_amounts"
        ),
        CheckConstraint("total = subtotal - discount + delivery_fee", name="ck_orders_total"),
        Index("ix_orders_business_date_status", "business_date", "status"),
        Index("ix_orders_placed_at", "placed_at"),
        Index("ix_orders_user_placed", "user_id", "placed_at"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    # Public number KBG-{number}; drawn from order_number_seq (created in migration 0001).
    number: int | None = Field(
        default=None,
        sa_column=Column(BigInteger, unique=True, nullable=False, server_default=text("nextval('order_number_seq')")),
    )
    idempotency_key: uuid.UUID = Field(sa_column=Column(PG_UUID(as_uuid=True), unique=True, nullable=False))
    request_hash: str
    user_id: uuid.UUID | None = Field(
        default=None, sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    )
    customer_name: str
    customer_phone: str
    area_id: str = Field(sa_column=Column(Text, ForeignKey("delivery_area.id"), nullable=False))
    area_name: str  # snapshot
    address: str
    landmark: str | None = None
    notes: str | None = None
    timing_type: str
    scheduled_for: datetime | None = Field(default=None, sa_column=tstz(nullable=True, now=False))
    payment: str = Field(default="cod", sa_column_kwargs={"server_default": text("'cod'")})
    status: str = Field(default="confirmed", sa_column_kwargs={"server_default": text("'confirmed'")})
    subtotal: int
    discount: int
    delivery_fee: int
    total: int
    placed_at: datetime | None = Field(default=None, sa_column=tstz())
    business_date: date
    updated_at: datetime | None = Field(default=None, sa_column=tstz())


class OrderLine(SQLModel, table=True):
    """A snapshot taken at order time; later menu edits never change it."""

    __tablename__ = "order_line"
    __table_args__ = (
        CheckConstraint("quantity >= 1 AND quantity <= 20", name="ck_order_line_quantity"),
        CheckConstraint("unit_price >= 0 AND discount >= 0 AND line_total >= 0", name="ck_order_line_amounts"),
    )

    id: int | None = Field(default=None, primary_key=True)
    order_id: uuid.UUID = Field(
        sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    )
    position: int
    item_slug: str  # not an FK: snapshots must survive menu changes
    item_name: str
    option_key: str
    option_label: str
    addon_keys: list[str] = Field(default_factory=list, sa_column=Column(JSONB, nullable=False))
    addon_labels: list[str] = Field(default_factory=list, sa_column=Column(JSONB, nullable=False))
    note: str = ""
    quantity: int
    unit_price: int
    discount: int  # for the whole line (per-unit discount x quantity)
    line_total: int


class OrderStatusEvent(SQLModel, table=True):
    __tablename__ = "order_status_event"

    id: int | None = Field(default=None, primary_key=True)
    order_id: uuid.UUID = Field(
        sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    )
    from_status: str | None = None  # NULL for the initial "confirmed" event
    to_status: str
    changed_by: uuid.UUID | None = Field(
        default=None, sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    )  # NULL = system (order placement)
    changed_at: datetime | None = Field(default=None, sa_column=tstz())

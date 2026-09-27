"""Delivery areas and their fees."""

from sqlalchemy import CheckConstraint, text
from sqlmodel import Field, SQLModel


class DeliveryArea(SQLModel, table=True):
    __tablename__ = "delivery_area"
    __table_args__ = (CheckConstraint("fee >= 0 AND fee <= 2000", name="ck_delivery_area_fee"),)

    id: str = Field(primary_key=True)  # slug, immutable: saddar, clifton, ...
    name: str = Field(unique=True)
    fee: int  # integer rupees; seeded at 150
    is_enabled: bool = Field(default=True, sa_column_kwargs={"server_default": text("true")})
    sort_order: int = 0

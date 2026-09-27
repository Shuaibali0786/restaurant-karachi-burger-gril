"""Menu tables: categories, their options and add-ons, items and promos (data-model.md)."""

from datetime import datetime

from sqlalchemy import CheckConstraint, Column, ForeignKey, Numeric, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlmodel import Field, SQLModel

from app.models._types import tstz


class Category(SQLModel, table=True):
    __tablename__ = "category"

    id: str = Field(primary_key=True)  # slug: burgers, wraps, ...
    name: str
    image: str
    image_alt: str
    sort_order: int = Field(unique=True)
    option_group_label: str


class CategoryOption(SQLModel, table=True):
    __tablename__ = "category_option"
    __table_args__ = (
        UniqueConstraint("category_id", "key"),
        CheckConstraint("price_delta >= 0", name="ck_category_option_price_delta"),
    )

    id: int | None = Field(default=None, primary_key=True)
    category_id: str = Field(sa_column=Column(Text, ForeignKey("category.id"), nullable=False, index=True))
    key: str  # the frontend Option.id, e.g. "single", "meal"
    label: str
    price_delta: int
    includes: str | None = None
    sort_order: int = 0


class CategoryAddon(SQLModel, table=True):
    __tablename__ = "category_addon"
    __table_args__ = (
        UniqueConstraint("category_id", "key"),
        CheckConstraint("price > 0", name="ck_category_addon_price"),
    )

    id: int | None = Field(default=None, primary_key=True)
    category_id: str = Field(sa_column=Column(Text, ForeignKey("category.id"), nullable=False, index=True))
    key: str
    label: str
    price: int
    sort_order: int = 0


class MenuItem(SQLModel, table=True):
    __tablename__ = "menu_item"
    __table_args__ = (
        CheckConstraint("base_price > 0 AND base_price <= 100000", name="ck_menu_item_base_price"),
        CheckConstraint("tag IS NULL OR tag IN ('bestseller','chef-pick','hot','new','veg')", name="ck_menu_item_tag"),
        CheckConstraint("rating >= 0 AND rating <= 5", name="ck_menu_item_rating"),
    )

    id: int | None = Field(default=None, primary_key=True)
    slug: str = Field(unique=True, index=True)
    name: str
    category_id: str = Field(sa_column=Column(Text, ForeignKey("category.id"), nullable=False, index=True))
    base_price: int  # integer rupees; editable by admin
    description: str
    image: str
    image_alt: str
    tag: str | None = None
    rating: float = Field(sa_column=Column(Numeric(2, 1, asdecimal=False), nullable=False))
    popularity: int
    featured: list[str] = Field(
        default_factory=list, sa_column=Column(ARRAY(Text), nullable=False, server_default=text("'{}'"))
    )
    option_overrides: dict[str, int] = Field(
        default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    )
    is_available: bool = Field(default=True, sa_column_kwargs={"server_default": text("true")})
    is_sold_out: bool = Field(default=False, sa_column_kwargs={"server_default": text("false")})
    updated_at: datetime | None = Field(default=None, sa_column=tstz())


class Promo(SQLModel, table=True):
    __tablename__ = "promo"
    __table_args__ = (
        CheckConstraint("kind IN ('price','weekday-percent')", name="ck_promo_kind"),
        CheckConstraint(
            "(kind = 'price' AND price IS NOT NULL AND was_price IS NOT NULL)"
            " OR (kind = 'weekday-percent' AND weekday IS NOT NULL AND percent IS NOT NULL)",
            name="ck_promo_kind_columns",
        ),
        CheckConstraint("weekday IS NULL OR (weekday >= 0 AND weekday <= 6)", name="ck_promo_weekday"),
        CheckConstraint("percent IS NULL OR (percent >= 1 AND percent <= 90)", name="ck_promo_percent"),
    )

    id: str = Field(primary_key=True)
    title: str
    image: str
    kind: str
    item_slug: str = Field(sa_column=Column(Text, ForeignKey("menu_item.slug"), nullable=False))
    price: int | None = None
    was_price: int | None = None
    weekday: int | None = None  # 0 = Sunday ... 6, evaluated in Asia/Karachi
    percent: int | None = None
    is_active: bool = Field(default=True, sa_column_kwargs={"server_default": text("true")})

"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-09-27

Hand-written from app/models (data-model.md). After applying it, `alembic check` must report
"No new upgrade operations detected"; that proves the models and this migration agree.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _tstz(name: str, *, nullable: bool = False, now: bool = True) -> sa.Column:  # type: ignore[type-arg]
    return sa.Column(
        name, sa.DateTime(timezone=True), nullable=nullable, server_default=sa.func.now() if now else None
    )


def upgrade() -> None:
    # ---- menu ----
    op.create_table(
        "category",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("image", sa.String(), nullable=False),
        sa.Column("image_alt", sa.String(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("option_group_label", sa.String(), nullable=False),
        sa.UniqueConstraint("sort_order"),
    )
    op.create_table(
        "category_option",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("category_id", sa.Text(), sa.ForeignKey("category.id"), nullable=False),
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("label", sa.String(), nullable=False),
        sa.Column("price_delta", sa.Integer(), nullable=False),
        sa.Column("includes", sa.String(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.UniqueConstraint("category_id", "key"),
        sa.CheckConstraint("price_delta >= 0", name="ck_category_option_price_delta"),
    )
    op.create_index("ix_category_option_category_id", "category_option", ["category_id"])
    op.create_table(
        "category_addon",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("category_id", sa.Text(), sa.ForeignKey("category.id"), nullable=False),
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("label", sa.String(), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.UniqueConstraint("category_id", "key"),
        sa.CheckConstraint("price > 0", name="ck_category_addon_price"),
    )
    op.create_index("ix_category_addon_category_id", "category_addon", ["category_id"])
    op.create_table(
        "menu_item",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("category_id", sa.Text(), sa.ForeignKey("category.id"), nullable=False),
        sa.Column("base_price", sa.Integer(), nullable=False),
        sa.Column("description", sa.String(), nullable=False),
        sa.Column("image", sa.String(), nullable=False),
        sa.Column("image_alt", sa.String(), nullable=False),
        sa.Column("tag", sa.String(), nullable=True),
        sa.Column("rating", sa.Numeric(2, 1, asdecimal=False), nullable=False),
        sa.Column("popularity", sa.Integer(), nullable=False),
        sa.Column("featured", postgresql.ARRAY(sa.Text()), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("option_overrides", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("is_available", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_sold_out", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        _tstz("updated_at"),
        sa.CheckConstraint("base_price > 0 AND base_price <= 100000", name="ck_menu_item_base_price"),
        sa.CheckConstraint(
            "tag IS NULL OR tag IN ('bestseller','chef-pick','hot','new','veg')", name="ck_menu_item_tag"
        ),
        sa.CheckConstraint("rating >= 0 AND rating <= 5", name="ck_menu_item_rating"),
    )
    op.create_index("ix_menu_item_slug", "menu_item", ["slug"], unique=True)
    op.create_index("ix_menu_item_category_id", "menu_item", ["category_id"])
    op.create_table(
        "promo",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("image", sa.String(), nullable=False),
        sa.Column("kind", sa.String(), nullable=False),
        sa.Column("item_slug", sa.Text(), sa.ForeignKey("menu_item.slug"), nullable=False),
        sa.Column("price", sa.Integer(), nullable=True),
        sa.Column("was_price", sa.Integer(), nullable=True),
        sa.Column("weekday", sa.Integer(), nullable=True),
        sa.Column("percent", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.CheckConstraint("kind IN ('price','weekday-percent')", name="ck_promo_kind"),
        sa.CheckConstraint(
            "(kind = 'price' AND price IS NOT NULL AND was_price IS NOT NULL)"
            " OR (kind = 'weekday-percent' AND weekday IS NOT NULL AND percent IS NOT NULL)",
            name="ck_promo_kind_columns",
        ),
        sa.CheckConstraint("weekday IS NULL OR (weekday >= 0 AND weekday <= 6)", name="ck_promo_weekday"),
        sa.CheckConstraint("percent IS NULL OR (percent >= 1 AND percent <= 90)", name="ck_promo_percent"),
    )

    # ---- delivery ----
    op.create_table(
        "delivery_area",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("fee", sa.Integer(), nullable=False),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.UniqueConstraint("name"),
        sa.CheckConstraint("fee >= 0 AND fee <= 2000", name="ck_delivery_area_fee"),
    )

    # ---- accounts ----
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False, server_default=sa.text("'customer'")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        _tstz("created_at"),
        _tstz("last_login_at", nullable=True, now=False),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("phone"),
        sa.CheckConstraint("role IN ('customer','admin')", name="ck_users_role"),
        sa.CheckConstraint("email IS NOT NULL OR phone IS NOT NULL", name="ck_users_contact"),
    )

    # ---- orders ----
    # Public order numbers are KBG-{number}, starting at 10001, never reused.
    op.execute("CREATE SEQUENCE order_number_seq START 10001")
    op.create_table(
        "orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("number", sa.BigInteger(), nullable=False, server_default=sa.text("nextval('order_number_seq')")),
        sa.Column("idempotency_key", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("request_hash", sa.String(), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("customer_name", sa.String(), nullable=False),
        sa.Column("customer_phone", sa.String(), nullable=False),
        sa.Column("area_id", sa.Text(), sa.ForeignKey("delivery_area.id"), nullable=False),
        sa.Column("area_name", sa.String(), nullable=False),
        sa.Column("address", sa.String(), nullable=False),
        sa.Column("landmark", sa.String(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
        sa.Column("timing_type", sa.String(), nullable=False),
        _tstz("scheduled_for", nullable=True, now=False),
        sa.Column("payment", sa.String(), nullable=False, server_default=sa.text("'cod'")),
        sa.Column("status", sa.String(), nullable=False, server_default=sa.text("'confirmed'")),
        sa.Column("subtotal", sa.Integer(), nullable=False),
        sa.Column("discount", sa.Integer(), nullable=False),
        sa.Column("delivery_fee", sa.Integer(), nullable=False),
        sa.Column("total", sa.Integer(), nullable=False),
        _tstz("placed_at"),
        sa.Column("business_date", sa.Date(), nullable=False),
        _tstz("updated_at"),
        sa.UniqueConstraint("number"),
        sa.UniqueConstraint("idempotency_key"),
        sa.CheckConstraint("timing_type IN ('asap','scheduled')", name="ck_orders_timing_type"),
        sa.CheckConstraint("(timing_type = 'scheduled') = (scheduled_for IS NOT NULL)", name="ck_orders_scheduled_for"),
        sa.CheckConstraint("payment = 'cod'", name="ck_orders_payment"),
        sa.CheckConstraint(
            "status IN ('confirmed','preparing','on-the-way','delivered','cancelled')", name="ck_orders_status"
        ),
        sa.CheckConstraint(
            "subtotal >= 0 AND discount >= 0 AND delivery_fee >= 0 AND total >= 0", name="ck_orders_amounts"
        ),
        sa.CheckConstraint("total = subtotal - discount + delivery_fee", name="ck_orders_total"),
    )
    op.create_index("ix_orders_business_date_status", "orders", ["business_date", "status"])
    op.create_index("ix_orders_placed_at", "orders", ["placed_at"])
    op.create_index("ix_orders_user_placed", "orders", ["user_id", "placed_at"])
    op.create_table(
        "order_line",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("item_slug", sa.String(), nullable=False),
        sa.Column("item_name", sa.String(), nullable=False),
        sa.Column("option_key", sa.String(), nullable=False),
        sa.Column("option_label", sa.String(), nullable=False),
        sa.Column("addon_keys", postgresql.JSONB(), nullable=False),
        sa.Column("addon_labels", postgresql.JSONB(), nullable=False),
        sa.Column("note", sa.String(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Integer(), nullable=False),
        sa.Column("discount", sa.Integer(), nullable=False),
        sa.Column("line_total", sa.Integer(), nullable=False),
        sa.CheckConstraint("quantity >= 1 AND quantity <= 20", name="ck_order_line_quantity"),
        sa.CheckConstraint("unit_price >= 0 AND discount >= 0 AND line_total >= 0", name="ck_order_line_amounts"),
    )
    op.create_index("ix_order_line_order_id", "order_line", ["order_id"])
    op.create_table(
        "order_status_event",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("from_status", sa.String(), nullable=True),
        sa.Column("to_status", sa.String(), nullable=False),
        sa.Column("changed_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        _tstz("changed_at"),
    )
    op.create_index("ix_order_status_event_order_id", "order_status_event", ["order_id"])

    # ---- reviews and content ----
    op.create_table(
        "review",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default=sa.text("'pending'")),
        _tstz("created_at"),
        _tstz("moderated_at", nullable=True, now=False),
        sa.Column("moderated_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.UniqueConstraint("order_id"),
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name="ck_review_rating"),
        sa.CheckConstraint("status IN ('pending','approved','rejected')", name="ck_review_status"),
    )
    op.create_table(
        "contact_message",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("message", sa.String(), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        _tstz("created_at"),
    )
    op.create_table(
        "newsletter_subscriber",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(), nullable=False),
        _tstz("created_at"),
        sa.UniqueConstraint("email"),
    )
    op.create_table(
        "sample_testimonial",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("area", sa.String(), nullable=False),
        sa.Column("quote", sa.String(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
    )


def downgrade() -> None:
    for table in (
        "sample_testimonial",
        "newsletter_subscriber",
        "contact_message",
        "review",
        "order_status_event",
        "order_line",
        "orders",
    ):
        op.drop_table(table)
    op.execute("DROP SEQUENCE order_number_seq")
    for table in ("users", "delivery_area", "promo", "menu_item", "category_addon", "category_option", "category"):
        op.drop_table(table)

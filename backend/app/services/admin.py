"""Admin dashboard reads: the live orders list and today's sales summary."""

from collections import Counter
from datetime import date, datetime

from sqlmodel import Session, select

from app.core import clock
from app.models import Order, OrderLine
from app.schemas.admin import AdminOrderSummary, TodaySummary
from app.schemas.orders import TimingAsapOut, TimingOut, TimingScheduledOut


def _timing_out(order: Order) -> TimingOut:
    if order.timing_type == "scheduled":
        return TimingScheduledOut(slot=order.scheduled_for)
    return TimingAsapOut()


def _item_count(session: Session, order_id: object) -> int:
    lines = session.exec(select(OrderLine).where(OrderLine.order_id == order_id)).all()
    return sum(line.quantity for line in lines)


def list_admin_orders(
    session: Session,
    *,
    business_date_filter: date | None = None,
    status: str | None = None,
    since: datetime | None = None,
) -> list[AdminOrderSummary]:
    """Orders for one business day (today by default), newest first. `since` supports the admin
    board's 15-second poll: only orders placed after the last one it already has. At restaurant
    scale (tens to a few hundred orders a day) a query per order for its item count is cheap and
    keeps every column comparison a plain equality, which mypy's SQLModel stubs are happy with."""
    query = select(Order).where(Order.business_date == (business_date_filter or clock.business_date(clock.now())))
    if status is not None:
        query = query.where(Order.status == status)
    orders = session.exec(query).all()
    if since is not None:
        orders = [order for order in orders if order.placed_at and order.placed_at > since]
    orders = sorted(orders, key=lambda o: o.placed_at or clock.now(), reverse=True)

    return [
        AdminOrderSummary(
            id=f"KBG-{order.number}",
            customer_name=order.customer_name,
            area_name=order.area_name,
            status=order.status,
            total=order.total,
            item_count=_item_count(session, order.id),
            timing=_timing_out(order),
            placed_at=order.placed_at,
        )
        for order in orders
    ]


def today_summary(session: Session) -> TodaySummary:
    """Today's (Pakistan-time business day) order count and sales, cancelled orders excluded from
    both (FR-024), plus a breakdown by status for every order today."""
    today = clock.business_date(clock.now())
    orders = session.exec(select(Order).where(Order.business_date == today)).all()
    billable = [o for o in orders if o.status != "cancelled"]
    return TodaySummary(
        business_date=today,
        order_count=len(billable),
        sales_total=sum(o.total for o in billable),
        by_status=dict(Counter(o.status for o in orders)),
    )

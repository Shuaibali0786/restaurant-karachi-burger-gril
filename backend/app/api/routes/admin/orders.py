"""Admin order operations (contracts/openapi.yaml: GET/PATCH /admin/orders...). Every route
requires an admin session (app.api.deps.AdminUser); a customer session or no session is refused."""

from datetime import date, datetime

from fastapi import APIRouter, Query
from sqlmodel import select

from app.api.deps import AdminUser, SessionDep
from app.core.errors import AppError
from app.models import Order
from app.schemas.admin import AdminOrderSummary, StatusChangeInput
from app.schemas.orders import OrderOut
from app.services import admin as admin_service
from app.services import orders as orders_service

router = APIRouter(tags=["admin"])


@router.get("/orders", summary="Orders for one business day (today by default), newest first")
def list_orders(
    session: SessionDep,
    _: AdminUser,
    date_: date | None = Query(default=None, alias="date"),  # noqa: B008 - standard FastAPI Query default
    status: str | None = None,
    since: datetime | None = None,
) -> list[AdminOrderSummary]:
    return admin_service.list_admin_orders(session, business_date_filter=date_, status=status, since=since)


def _load_order(session: SessionDep, number: str) -> Order:
    try:
        parsed_number = int(number.removeprefix("KBG-"))
    except ValueError as error:
        raise AppError("NOT_FOUND", "We couldn't find that order.") from error
    order = session.exec(select(Order).where(Order.number == parsed_number)).first()
    if order is None:
        raise AppError("NOT_FOUND", "We couldn't find that order.")
    return order


@router.get("/orders/{number}", summary="Full order with customer details")
def get_order_detail(number: str, session: SessionDep, admin: AdminUser) -> OrderOut:
    order = _load_order(session, number)
    return orders_service.get_order_view(session, order.number, admin)  # type: ignore[arg-type]


@router.patch("/orders/{number}/status", summary="Move an order forward one step, or cancel it")
def update_order_status(number: str, body: StatusChangeInput, session: SessionDep, admin: AdminUser) -> OrderOut:
    order = _load_order(session, number)
    orders_service.change_status(session, order, body.status, changed_by=admin.id, expected_status=body.expected_status)
    return orders_service.get_order_view(session, order.number, admin)  # type: ignore[arg-type]

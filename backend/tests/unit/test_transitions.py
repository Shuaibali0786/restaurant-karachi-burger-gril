import uuid
from datetime import datetime
from zoneinfo import ZoneInfo

import pytest
from sqlmodel import Session, select

from app.core.errors import AppError
from app.models import DeliveryArea, MenuItem, Order, OrderStatusEvent
from app.services import orders as orders_service

PKT = ZoneInfo("Asia/Karachi")
NOW = datetime(2026, 10, 1, 20, 0, tzinfo=PKT)


def _make_order(session: Session, status: str = "confirmed") -> Order:
    item = session.exec(select(MenuItem).where(MenuItem.slug == "burns-road-zinger")).one()
    area = session.exec(select(DeliveryArea)).first()
    assert area is not None
    order = Order(
        id=uuid.uuid4(),
        idempotency_key=uuid.uuid4(),
        request_hash="test",
        user_id=None,
        customer_name="Ayesha Khan",
        customer_phone="+923001234567",
        area_id=area.id,
        area_name=area.name,
        address="House 1, Street 2",
        timing_type="asap",
        payment="cod",
        status=status,
        subtotal=item.base_price,
        discount=0,
        delivery_fee=area.fee,
        total=item.base_price + area.fee,
        placed_at=NOW,
        business_date=NOW.date(),
        updated_at=NOW,
    )
    session.add(order)
    session.add(OrderStatusEvent(order_id=order.id, from_status=None, to_status=status, changed_at=NOW))
    session.commit()
    session.refresh(order)
    return order


@pytest.mark.parametrize(
    ("current", "target"),
    [("confirmed", "preparing"), ("preparing", "on-the-way"), ("on-the-way", "delivered")],
)
def test_allowed_forward_steps_succeed(db_session: Session, current: str, target: str):
    order = _make_order(db_session, status=current)
    result = orders_service.change_status(db_session, order, target, changed_by=None)
    assert result.status == target


@pytest.mark.parametrize("current", ["confirmed", "preparing", "on-the-way"])
def test_cancel_is_allowed_from_any_non_terminal_status(db_session: Session, current: str):
    order = _make_order(db_session, status=current)
    result = orders_service.change_status(db_session, order, "cancelled", changed_by=None)
    assert result.status == "cancelled"


@pytest.mark.parametrize(
    ("current", "target"),
    [("confirmed", "on-the-way"), ("confirmed", "delivered"), ("preparing", "delivered")],
)
def test_skipping_a_step_is_rejected(db_session: Session, current: str, target: str):
    order = _make_order(db_session, status=current)
    with pytest.raises(AppError) as excinfo:
        orders_service.change_status(db_session, order, target, changed_by=None)
    assert excinfo.value.code == "INVALID_TRANSITION"
    assert excinfo.value.details == {"currentStatus": current}


@pytest.mark.parametrize("terminal", ["delivered", "cancelled"])
@pytest.mark.parametrize("target", ["preparing", "on-the-way", "delivered", "cancelled"])
def test_terminal_statuses_cannot_be_changed(db_session: Session, terminal: str, target: str):
    order = _make_order(db_session, status=terminal)
    with pytest.raises(AppError) as excinfo:
        orders_service.change_status(db_session, order, target, changed_by=None)
    assert excinfo.value.code == "INVALID_TRANSITION"


def test_moving_to_the_same_status_is_rejected(db_session: Session):
    order = _make_order(db_session, status="preparing")
    with pytest.raises(AppError):
        orders_service.change_status(db_session, order, "preparing", changed_by=None)


def test_expected_status_guards_against_a_stale_change(db_session: Session):
    order = _make_order(db_session, status="confirmed")
    orders_service.change_status(db_session, order, "preparing", changed_by=None)
    with pytest.raises(AppError) as excinfo:
        orders_service.change_status(db_session, order, "on-the-way", changed_by=None, expected_status="confirmed")
    assert excinfo.value.code == "INVALID_TRANSITION"
    assert excinfo.value.details == {"currentStatus": "preparing"}


def test_matching_expected_status_succeeds(db_session: Session):
    order = _make_order(db_session, status="confirmed")
    result = orders_service.change_status(db_session, order, "preparing", changed_by=None, expected_status="confirmed")
    assert result.status == "preparing"

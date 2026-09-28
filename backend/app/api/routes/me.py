"""The signed-in customer's own data (contracts/openapi.yaml: me tag)."""

from datetime import datetime

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, SessionDep
from app.core.errors import AppError
from app.schemas.auth import ReorderResult
from app.schemas.orders import OrderOut, ReviewSummaryOut
from app.schemas.reviews import ReviewInput
from app.services import orders as orders_service
from app.services import reviews as reviews_service

router = APIRouter(tags=["me"])


def _parse_number(number: str) -> int:
    try:
        return int(number.removeprefix("KBG-"))
    except ValueError as error:
        raise AppError("NOT_FOUND", "We couldn't find that order.") from error


@router.get("/me/orders", summary="My orders, newest first")
def my_orders(
    session: SessionDep,
    user: CurrentUser,
    limit: int = Query(default=20, ge=1, le=50),
    before: datetime | None = None,
) -> list[OrderOut]:
    return orders_service.list_my_orders(session, user, limit=limit, before=before)


@router.post("/me/orders/{number}/reorder", summary="Cart-ready lines from a past order at the current menu")
def reorder(number: str, session: SessionDep, user: CurrentUser) -> ReorderResult:
    return orders_service.reorder(session, user, _parse_number(number))


@router.post(
    "/me/orders/{number}/review", status_code=201, summary="Review my delivered order (once); starts as pending"
)
def review_order(number: str, body: ReviewInput, session: SessionDep, user: CurrentUser) -> ReviewSummaryOut:
    return reviews_service.submit_review(session, user, _parse_number(number), body)

"""POST /orders (contracts/openapi.yaml: orders tag). Guests and signed-in customers alike."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Header, Request, Response

from app.api.deps import OptionalUser, SessionDep
from app.core.rate_limit import limiter
from app.schemas.orders import OrderOut, PlaceOrderInput
from app.services import orders as orders_service

router = APIRouter(tags=["orders"])


@router.post("/orders", status_code=201, summary="Place a Cash-on-Delivery order (guest or signed in)")
@limiter.limit("10/hour")
def create_order(
    request: Request,  # noqa: ARG001 - required by the slowapi decorator
    response: Response,
    body: PlaceOrderInput,
    session: SessionDep,
    user: OptionalUser,
    idempotency_key: Annotated[uuid.UUID, Header(alias="Idempotency-Key")],
) -> OrderOut:
    order, created = orders_service.place_order(session, body, idempotency_key=idempotency_key, user=user)
    response.status_code = 201 if created else 200
    return order

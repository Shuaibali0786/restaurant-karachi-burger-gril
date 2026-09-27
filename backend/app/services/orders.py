"""Places and reads back Cash-on-Delivery orders (plan.md "Place order" flow; FR-004-011).

The server never trusts a price from the client: every line is re-priced from the current menu and
today's promos (app.services.pricing), and the request schema (`PlaceOrderInput`, `extra="forbid"`)
refuses any price field outright.
"""

import hashlib
import uuid
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.core import clock
from app.core.config import get_settings
from app.core.errors import AppError
from app.core.normalise import normalise_pk_mobile
from app.models import DeliveryArea, MenuItem, Order, OrderLine, OrderStatusEvent, Promo, User
from app.schemas.orders import (
    OrderCustomerOut,
    OrderDeliveryOut,
    OrderLineOut,
    OrderOut,
    PlaceOrderInput,
    StatusEventOut,
    TimingAsapOut,
    TimingOut,
    TimingScheduledOut,
    TotalsOut,
)
from app.services import menu as menu_service
from app.services.pricing import (
    CartLineInput,
    PriceAddon,
    PricedItem,
    PriceOption,
    WeekdayPromo,
    cart_totals,
    resolve_cart,
)


def _request_hash(body: PlaceOrderInput) -> str:
    """A stable fingerprint of the request, used to tell a genuine retry (same key, same body) from
    a different order that happens to reuse a key (same key, different body -> IDEMPOTENCY_CONFLICT)."""
    canonical = body.model_dump_json(by_alias=True)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def option_summary(label: str, includes: str | None) -> str:
    """ "Meal (Masala Fries + Chilled Cola)" — mirrors frontend/src/lib/menu.ts optionSummary()."""
    return f"{label} ({includes})" if includes else label


@dataclass(frozen=True)
class _OrderableItem:
    """A menu item's full pricing + labelling data, used to validate a cart and snapshot its lines."""

    slug: str
    name: str
    is_available: bool
    is_sold_out: bool
    options: dict[str, tuple[str, int, str | None]]  # key -> (label, price_delta, includes)
    addons: dict[str, tuple[str, int]]  # key -> (label, price)

    def to_priced(self) -> PricedItem:
        return PricedItem(
            slug=self.slug,
            base_price=self._base_price,
            options=tuple(PriceOption(key, delta) for key, (_, delta, _) in self.options.items()),
            addons=tuple(PriceAddon(key, price) for key, (_, price) in self.addons.items()),
        )

    _base_price: int = 0


def _load_orderable_catalog(session: Session) -> dict[str, _OrderableItem]:
    shapes = menu_service.load_category_shapes(session)
    items = session.exec(select(MenuItem)).all()
    catalog: dict[str, _OrderableItem] = {}
    for item in items:
        shape = shapes[item.category_id]
        options = {o.key: (o.label, item.option_overrides.get(o.key, o.price_delta), o.includes) for o in shape.options}
        addons = {a.key: (a.label, a.price) for a in shape.addons}
        catalog[item.slug] = _OrderableItem(
            slug=item.slug,
            name=item.name,
            is_available=item.is_available,
            is_sold_out=item.is_sold_out,
            options=options,
            addons=addons,
            _base_price=item.base_price,
        )
    return catalog


def _load_weekday_promos(session: Session) -> list[WeekdayPromo]:
    promos = session.exec(
        select(Promo).where(Promo.kind == "weekday-percent", Promo.is_active == True)  # noqa: E712
    ).all()
    return [WeekdayPromo(item_slug=p.item_slug, weekday=p.weekday, percent=p.percent) for p in promos]  # type: ignore[arg-type]


def _validate_lines(body: PlaceOrderInput, catalog: dict[str, _OrderableItem]) -> None:
    unknown = sorted({line.item_slug for line in body.lines if line.item_slug not in catalog})
    if unknown:
        raise AppError(
            "UNKNOWN_ITEM",
            "Some items in your cart are no longer on the menu. Please review your cart.",
            details={"items": unknown},
        )

    unavailable = sorted(
        {
            catalog[line.item_slug].name
            for line in body.lines
            if not catalog[line.item_slug].is_available or catalog[line.item_slug].is_sold_out
        }
    )
    if unavailable:
        raise AppError(
            "ITEM_SOLD_OUT",
            "Some items in your cart are sold out. Please remove them to continue.",
            details={"items": unavailable},
        )

    for line in body.lines:
        item = catalog[line.item_slug]
        if line.option_id not in item.options:
            raise AppError(
                "INVALID_OPTION",
                f'"{item.name}" has no option "{line.option_id}". Please review your cart.',
                fields={"lines": f"{item.name}: invalid option"},
            )
        for addon_id in line.addon_ids:
            if addon_id not in item.addons:
                raise AppError(
                    "INVALID_OPTION",
                    f'"{item.name}" has no add-on "{addon_id}". Please review your cart.',
                    fields={"lines": f"{item.name}: invalid add-on"},
                )


def _validate_timing(body: PlaceOrderInput, now: datetime) -> None:
    if body.timing.type == "asap":
        if not clock.is_open(now):
            opens_at = clock.next_opening(now)
            raise AppError(
                "RESTAURANT_CLOSED",
                "We're closed right now. We open at 12 noon Pakistan time.",
                details={"opensAt": opens_at.isoformat()},
            )
    else:
        if not clock.is_valid_slot(body.timing.slot, now):
            raise AppError(
                "INVALID_SLOT",
                "That delivery time is no longer available. Please pick another.",
                fields={"timing.slot": "This time slot is no longer available."},
            )


def _order_to_out(order: Order, lines: list[OrderLine], events: list[OrderStatusEvent], viewer: str) -> OrderOut:
    timing: TimingOut = (
        TimingScheduledOut(slot=order.scheduled_for) if order.timing_type == "scheduled" else TimingAsapOut()
    )
    return OrderOut(
        id=f"KBG-{order.number}",
        customer=OrderCustomerOut(name=order.customer_name, phone=order.customer_phone),
        delivery=OrderDeliveryOut(
            area=order.area_id,
            area_name=order.area_name,
            address=order.address,
            landmark=order.landmark,
            notes=order.notes,
        ),
        timing=timing,
        payment="cod",
        lines=[
            OrderLineOut(
                item_slug=line.item_slug,
                name=line.item_name,
                option_id=line.option_key,
                option_label=line.option_label,
                addon_ids=line.addon_keys,
                addon_labels=line.addon_labels,
                note=line.note,
                quantity=line.quantity,
                unit_price=line.unit_price,
                discount=line.discount,
                line_total=line.line_total,
            )
            for line in lines
        ],
        totals=TotalsOut(
            subtotal=order.subtotal, discount=order.discount, delivery=order.delivery_fee, total=order.total
        ),
        placed_at=order.placed_at,
        status=order.status,
        status_history=[StatusEventOut(status=e.to_status, at=e.changed_at) for e in events],
        viewer=viewer,
    )


def _load_order_bundle(session: Session, order: Order) -> OrderOut:
    lines = sorted(
        session.exec(select(OrderLine).where(OrderLine.order_id == order.id)).all(), key=lambda line: line.position
    )
    events = sorted(
        session.exec(select(OrderStatusEvent).where(OrderStatusEvent.order_id == order.id)).all(),
        key=lambda e: e.changed_at,  # type: ignore[arg-type,return-value]
    )
    return _order_to_out(order, lines, events, viewer="owner")


def place_order(
    session: Session, body: PlaceOrderInput, *, idempotency_key: uuid.UUID, user: User | None
) -> tuple[OrderOut, bool]:
    """Returns (order, created). `created` is False for an idempotent replay (same key, same body)."""
    request_hash = _request_hash(body)

    existing = session.exec(select(Order).where(Order.idempotency_key == idempotency_key)).first()
    if existing is not None:
        if existing.request_hash != request_hash:
            raise AppError("IDEMPOTENCY_CONFLICT", "This request key was already used for a different order.")
        return _load_order_bundle(session, existing), False

    phone = normalise_pk_mobile(body.customer.phone)
    if phone is None:
        raise AppError(
            "VALIDATION_FAILED",
            "Please check your delivery details.",
            fields={"customer.phone": "Enter a valid Pakistani mobile number."},
        )

    area = session.get(DeliveryArea, body.delivery.area)
    if area is None or not area.is_enabled:
        raise AppError(
            "AREA_UNAVAILABLE",
            "We don't deliver to that area yet. Please pick a listed area.",
            fields={"delivery.area": "Please choose a delivery area from the list."},
        )

    catalog = _load_orderable_catalog(session)
    _validate_lines(body, catalog)

    now = clock.now()
    _validate_timing(body, now)

    priced_catalog = {slug: item.to_priced() for slug, item in catalog.items()}
    promos = _load_weekday_promos(session)
    cart_lines = [
        CartLineInput(
            item_slug=line.item_slug,
            option_key=line.option_id,
            addon_keys=tuple(line.addon_ids),
            quantity=line.quantity,
        )
        for line in body.lines
    ]
    resolved = resolve_cart(cart_lines, priced_catalog, promos, now)
    if resolved.invalid:
        # Already validated above; reaching here would be a bug, not a customer error.
        raise AppError("UNKNOWN_ITEM", "Some items in your cart could not be priced. Please review your cart.")

    settings = get_settings()
    totals = cart_totals(
        resolved.lines, delivery_fee=area.fee, free_delivery_threshold=settings.free_delivery_threshold
    )

    order = Order(
        id=uuid.uuid4(),
        idempotency_key=idempotency_key,
        request_hash=request_hash,
        user_id=user.id if user else None,
        customer_name=body.customer.name.strip(),
        customer_phone=phone,
        area_id=area.id,
        area_name=area.name,
        address=body.delivery.address.strip(),
        landmark=body.delivery.landmark,
        notes=body.delivery.notes,
        timing_type=body.timing.type,
        scheduled_for=body.timing.slot if body.timing.type == "scheduled" else None,
        payment="cod",
        status="confirmed",
        subtotal=totals.subtotal,
        discount=totals.discount,
        delivery_fee=totals.delivery,
        total=totals.total,
        placed_at=now,
        business_date=clock.business_date(now),
        updated_at=now,
    )
    session.add(order)
    try:
        session.flush()  # assigns order.id-backed defaults (number) and catches the unique race
    except IntegrityError:
        session.rollback()
        raced = session.exec(select(Order).where(Order.idempotency_key == idempotency_key)).first()
        if raced is not None:
            return _load_order_bundle(session, raced), False
        raise

    # resolve_cart preserves order and every line was pre-validated, so position i here is body.lines[i]
    # (note isn't part of CartLineInput: it never affects price, so it's read back from the original input).
    order_lines: list[OrderLine] = []
    for position, (resolved_line, original) in enumerate(zip(resolved.lines, body.lines, strict=True)):
        item = catalog[original.item_slug]
        option_label, _, includes = item.options[original.option_id]
        addon_labels = [item.addons[key][0] for key in original.addon_ids]
        order_lines.append(
            OrderLine(
                order_id=order.id,
                position=position,
                item_slug=item.slug,
                item_name=item.name,
                option_key=original.option_id,
                option_label=option_summary(option_label, includes),
                addon_keys=list(original.addon_ids),
                addon_labels=addon_labels,
                note=original.note,
                quantity=original.quantity,
                unit_price=resolved_line.unit_price,
                discount=resolved_line.discount_per_unit * resolved_line.line.quantity,
                line_total=resolved_line.line_total,
            )
        )
    session.add_all(order_lines)
    session.add(
        OrderStatusEvent(order_id=order.id, from_status=None, to_status="confirmed", changed_by=None, changed_at=now)
    )
    session.commit()
    session.refresh(order)

    return _load_order_bundle(session, order), True

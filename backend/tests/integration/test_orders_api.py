import uuid
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.models import DeliveryArea, MenuItem, Order, OrderStatusEvent

PKT = ZoneInfo("Asia/Karachi")
WEDNESDAY_EVENING = datetime(2026, 9, 30, 20, 0, tzinfo=PKT)  # open, and Wings Wednesday
THURSDAY_EVENING = datetime(2026, 10, 1, 20, 0, tzinfo=PKT)  # open, ordinary day
CLOSED_MORNING = datetime(2026, 10, 1, 8, 0, tzinfo=PKT)  # closed (opens at noon)


def _key() -> str:
    return str(uuid.uuid4())


def _body(**overrides: object) -> dict:
    body = {
        "customer": {"name": "Ayesha Khan", "phone": "0300-1234567"},
        "delivery": {"area": "saddar", "address": "House 12, Street 4, Block 5, Saddar"},
        "timing": {"type": "asap"},
        "payment": "cod",
        "lines": [
            {
                "itemSlug": "burns-road-zinger",
                "optionId": "single",
                "addonIds": [],
                "note": "",
                "quantity": 1,
                "addedAt": "2026-10-01T12:00:00Z",
            }
        ],
    }
    body.update(overrides)
    return body


def _post(client: TestClient, body: dict, key: str | None = None) -> object:
    return client.post("/api/v1/orders", json=body, headers={"Idempotency-Key": key or _key()})


def test_happy_path_creates_a_priced_order(client: TestClient, freeze_time):
    freeze_time(THURSDAY_EVENING)
    response = _post(client, _body())
    assert response.status_code == 201
    order = response.json()
    assert order["id"].startswith("KBG-")
    assert int(order["id"].removeprefix("KBG-")) >= 10001
    assert order["status"] == "confirmed"
    assert order["totals"] == {"subtotal": 690, "discount": 0, "delivery": 150, "total": 840}
    assert order["viewer"] == "owner"
    assert len(order["statusHistory"]) == 1
    assert order["statusHistory"][0]["status"] == "confirmed"


def test_a_tampered_total_is_ignored_because_the_field_is_unknown(client: TestClient, freeze_time):
    freeze_time(THURSDAY_EVENING)
    body = _body()
    body["totals"] = {"subtotal": 1, "discount": 0, "delivery": 0, "total": 1}
    response = _post(client, body)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_FAILED"


def test_a_tampered_line_price_is_ignored_because_the_field_is_unknown(client: TestClient, freeze_time):
    freeze_time(THURSDAY_EVENING)
    body = _body()
    body["lines"][0]["unitPrice"] = 1
    response = _post(client, body)
    assert response.status_code == 422


def test_wings_wednesday_discount_applies_only_on_wednesday(client: TestClient, freeze_time):
    freeze_time(WEDNESDAY_EVENING)
    wed = _post(
        client,
        _body(
            lines=[
                {
                    "itemSlug": "fire-wings",
                    "optionId": "regular",
                    "addonIds": [],
                    "note": "",
                    "quantity": 1,
                    "addedAt": "2026-09-30T12:00:00Z",
                }
            ]
        ),
    ).json()
    assert wed["totals"]["discount"] == 178  # 890 * 20% half-up

    freeze_time(THURSDAY_EVENING)
    thu = _post(
        client,
        _body(
            lines=[
                {
                    "itemSlug": "fire-wings",
                    "optionId": "regular",
                    "addonIds": [],
                    "note": "",
                    "quantity": 1,
                    "addedAt": "2026-10-01T12:00:00Z",
                }
            ]
        ),
    ).json()
    assert thu["totals"]["discount"] == 0


def test_delivery_fee_matches_the_chosen_area_and_free_delivery_kicks_in_at_1500(
    client: TestClient, db_session: Session, freeze_time
):
    area = db_session.exec(select(DeliveryArea).where(DeliveryArea.id == "clifton")).one()
    area.fee = 200
    db_session.commit()
    freeze_time(THURSDAY_EVENING)

    below = _post(client, _body(delivery={"area": "clifton", "address": "House 1, Clifton Block 2"})).json()
    assert below["totals"]["delivery"] == 200

    free = _post(
        client,
        _body(
            delivery={"area": "clifton", "address": "House 1, Clifton Block 2"},
            lines=[
                {
                    "itemSlug": "grand-combo",
                    "optionId": "single",
                    "addonIds": [],
                    "note": "",
                    "quantity": 1,
                    "addedAt": "2026-10-01T12:00:00Z",
                }
            ],
        ),
    ).json()
    assert free["totals"]["delivery"] == 0


def test_asap_is_refused_while_closed_with_the_opening_time(client: TestClient, freeze_time):
    freeze_time(CLOSED_MORNING)
    response = _post(client, _body())
    assert response.status_code == 409
    body = response.json()["error"]
    assert body["code"] == "RESTAURANT_CLOSED"
    assert "opensAt" in body["details"]


def test_scheduled_slot_must_be_a_currently_offered_slot(client: TestClient, freeze_time):
    freeze_time(THURSDAY_EVENING)
    valid = _post(client, _body(timing={"type": "scheduled", "slot": "2026-10-01T22:00:00+05:00"}))
    assert valid.status_code == 201

    stale = _post(client, _body(timing={"type": "scheduled", "slot": "2026-10-01T20:15:00+05:00"}))
    assert stale.status_code == 422
    assert stale.json()["error"]["code"] == "INVALID_SLOT"


def test_sold_out_item_is_refused_and_named(client: TestClient, db_session: Session, freeze_time):
    item = db_session.exec(select(MenuItem).where(MenuItem.slug == "burns-road-zinger")).one()
    item.is_sold_out = True
    db_session.commit()
    freeze_time(THURSDAY_EVENING)

    response = _post(client, _body())
    assert response.status_code == 409
    body = response.json()["error"]
    assert body["code"] == "ITEM_SOLD_OUT"
    assert body["details"]["items"] == ["Burns Road Zinger"]


def test_hidden_item_is_refused_like_sold_out(client: TestClient, db_session: Session, freeze_time):
    item = db_session.exec(select(MenuItem).where(MenuItem.slug == "burns-road-zinger")).one()
    item.is_available = False
    db_session.commit()
    freeze_time(THURSDAY_EVENING)

    response = _post(client, _body())
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "ITEM_SOLD_OUT"


def test_unknown_item_and_option_are_refused(client: TestClient, freeze_time):
    freeze_time(THURSDAY_EVENING)
    unknown_item = _post(
        client,
        _body(
            lines=[
                {
                    "itemSlug": "does-not-exist",
                    "optionId": "x",
                    "addonIds": [],
                    "note": "",
                    "quantity": 1,
                    "addedAt": "2026-10-01T12:00:00Z",
                }
            ]
        ),
    )
    assert unknown_item.status_code == 422
    assert unknown_item.json()["error"]["code"] == "UNKNOWN_ITEM"

    bad_option = _post(
        client,
        _body(
            lines=[
                {
                    "itemSlug": "burns-road-zinger",
                    "optionId": "family-pack",
                    "addonIds": [],
                    "note": "",
                    "quantity": 1,
                    "addedAt": "2026-10-01T12:00:00Z",
                }
            ]
        ),
    )
    assert bad_option.status_code == 422
    assert bad_option.json()["error"]["code"] == "INVALID_OPTION"


def test_unknown_and_disabled_area_are_refused(client: TestClient, db_session: Session, freeze_time):
    freeze_time(THURSDAY_EVENING)
    unknown_area = _post(client, _body(delivery={"area": "narnia", "address": "1 Wardrobe Lane, Narnia"}))
    assert unknown_area.status_code == 422
    assert unknown_area.json()["error"]["code"] == "AREA_UNAVAILABLE"

    area = db_session.exec(select(DeliveryArea).where(DeliveryArea.id == "gulshan")).one()
    area.is_enabled = False
    db_session.commit()
    disabled = _post(client, _body(delivery={"area": "gulshan", "address": "House 1, Gulshan Block 2"}))
    assert disabled.status_code == 422
    assert disabled.json()["error"]["code"] == "AREA_UNAVAILABLE"


def test_field_validation_covers_phone_quantity_and_note_length(client: TestClient, freeze_time):
    freeze_time(THURSDAY_EVENING)
    bad_phone = _post(client, _body(customer={"name": "Ayesha Khan", "phone": "12345"}))
    assert bad_phone.status_code == 422
    assert bad_phone.json()["error"]["code"] == "VALIDATION_FAILED"

    zero_qty = _post(
        client,
        _body(
            lines=[
                {
                    "itemSlug": "burns-road-zinger",
                    "optionId": "single",
                    "addonIds": [],
                    "note": "",
                    "quantity": 0,
                    "addedAt": "2026-10-01T12:00:00Z",
                }
            ]
        ),
    )
    assert zero_qty.status_code == 422

    too_many = _post(
        client,
        _body(
            lines=[
                {
                    "itemSlug": "burns-road-zinger",
                    "optionId": "single",
                    "addonIds": [],
                    "note": "",
                    "quantity": 21,
                    "addedAt": "2026-10-01T12:00:00Z",
                }
            ]
        ),
    )
    assert too_many.status_code == 422

    long_note = _post(
        client,
        _body(
            lines=[
                {
                    "itemSlug": "burns-road-zinger",
                    "optionId": "single",
                    "addonIds": [],
                    "note": "x" * 501,
                    "quantity": 1,
                    "addedAt": "2026-10-01T12:00:00Z",
                }
            ]
        ),
    )
    assert long_note.status_code == 422


def test_idempotent_replay_returns_the_same_order_and_a_conflicting_body_is_refused(client: TestClient, freeze_time):
    freeze_time(THURSDAY_EVENING)
    key = _key()
    first = _post(client, _body(), key=key)
    assert first.status_code == 201
    first_id = first.json()["id"]

    replay = _post(client, _body(), key=key)
    assert replay.status_code == 200
    assert replay.json()["id"] == first_id

    conflict = _post(client, _body(customer={"name": "Someone Else", "phone": "0300-7654321"}), key=key)
    assert conflict.status_code == 409
    assert conflict.json()["error"]["code"] == "IDEMPOTENCY_CONFLICT"


def test_missing_idempotency_key_is_rejected(client: TestClient, freeze_time):
    freeze_time(THURSDAY_EVENING)
    response = client.post("/api/v1/orders", json=_body())
    assert response.status_code == 422


def test_order_saves_a_line_snapshot_and_status_event(client: TestClient, db_session: Session, freeze_time):
    freeze_time(THURSDAY_EVENING)
    order_id = _post(client, _body()).json()["id"]
    number = int(order_id.removeprefix("KBG-"))
    order = db_session.exec(select(Order).where(Order.number == number)).one()
    assert order.business_date is not None
    events = db_session.exec(select(OrderStatusEvent).where(OrderStatusEvent.order_id == order.id)).all()
    assert len(events) == 1
    assert events[0].to_status == "confirmed"
    assert events[0].from_status is None


def test_the_eleventh_order_in_an_hour_is_rate_limited(client: TestClient, freeze_time):
    freeze_time(THURSDAY_EVENING)
    for _ in range(10):
        assert _post(client, _body()).status_code == 201
    limited = _post(client, _body())
    assert limited.status_code == 429
    assert limited.json()["error"]["code"] == "RATE_LIMITED"

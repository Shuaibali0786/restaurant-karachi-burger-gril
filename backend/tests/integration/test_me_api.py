import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.models import MenuItem, Order
from tests.conftest import make_user, sign_in

BODY = {
    "customer": {"name": "Ayesha Khan", "phone": "0300-1234567"},
    "delivery": {"area": "saddar", "address": "House 12, Street 4, Block 5, Saddar"},
    "timing": {"type": "asap"},
    "payment": "cod",
    "lines": [
        {
            "itemSlug": "burns-road-zinger",
            "optionId": "single",
            "addonIds": [],
            "note": "no onions",
            "quantity": 2,
            "addedAt": "2026-10-01T12:00:00Z",
        }
    ],
}


def _place(client: TestClient, freeze_time, when) -> dict:
    freeze_time(when)
    response = client.post("/api/v1/orders", json=BODY, headers={"Idempotency-Key": str(uuid.uuid4())})
    assert response.status_code == 201, response.text
    return response.json()


def test_a_signed_in_order_is_linked_and_a_guest_order_is_not(client: TestClient, db_session: Session, freeze_time):
    from tests.integration.test_admin_orders_api import THURSDAY_EVENING

    guest = _place(client, freeze_time, THURSDAY_EVENING)
    user = make_user(db_session)
    sign_in(client, user)
    mine = _place(client, freeze_time, THURSDAY_EVENING)

    by_number = {o.number: o for o in db_session.exec(select(Order)).all()}
    assert by_number[int(guest["id"].removeprefix("KBG-"))].user_id is None
    assert by_number[int(mine["id"].removeprefix("KBG-"))].user_id == user.id


def test_my_orders_lists_only_mine_newest_first_and_needs_a_session(
    client: TestClient, db_session: Session, freeze_time
):
    from datetime import timedelta

    from tests.integration.test_admin_orders_api import THURSDAY_EVENING

    assert client.get("/api/v1/me/orders").status_code == 401
    other = make_user(db_session)
    sign_in(client, other)
    _place(client, freeze_time, THURSDAY_EVENING)
    user = make_user(db_session)
    sign_in(client, user)
    first = _place(client, freeze_time, THURSDAY_EVENING + timedelta(minutes=1))
    second = _place(client, freeze_time, THURSDAY_EVENING + timedelta(minutes=2))

    listed = client.get("/api/v1/me/orders").json()
    assert [o["id"] for o in listed] == [second["id"], first["id"]]
    assert "passwordHash" not in str(listed)
    paged = client.get("/api/v1/me/orders", params={"limit": 1, "before": listed[0]["placedAt"]}).json()
    assert [o["id"] for o in paged] == [first["id"]]


def test_reorder_rebuilds_lines_and_reports_skipped_items(client: TestClient, db_session: Session, freeze_time):
    from tests.integration.test_admin_orders_api import THURSDAY_EVENING

    user = make_user(db_session)
    sign_in(client, user)
    order = _place(client, freeze_time, THURSDAY_EVENING)
    number = order["id"]

    result = client.post(f"/api/v1/me/orders/{number}/reorder").json()
    assert result["skipped"] == []
    assert result["lines"] == [
        {"itemSlug": "burns-road-zinger", "optionId": "single", "addonIds": [], "note": "no onions", "quantity": 2}
    ]

    item = db_session.exec(select(MenuItem).where(MenuItem.slug == "burns-road-zinger")).one()
    item.is_sold_out = True
    db_session.add(item)
    db_session.commit()
    result = client.post(f"/api/v1/me/orders/{number}/reorder").json()
    assert result == {"lines": [], "skipped": ["Burns Road Zinger"]}


def test_reorder_of_someone_elses_order_is_404(client: TestClient, db_session: Session, freeze_time):
    from tests.integration.test_admin_orders_api import THURSDAY_EVENING

    sign_in(client, make_user(db_session))
    order = _place(client, freeze_time, THURSDAY_EVENING)
    sign_in(client, make_user(db_session))
    assert client.post(f"/api/v1/me/orders/{order['id']}/reorder").status_code == 404

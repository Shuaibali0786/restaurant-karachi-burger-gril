import uuid
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi.testclient import TestClient
from sqlmodel import Session

from tests.conftest import make_user, sign_in

PKT = ZoneInfo("Asia/Karachi")
THURSDAY_EVENING = datetime(2026, 10, 1, 20, 0, tzinfo=PKT)  # open, ordinary day

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
            "note": "",
            "quantity": 1,
            "addedAt": "2026-10-01T12:00:00Z",
        }
    ],
}


def _place(client: TestClient, freeze_time) -> str:
    freeze_time(THURSDAY_EVENING)
    response = client.post("/api/v1/orders", json=BODY, headers={"Idempotency-Key": str(uuid.uuid4())})
    assert response.status_code == 201
    return str(response.json()["id"])


def test_public_viewer_sees_a_masked_phone_and_no_address(client: TestClient, freeze_time):
    order_id = _place(client, freeze_time)
    response = client.get(f"/api/v1/orders/{order_id}")
    assert response.status_code == 200
    body = response.json()
    assert body["viewer"] == "public"
    assert body["customer"]["phone"] == "+92 3•• ••• ••67"
    assert body["delivery"]["address"] is None
    assert body["delivery"]["landmark"] is None
    assert body["customer"]["name"] == "Ayesha Khan"  # the name itself is not masked


def test_the_owner_sees_full_details(client: TestClient, db_session: Session, freeze_time):
    owner = make_user(db_session, role="customer")
    sign_in(client, owner)
    order_id = _place(client, freeze_time)

    response = client.get(f"/api/v1/orders/{order_id}")
    assert response.status_code == 200
    body = response.json()
    assert body["viewer"] == "owner"
    assert body["customer"]["phone"] == "+923001234567"
    assert body["delivery"]["address"] == "House 12, Street 4, Block 5, Saddar"


def test_another_signed_in_customer_still_gets_the_public_view(client: TestClient, db_session: Session, freeze_time):
    order_id = _place(client, freeze_time)  # placed as a guest
    someone_else = make_user(db_session, role="customer")
    sign_in(client, someone_else)

    response = client.get(f"/api/v1/orders/{order_id}")
    assert response.json()["viewer"] == "public"


def test_admin_sees_full_details(client: TestClient, db_session: Session, freeze_time):
    order_id = _place(client, freeze_time)
    admin = make_user(db_session, role="admin", email="admin@example.com")
    sign_in(client, admin)

    response = client.get(f"/api/v1/orders/{order_id}")
    body = response.json()
    assert body["viewer"] == "admin"
    assert body["delivery"]["address"] == "House 12, Street 4, Block 5, Saddar"


def test_unknown_order_is_a_404(client: TestClient):
    assert client.get("/api/v1/orders/KBG-99999").status_code == 404
    assert client.get("/api/v1/orders/not-a-number").status_code == 404


def test_status_history_lists_events_in_order(client: TestClient, freeze_time):
    order_id = _place(client, freeze_time)
    body = client.get(f"/api/v1/orders/{order_id}").json()
    assert [event["status"] for event in body["statusHistory"]] == ["confirmed"]


def test_the_61st_tracking_request_in_a_minute_is_rate_limited(client: TestClient, freeze_time):
    order_id = _place(client, freeze_time)
    for _ in range(60):
        assert client.get(f"/api/v1/orders/{order_id}").status_code == 200
    assert client.get(f"/api/v1/orders/{order_id}").status_code == 429

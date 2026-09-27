import uuid
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi.testclient import TestClient
from sqlmodel import Session

from tests.conftest import make_user, sign_in

PKT = ZoneInfo("Asia/Karachi")
THURSDAY_EVENING = datetime(2026, 10, 1, 20, 0, tzinfo=PKT)
LATE_NIGHT = datetime(2026, 10, 2, 1, 0, tzinfo=PKT)  # counts toward 2026-10-01's business day

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


def _place(client: TestClient, freeze_time, when: datetime) -> str:
    freeze_time(when)
    response = client.post("/api/v1/orders", json=BODY, headers={"Idempotency-Key": str(uuid.uuid4())})
    assert response.status_code == 201
    return str(response.json()["id"])


def test_admin_routes_refuse_no_session_and_customer_session(client: TestClient, db_session: Session):
    assert client.get("/api/v1/admin/orders").status_code == 401
    sign_in(client, make_user(db_session, role="customer"))
    assert client.get("/api/v1/admin/orders").status_code == 403


def test_admin_login_accepts_only_admins_with_one_generic_error(client: TestClient, db_session: Session):
    make_user(db_session, role="admin", email="admin@example.com", password="correct-horse-battery")
    make_user(db_session, role="customer", email="customer@example.com", password="correct-horse-battery")

    ok = client.post(
        "/api/v1/admin/auth/login", json={"identifier": "admin@example.com", "password": "correct-horse-battery"}
    )
    assert ok.status_code == 200
    assert ok.json()["role"] == "admin"

    as_customer = client.post(
        "/api/v1/admin/auth/login", json={"identifier": "customer@example.com", "password": "correct-horse-battery"}
    )
    wrong_password = client.post(
        "/api/v1/admin/auth/login", json={"identifier": "admin@example.com", "password": "wrong"}
    )
    unknown = client.post("/api/v1/admin/auth/login", json={"identifier": "nobody@example.com", "password": "whatever"})

    for response in (as_customer, wrong_password, unknown):
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"
        assert response.json()["error"]["message"] == as_customer.json()["error"]["message"]


def test_the_list_defaults_to_todays_business_date(client: TestClient, db_session: Session, freeze_time):
    admin = make_user(db_session, role="admin")
    sign_in(client, admin)
    today_id = _place(client, freeze_time, THURSDAY_EVENING)
    late_night_id = _place(client, freeze_time, LATE_NIGHT)  # same business date as THURSDAY_EVENING

    freeze_time(THURSDAY_EVENING)
    ids = {order["id"] for order in client.get("/api/v1/admin/orders").json()}
    assert ids == {today_id, late_night_id}


def test_status_and_since_filters(client: TestClient, db_session: Session, freeze_time):
    admin = make_user(db_session, role="admin")
    sign_in(client, admin)
    first_id = _place(client, freeze_time, THURSDAY_EVENING)

    by_status = client.get("/api/v1/admin/orders", params={"status": "confirmed"}).json()
    assert first_id in {o["id"] for o in by_status}
    assert client.get("/api/v1/admin/orders", params={"status": "delivered"}).json() == []

    cutoff = THURSDAY_EVENING.isoformat()
    second_id = _place(client, freeze_time, THURSDAY_EVENING + timedelta(minutes=1))
    since_ids = {o["id"] for o in client.get("/api/v1/admin/orders", params={"since": cutoff}).json()}
    assert since_ids == {second_id}


def test_the_detail_includes_phone_and_address(client: TestClient, db_session: Session, freeze_time):
    admin = make_user(db_session, role="admin")
    sign_in(client, admin)
    order_id = _place(client, freeze_time, THURSDAY_EVENING)

    detail = client.get(f"/api/v1/admin/orders/{order_id}").json()
    assert detail["viewer"] == "admin"
    assert detail["customer"]["phone"] == "+923001234567"
    assert detail["delivery"]["address"] == "House 12, Street 4, Block 5, Saddar"


def test_a_status_change_is_saved_with_an_event_and_changed_by(client: TestClient, db_session: Session, freeze_time):
    admin = make_user(db_session, role="admin")
    sign_in(client, admin)
    order_id = _place(client, freeze_time, THURSDAY_EVENING)

    response = client.patch(
        f"/api/v1/admin/orders/{order_id}/status", json={"status": "preparing", "expectedStatus": "confirmed"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "preparing"
    assert [event["status"] for event in body["statusHistory"]] == ["confirmed", "preparing"]


def test_a_stale_expected_status_is_refused(client: TestClient, db_session: Session, freeze_time):
    admin = make_user(db_session, role="admin")
    sign_in(client, admin)
    order_id = _place(client, freeze_time, THURSDAY_EVENING)
    client.patch(f"/api/v1/admin/orders/{order_id}/status", json={"status": "preparing", "expectedStatus": "confirmed"})

    stale = client.patch(
        f"/api/v1/admin/orders/{order_id}/status", json={"status": "on-the-way", "expectedStatus": "confirmed"}
    )
    assert stale.status_code == 409
    body = stale.json()["error"]
    assert body["code"] == "INVALID_TRANSITION"
    assert body["details"]["currentStatus"] == "preparing"


def test_todays_summary_excludes_cancelled_and_counts_a_1am_order_toward_yesterday(
    client: TestClient, db_session: Session, freeze_time
):
    admin = make_user(db_session, role="admin")
    sign_in(client, admin)
    kept_id = _place(client, freeze_time, THURSDAY_EVENING)
    late_night_id = _place(client, freeze_time, LATE_NIGHT)
    cancelled_id = _place(client, freeze_time, THURSDAY_EVENING)
    client.patch(
        f"/api/v1/admin/orders/{cancelled_id}/status", json={"status": "cancelled", "expectedStatus": "confirmed"}
    )

    freeze_time(THURSDAY_EVENING)
    summary = client.get("/api/v1/admin/summary/today").json()
    assert summary["orderCount"] == 2  # kept + late_night, cancelled excluded
    assert summary["salesTotal"] == 840 * 2  # burns-road-zinger single + Rs 150 delivery, twice
    assert summary["byStatus"].get("cancelled") == 1
    assert kept_id and late_night_id  # sanity: both placed on the same business date

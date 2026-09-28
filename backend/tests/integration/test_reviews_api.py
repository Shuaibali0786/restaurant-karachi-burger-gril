import uuid
from datetime import datetime

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core import clock
from app.models import Order, User
from app.services import orders as orders_service
from tests.conftest import make_user, sign_in
from tests.integration.test_admin_orders_api import THURSDAY_EVENING

ORDER = {
    "customer": {"name": "Sana Ahmed", "phone": "0300-1234567"},
    "delivery": {"area": "clifton", "address": "House 12, Street 4, Block 5, Clifton"},
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
GOOD = {"rating": 5, "comment": "Hot, crunchy and on time."}


def _order_for(client: TestClient, db_session: Session, freeze_time, user: User | None, *, delivered: bool) -> str:
    """Places an order (signed in as `user`, or as a guest) and optionally walks it to Delivered."""
    freeze_time(THURSDAY_EVENING)
    client.cookies.clear()
    if user is not None:
        sign_in(client, user)
    response = client.post("/api/v1/orders", json=ORDER, headers={"Idempotency-Key": str(uuid.uuid4())})
    assert response.status_code == 201, response.text
    number = response.json()["id"]
    if delivered:
        order = db_session.exec(select(Order).where(Order.number == int(number.removeprefix("KBG-")))).one()
        for step in ("preparing", "on-the-way", "delivered"):
            orders_service.change_status(db_session, order, step, changed_by=None)
    return number


def test_only_the_owner_of_a_delivered_order_can_review_it_once(client: TestClient, db_session: Session, freeze_time):
    owner = make_user(db_session)
    delivered = _order_for(client, db_session, freeze_time, owner, delivered=True)
    preparing = _order_for(client, db_session, freeze_time, owner, delivered=False)
    guest = _order_for(client, db_session, freeze_time, None, delivered=True)

    sign_in(client, owner)
    for number in (preparing, guest):
        refused = client.post(f"/api/v1/me/orders/{number}/review", json=GOOD)
        assert refused.status_code == 409
        assert refused.json()["error"]["code"] == "REVIEW_NOT_ALLOWED"

    sign_in(client, make_user(db_session))
    assert client.post(f"/api/v1/me/orders/{delivered}/review", json=GOOD).status_code == 409

    sign_in(client, owner)
    ok = client.post(f"/api/v1/me/orders/{delivered}/review", json=GOOD)
    assert ok.status_code == 201
    assert ok.json() == {"rating": 5, "status": "pending"}
    again = client.post(f"/api/v1/me/orders/{delivered}/review", json=GOOD)
    assert again.status_code == 409
    assert again.json()["error"]["code"] == "REVIEW_NOT_ALLOWED"

    mine = client.get(f"/api/v1/orders/{delivered}").json()
    assert mine["review"] == {"rating": 5, "status": "pending"}
    client.cookies.clear()
    assert client.get(f"/api/v1/orders/{delivered}").json()["review"] is None


def test_bad_review_input_and_no_session(client: TestClient, db_session: Session, freeze_time):
    owner = make_user(db_session)
    number = _order_for(client, db_session, freeze_time, owner, delivered=True)
    for body in (
        {"rating": 0, "comment": "Fine food"},
        {"rating": 6, "comment": "Fine food"},
        {"rating": 4, "comment": "x" * 501},
        {"rating": 4, "comment": ""},
        {"rating": 4},
    ):
        assert client.post(f"/api/v1/me/orders/{number}/review", json=body).status_code == 422
    client.cookies.clear()
    assert client.post(f"/api/v1/me/orders/{number}/review", json=GOOD).status_code == 401


def test_admin_moderation_needs_an_admin(client: TestClient, db_session: Session):
    assert client.get("/api/v1/admin/reviews").status_code == 401
    assert client.patch("/api/v1/admin/reviews/1", json={"status": "approved"}).status_code == 401
    sign_in(client, make_user(db_session, role="customer"))
    assert client.get("/api/v1/admin/reviews").status_code == 403
    assert client.patch("/api/v1/admin/reviews/1", json={"status": "approved"}).status_code == 403


def test_samples_until_three_approved_then_real_reviews_only(client: TestClient, db_session: Session, freeze_time):
    admin = make_user(db_session, role="admin")
    ids: list[int] = []
    for index in range(3):
        owner = make_user(db_session, name=f"Customer{index}")
        number = _order_for(client, db_session, freeze_time, owner, delivered=True)
        sign_in(client, owner)
        assert (
            client.post(
                f"/api/v1/me/orders/{number}/review", json={"rating": 4, "comment": f"Review {index}"}
            ).status_code
            == 201
        )

    sign_in(client, admin)
    queue = client.get("/api/v1/admin/reviews").json()
    assert len(queue) == 3 and all(r["status"] == "pending" for r in queue)
    ids = [r["id"] for r in queue]

    client.cookies.clear()
    pending_view = client.get("/api/v1/testimonials").json()
    assert pending_view and all(t["isSample"] for t in pending_view)

    sign_in(client, admin)
    assert client.patch(f"/api/v1/admin/reviews/{ids[0]}", json={"status": "approved"}).json()["status"] == "approved"
    assert client.patch(f"/api/v1/admin/reviews/{ids[1]}", json={"status": "approved"}).status_code == 200
    client.cookies.clear()
    assert all(t["isSample"] for t in client.get("/api/v1/testimonials").json())  # only 2 approved

    sign_in(client, admin)
    assert client.patch(f"/api/v1/admin/reviews/{ids[2]}", json={"status": "approved"}).status_code == 200
    client.cookies.clear()
    real = client.get("/api/v1/testimonials").json()
    assert len(real) == 3 and not any(t["isSample"] for t in real)
    assert {t["area"] for t in real} == {"Clifton"}
    # The review is stamped by the database clock (not the frozen test clock): this month, Pakistan time.
    assert all(t["month"] == datetime.now(clock.PKT).strftime("%Y-%m") for t in real)
    assert all(t["name"].endswith(".") or " " not in t["name"] for t in real)

    sign_in(client, admin)
    assert client.patch(f"/api/v1/admin/reviews/{ids[0]}", json={"status": "rejected"}).status_code == 200
    client.cookies.clear()
    assert all(t["isSample"] for t in client.get("/api/v1/testimonials").json())  # back to 2 approved


def test_display_name_is_first_name_and_last_initial(client: TestClient, db_session: Session, freeze_time):
    admin = make_user(db_session, role="admin")
    for _ in range(3):
        owner = make_user(db_session)
        number = _order_for(client, db_session, freeze_time, owner, delivered=True)
        sign_in(client, owner)
        client.post(f"/api/v1/me/orders/{number}/review", json=GOOD)
    sign_in(client, admin)
    for review in client.get("/api/v1/admin/reviews").json():
        client.patch(f"/api/v1/admin/reviews/{review['id']}", json={"status": "approved"})
    client.cookies.clear()
    assert {t["name"] for t in client.get("/api/v1/testimonials").json()} == {"Sana A."}

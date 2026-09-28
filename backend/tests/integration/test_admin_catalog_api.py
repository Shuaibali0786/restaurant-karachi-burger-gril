import uuid

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from tests.conftest import make_user, sign_in
from tests.integration.test_admin_orders_api import THURSDAY_EVENING

ORDER = {
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


def _place(client: TestClient, freeze_time, body=ORDER):
    freeze_time(THURSDAY_EVENING)
    return client.post("/api/v1/orders", json=body, headers={"Idempotency-Key": str(uuid.uuid4())})


@pytest.fixture
def admin(client: TestClient, db_session: Session) -> TestClient:
    sign_in(client, make_user(db_session, role="admin"))
    return client


def test_catalog_routes_refuse_no_session_and_customer(client: TestClient, db_session: Session):
    calls = [
        ("get", "/api/v1/admin/menu-items", None),
        ("patch", "/api/v1/admin/menu-items/burns-road-zinger", {"basePrice": 700}),
        ("get", "/api/v1/admin/delivery-areas", None),
        ("post", "/api/v1/admin/delivery-areas", {"name": "Malir", "fee": 200}),
        ("delete", "/api/v1/admin/delivery-areas/saddar", None),
    ]
    for method, url, body in calls:
        assert getattr(client, method)(url, **({"json": body} if body else {})).status_code == 401
    sign_in(client, make_user(db_session, role="customer"))
    for method, url, body in calls:
        assert getattr(client, method)(url, **({"json": body} if body else {})).status_code == 403


def test_menu_item_price_availability_and_sold_out_can_be_changed(admin: TestClient):
    url = "/api/v1/admin/menu-items/burns-road-zinger"
    changed = admin.patch(url, json={"basePrice": 720, "available": False, "soldOut": True}).json()
    assert (changed["basePrice"], changed["available"], changed["soldOut"]) == (720, False, True)
    listed = {item["slug"]: item for item in admin.get("/api/v1/admin/menu-items").json()}
    assert listed["burns-road-zinger"]["basePrice"] == 720


@pytest.mark.parametrize("body", [{"basePrice": 0}, {"basePrice": -5}, {"basePrice": 100_001}, {}])
def test_bad_menu_edits_are_rejected(admin: TestClient, body):
    assert admin.patch("/api/v1/admin/menu-items/burns-road-zinger", json=body).status_code == 422


def test_unknown_menu_item_is_404(admin: TestClient):
    assert admin.patch("/api/v1/admin/menu-items/nope", json={"basePrice": 500}).status_code == 404


def test_a_price_change_keeps_old_orders_and_prices_new_ones(admin: TestClient, freeze_time):
    first = _place(admin, freeze_time).json()
    admin.patch("/api/v1/admin/menu-items/burns-road-zinger", json={"basePrice": 800})
    second = _place(admin, freeze_time).json()
    assert second["lines"][0]["unitPrice"] == first["lines"][0]["unitPrice"] + 110
    old = admin.get(f"/api/v1/orders/{first['id']}").json()
    assert old["lines"][0]["unitPrice"] == first["lines"][0]["unitPrice"]


def test_admin_can_add_an_area_which_appears_at_checkout_with_its_fee(admin: TestClient, freeze_time):
    created = admin.post("/api/v1/admin/delivery-areas", json={"name": "Malir Cantt", "fee": 250})
    assert created.status_code == 201
    area = created.json()
    assert area["id"] == "malir-cantt" and area["fee"] == 250 and area["enabled"] is True
    public = {a["id"]: a for a in admin.get("/api/v1/delivery-areas").json()}
    assert public["malir-cantt"]["fee"] == 250

    body = {**ORDER, "delivery": {"area": "malir-cantt", "address": "House 1, Street 2, Malir Cantt"}}
    placed = _place(admin, freeze_time, body)
    assert placed.status_code == 201
    assert placed.json()["totals"]["delivery"] == 250


def test_duplicate_area_is_409_and_bad_input_is_422(admin: TestClient):
    assert admin.post("/api/v1/admin/delivery-areas", json={"name": "Malir", "fee": 200}).status_code == 201
    for name in ("Malir", "malir", "MALIR "):
        duplicate = admin.post("/api/v1/admin/delivery-areas", json={"name": name, "fee": 200})
        assert duplicate.status_code == 409
        assert duplicate.json()["error"]["code"] == "CONFLICT"
    for body in ({"name": "X", "fee": 100}, {"name": "Okay Area", "fee": -1}, {"name": "Okay Area", "fee": 2001}):
        assert admin.post("/api/v1/admin/delivery-areas", json=body).status_code == 422
    assert admin.post("/api/v1/admin/delivery-areas", json={"name": "!!!", "fee": 100}).status_code == 422


def test_area_fee_and_enabled_can_be_edited_and_a_disabled_area_is_refused(admin: TestClient, freeze_time):
    assert admin.patch("/api/v1/admin/delivery-areas/saddar", json={"fee": 300}).json()["fee"] == 300
    assert admin.patch("/api/v1/admin/delivery-areas/saddar", json={"enabled": False}).json()["enabled"] is False
    assert "saddar" not in {a["id"] for a in admin.get("/api/v1/delivery-areas").json()}
    refused = _place(admin, freeze_time)
    assert refused.status_code == 422
    assert refused.json()["error"]["code"] == "AREA_UNAVAILABLE"
    assert admin.patch("/api/v1/admin/delivery-areas/saddar", json={}).status_code == 422
    assert admin.patch("/api/v1/admin/delivery-areas/nope", json={"fee": 100}).status_code == 404


def test_an_unused_area_can_be_removed_but_one_with_orders_cannot(admin: TestClient, freeze_time):
    admin.post("/api/v1/admin/delivery-areas", json={"name": "Temp Town", "fee": 100})
    assert admin.delete("/api/v1/admin/delivery-areas/temp-town").status_code == 204
    assert "temp-town" not in {a["id"] for a in admin.get("/api/v1/admin/delivery-areas").json()}
    assert admin.delete("/api/v1/admin/delivery-areas/temp-town").status_code == 404

    assert _place(admin, freeze_time).status_code == 201
    blocked = admin.delete("/api/v1/admin/delivery-areas/saddar")
    assert blocked.status_code == 409
    assert "saddar" in {a["id"] for a in admin.get("/api/v1/admin/delivery-areas").json()}

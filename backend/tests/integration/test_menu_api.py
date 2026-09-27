from sqlmodel import Session, select

from app.models import DeliveryArea, MenuItem


def test_categories_are_returned_in_display_order(client):
    categories = client.get("/api/v1/categories").json()
    assert len(categories) == 8
    assert [c["order"] for c in categories] == sorted(c["order"] for c in categories)
    burgers = next(c for c in categories if c["id"] == "burgers")
    assert burgers["optionGroup"]["required"] is True
    assert {o["id"] for o in burgers["optionGroup"]["options"]} >= {"single", "double", "meal"}
    assert any(a["id"] == "extra-cheese" for a in burgers["addons"])


def test_menu_items_filters_search_sorts_and_features(client):
    all_items = client.get("/api/v1/menu-items").json()
    assert len(all_items) == 33

    burgers_only = client.get("/api/v1/menu-items", params={"category": "burgers"}).json()
    assert burgers_only and all(i["category"] == "burgers" for i in burgers_only)

    found = client.get("/api/v1/menu-items", params={"search": "zinger"}).json()
    assert any(i["slug"] == "burns-road-zinger" for i in found)

    cheapest_first = client.get("/api/v1/menu-items", params={"sort": "price-asc"}).json()
    assert [i["basePrice"] for i in cheapest_first] == sorted(i["basePrice"] for i in cheapest_first)

    most_loved = client.get("/api/v1/menu-items", params={"featured": "most-loved"}).json()
    assert most_loved and all("most-loved" in i["featured"] for i in most_loved)


def test_fried_chicken_and_bbq_sizes_use_per_item_overrides(client):
    bucket = client.get("/api/v1/menu-items/crispy-bucket").json()
    family_pack = next(o for o in bucket["options"] if o["id"] == "family-pack")
    assert bucket["basePrice"] + family_pack["priceDelta"] == 4770


def test_sold_out_item_is_listed_but_flagged(client, db_session: Session):
    item = db_session.exec(select(MenuItem).where(MenuItem.slug == "burns-road-zinger")).one()
    item.is_sold_out = True
    db_session.commit()

    listed = client.get("/api/v1/menu-items").json()
    found = next(i for i in listed if i["slug"] == "burns-road-zinger")
    assert found["soldOut"] is True

    direct = client.get("/api/v1/menu-items/burns-road-zinger").json()
    assert direct["soldOut"] is True


def test_hidden_item_is_omitted_from_the_list_but_visible_directly(client, db_session: Session):
    item = db_session.exec(select(MenuItem).where(MenuItem.slug == "burns-road-zinger")).one()
    item.is_available = False
    db_session.commit()

    listed = client.get("/api/v1/menu-items").json()
    assert all(i["slug"] != "burns-road-zinger" for i in listed)

    direct = client.get("/api/v1/menu-items/burns-road-zinger")
    assert direct.status_code == 200
    assert direct.json()["available"] is False


def test_unknown_slug_is_a_404_with_the_error_envelope(client):
    response = client.get("/api/v1/menu-items/does-not-exist")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_promos_returns_both_seeded_deals(client):
    promos = client.get("/api/v1/promos").json()
    assert {p["id"] for p in promos} == {"burger-combo", "wings-wednesday"}
    wings = next(p for p in promos if p["id"] == "wings-wednesday")
    assert wings["kind"] == "weekday-percent"
    assert wings["weekday"] == 3
    assert wings["percent"] == 20


def test_delivery_areas_lists_only_enabled_ones_with_their_fee(client, db_session: Session):
    disabled = db_session.exec(select(DeliveryArea)).first()
    assert disabled is not None
    disabled.is_enabled = False
    db_session.commit()

    areas = client.get("/api/v1/delivery-areas").json()
    assert all(a["id"] != disabled.id for a in areas)
    assert all(a["fee"] == 150 for a in areas)
    assert len(areas) == 5


def test_admin_can_mark_an_item_sold_out(admin_client):
    response = admin_client.patch("/api/v1/admin/menu-items/burns-road-zinger", json={"soldOut": True})
    assert response.status_code == 200
    assert response.json() == {
        "slug": "burns-road-zinger",
        "name": "Burns Road Zinger",
        "category": "burgers",
        "basePrice": 690,
        "available": True,
        "soldOut": True,
    }
    public = admin_client.get("/api/v1/menu-items/burns-road-zinger").json()
    assert public["soldOut"] is True


def test_admin_menu_endpoints_refuse_guests_and_customers(client, customer_client):
    assert client.get("/api/v1/admin/menu-items").status_code == 401
    assert client.patch("/api/v1/admin/menu-items/burns-road-zinger", json={"soldOut": True}).status_code == 401
    assert customer_client.get("/api/v1/admin/menu-items").status_code == 403


def test_admin_patch_rejects_an_empty_body_and_an_unknown_item(admin_client):
    empty = admin_client.patch("/api/v1/admin/menu-items/burns-road-zinger", json={})
    assert empty.status_code == 422
    missing = admin_client.patch("/api/v1/admin/menu-items/does-not-exist", json={"soldOut": True})
    assert missing.status_code == 404

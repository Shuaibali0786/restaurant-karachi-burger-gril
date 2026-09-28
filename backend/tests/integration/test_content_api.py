from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.models import ContactMessage, NewsletterSubscriber
from tests.conftest import make_user, sign_in

VALID = {"name": "Ayesha Khan", "phone": "0300-1234567", "message": "Do you cater for 50 people?"}


def test_a_contact_message_is_saved_with_a_normalised_phone(client: TestClient, db_session: Session):
    response = client.post("/api/v1/contact-messages", json=VALID)
    assert response.status_code == 201
    assert response.json() == {"status": "received"}
    saved = db_session.exec(select(ContactMessage)).one()
    assert saved.phone == "+923001234567"
    assert saved.is_read is False


def test_contact_validation(client: TestClient):
    bad = [
        {**VALID, "name": "A"},
        {**VALID, "message": "short"},
        {**VALID, "message": "x" * 1001},
        {"name": "Ayesha Khan", "message": "Do you cater for 50 people?"},  # no phone or email
        {**VALID, "phone": "12345"},
        {**VALID, "email": "nope"},
    ]
    for body in bad:
        assert client.post("/api/v1/contact-messages", json=body).status_code == 422, body


def test_script_tags_are_stored_as_plain_text(client: TestClient, db_session: Session):
    text = "<script>alert(1)</script> hello there"
    client.post("/api/v1/contact-messages", json={**VALID, "message": text})
    assert db_session.exec(select(ContactMessage)).one().message == text


def test_newsletter_signup_is_idempotent_and_validated(client: TestClient, db_session: Session):
    for _ in range(2):
        response = client.post("/api/v1/newsletter-subscriptions", json={"email": "Fan@Example.com"})
        assert response.status_code == 200
        assert response.json() == {"status": "subscribed"}
    assert [s.email for s in db_session.exec(select(NewsletterSubscriber)).all()] == ["fan@example.com"]
    assert client.post("/api/v1/newsletter-subscriptions", json={"email": "nope"}).status_code == 422


def test_the_sixth_contact_message_in_an_hour_is_rate_limited(client: TestClient):
    for _ in range(5):
        assert client.post("/api/v1/contact-messages", json=VALID).status_code == 201
    blocked = client.post("/api/v1/contact-messages", json=VALID)
    assert blocked.status_code == 429
    assert blocked.json()["error"]["code"] == "RATE_LIMITED"


def test_admin_message_routes_need_an_admin(client: TestClient, db_session: Session):
    assert client.get("/api/v1/admin/contact-messages").status_code == 401
    sign_in(client, make_user(db_session, role="customer"))
    assert client.get("/api/v1/admin/contact-messages").status_code == 403
    assert client.get("/api/v1/admin/newsletter-subscribers").status_code == 403


def test_admin_lists_newest_first_and_marks_read_and_unread(client: TestClient, db_session: Session):
    client.post("/api/v1/contact-messages", json={**VALID, "message": "The first message here"})
    client.post("/api/v1/contact-messages", json={**VALID, "message": "The second message here"})
    client.post("/api/v1/newsletter-subscriptions", json={"email": "a@example.com"})
    sign_in(client, make_user(db_session, role="admin"))

    listed = client.get("/api/v1/admin/contact-messages").json()
    assert [m["message"] for m in listed][0] == "The second message here"
    first_id = listed[0]["id"]
    assert client.patch(f"/api/v1/admin/contact-messages/{first_id}", json={"isRead": True}).json()["isRead"] is True
    assert [m["id"] for m in client.get("/api/v1/admin/contact-messages", params={"unread": True}).json()] == [
        listed[1]["id"]
    ]
    assert client.patch(f"/api/v1/admin/contact-messages/{first_id}", json={"isRead": False}).json()["isRead"] is False
    assert client.patch("/api/v1/admin/contact-messages/999999", json={"isRead": True}).status_code == 404
    assert [s["email"] for s in client.get("/api/v1/admin/newsletter-subscribers").json()] == ["a@example.com"]

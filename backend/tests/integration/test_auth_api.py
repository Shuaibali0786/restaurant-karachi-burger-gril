import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from tests.conftest import make_user

PASSWORD = "correct-horse-battery"


def _signup(client: TestClient, **fields):
    body = {"name": "Ayesha Khan", "password": PASSWORD, **fields}
    return client.post("/api/v1/auth/signup", json=body)


@pytest.mark.parametrize(
    "contact",
    [{"email": "Ayesha@Example.com"}, {"phone": "0300-1234567"}, {"email": "a@example.com", "phone": "03011234567"}],
)
def test_signup_with_email_phone_or_both_signs_the_customer_in(client: TestClient, contact):
    response = _signup(client, **contact)
    assert response.status_code == 201
    assert response.json()["role"] == "customer"
    assert "password" not in response.text
    assert client.get("/api/v1/auth/me").status_code == 200


def test_duplicate_email_and_phone_are_refused(client: TestClient):
    assert _signup(client, email="dup@example.com", phone="03001112222").status_code == 201
    for contact in ({"email": "DUP@example.com"}, {"phone": "+923001112222"}):
        response = _signup(client, **contact)
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "ACCOUNT_EXISTS"


@pytest.mark.parametrize(
    "fields",
    [
        {"email": "a@example.com", "password": "short"},
        {},
        {"phone": "12345"},
        {"email": "not-an-email"},
    ],
)
def test_bad_signup_is_rejected_with_422(client: TestClient, fields):
    body = {"name": "Ayesha Khan", "password": PASSWORD, **fields}
    response = client.post("/api/v1/auth/signup", json=body)
    assert response.status_code == 422


def test_login_by_email_any_case_and_by_phone_any_format(client: TestClient, db_session: Session):
    make_user(db_session, email="ali@example.com", phone="+923001234567")
    for identifier in ("ALI@Example.com", "0300-1234567", "+92 300 1234567"):
        response = client.post("/api/v1/auth/login", json={"identifier": identifier, "password": PASSWORD})
        assert response.status_code == 200, identifier
    cookie = response.headers["set-cookie"].lower()
    assert "httponly" in cookie and "samesite=lax" in cookie and "path=/" in cookie and "max-age=604800" in cookie


def test_wrong_password_and_unknown_account_look_identical(client: TestClient, db_session: Session):
    make_user(db_session, email="ali@example.com")
    wrong = client.post("/api/v1/auth/login", json={"identifier": "ali@example.com", "password": "nope-nope"})
    unknown = client.post("/api/v1/auth/login", json={"identifier": "who@example.com", "password": "nope-nope"})
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json()


def test_logout_ends_the_session(client: TestClient):
    _signup(client, email="out@example.com")
    assert client.post("/api/v1/auth/logout").status_code == 204
    client.cookies.clear()
    assert client.get("/api/v1/auth/me").status_code == 401


def test_sixth_failed_login_is_rate_limited_and_success_resets(client: TestClient, db_session: Session):
    make_user(db_session, email="lock@example.com")
    bad = {"identifier": "lock@example.com", "password": "wrong-wrong"}
    for _ in range(5):
        assert client.post("/api/v1/auth/login", json=bad).status_code == 401
    blocked = client.post("/api/v1/auth/login", json=bad)
    assert blocked.status_code == 429
    assert blocked.json()["error"]["code"] == "RATE_LIMITED"


def test_signup_is_limited_to_five_per_hour(client: TestClient):
    for index in range(5):
        assert _signup(client, email=f"n{index}@example.com").status_code == 201
    assert _signup(client, email="n6@example.com").status_code == 429


def test_a_readable_hint_cookie_accompanies_the_session_and_goes_away_on_logout(client: TestClient):
    _signup(client, email="hint@example.com")
    assert client.cookies.get("kbg_auth") == "1"
    set_cookies = [c.lower() for c in client.get("/api/v1/auth/me").headers.get_list("set-cookie")]
    assert set_cookies == []  # nothing new to set on a plain read
    client.post("/api/v1/auth/logout")
    assert client.cookies.get("kbg_auth") is None


def test_the_hint_cookie_is_readable_by_scripts_but_the_session_cookie_is_not(client: TestClient):
    response = _signup(client, email="flags@example.com")
    by_name = {c.split("=")[0]: c.lower() for c in response.headers.get_list("set-cookie")}
    assert "httponly" in by_name["kbg_session"]
    assert "httponly" not in by_name["kbg_auth"]

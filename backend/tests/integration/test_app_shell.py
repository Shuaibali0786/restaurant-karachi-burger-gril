"""App shell: error envelope, guards, CORS, docs and health.

Most tests here need no database (they use the `api` fixture); only the health test uses `client`.
"""

from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import Field

from app.core.errors import AppError
from app.schemas.base import CamelRequest

ORIGIN = "http://localhost:3000"


class EchoBody(CamelRequest):
    customer_name: str = Field(min_length=2, max_length=60)
    quantity: int = Field(ge=1, le=20)


def _add_probe_routes(app: FastAPI) -> None:
    @app.post("/api/v1/_probe/echo")
    def echo(body: EchoBody) -> dict[str, str]:
        return {"name": body.customer_name}

    @app.post("/api/v1/_probe/app-error")
    def app_error() -> None:
        raise AppError("ITEM_SOLD_OUT", "Fire Wings is sold out.", details={"items": ["fire-wings"]})

    @app.get("/api/v1/_probe/boom")
    def boom() -> None:
        raise RuntimeError("secret internal detail")


def _client(app: FastAPI, *, raise_server_exceptions: bool = False) -> TestClient:
    _add_probe_routes(app)
    return TestClient(app, raise_server_exceptions=raise_server_exceptions)


def test_docs_and_openapi_are_served(api: TestClient):
    assert api.get("/docs").status_code == 200
    schema = api.get("/openapi.json").json()
    assert schema["info"]["title"] == "Karachi Burger & Grill API"
    assert "/api/v1/healthz" in schema["paths"]


def test_unknown_route_uses_the_error_envelope(api: TestClient):
    response = api.get("/api/v1/nope")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_validation_failure_lists_dotted_field_paths(app: FastAPI):
    client = _client(app)
    response = client.post("/api/v1/_probe/echo", json={"customerName": "A", "quantity": 0})
    assert response.status_code == 422
    body = response.json()["error"]
    assert body["code"] == "VALIDATION_FAILED"
    assert set(body["fields"]) == {"customerName", "quantity"}


def test_unknown_fields_such_as_prices_are_refused(app: FastAPI):
    client = _client(app)
    response = client.post("/api/v1/_probe/echo", json={"customerName": "Ayesha", "quantity": 1, "total": 1})
    assert response.status_code == 422
    assert "total" in response.json()["error"]["fields"]


def test_app_error_carries_code_message_and_details(app: FastAPI):
    client = _client(app)
    response = client.post("/api/v1/_probe/app-error", json={})
    assert response.status_code == 409
    assert response.json() == {
        "error": {"code": "ITEM_SOLD_OUT", "message": "Fire Wings is sold out.", "details": {"items": ["fire-wings"]}}
    }


def test_unhandled_error_leaks_nothing(app: FastAPI):
    client = _client(app)
    response = client.get("/api/v1/_probe/boom")
    assert response.status_code == 500
    assert response.json()["error"]["code"] == "INTERNAL"
    assert "secret internal detail" not in response.text


def test_disallowed_origin_on_a_mutating_request_is_forbidden(app: FastAPI):
    client = _client(app)
    response = client.post(
        "/api/v1/_probe/echo",
        json={"customerName": "Ayesha", "quantity": 1},
        headers={"Origin": "https://evil.example"},
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


def test_allowed_origin_and_no_origin_pass(app: FastAPI):
    client = _client(app)
    payload = {"customerName": "Ayesha", "quantity": 1}
    assert client.post("/api/v1/_probe/echo", json=payload, headers={"Origin": ORIGIN}).status_code == 200
    assert client.post("/api/v1/_probe/echo", json=payload).status_code == 200
    # The interactive /docs page runs on this service's own origin.
    same_host = {"Origin": "http://testserver"}
    assert client.post("/api/v1/_probe/echo", json=payload, headers=same_host).status_code == 200


def test_form_encoded_mutations_are_rejected(app: FastAPI):
    client = _client(app)
    response = client.post("/api/v1/_probe/echo", data={"customerName": "Ayesha", "quantity": "1"})
    assert response.status_code == 415
    assert response.json()["error"]["code"] == "VALIDATION_FAILED"


def test_cors_only_allows_the_frontend(api: TestClient):
    allowed = api.options("/api/v1/healthz", headers={"Origin": ORIGIN, "Access-Control-Request-Method": "GET"})
    assert allowed.headers.get("access-control-allow-origin") == ORIGIN
    assert allowed.headers.get("access-control-allow-credentials") == "true"
    denied = api.options(
        "/api/v1/healthz", headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "GET"}
    )
    assert "access-control-allow-origin" not in denied.headers


def test_every_response_has_a_request_id(api: TestClient):
    assert api.get("/api/v1/nope").headers.get("x-request-id")


def test_healthz_pings_the_database(client: TestClient):
    for path in ("/api/v1/healthz", "/healthz", "/health"):
        response = client.get(path)
        assert response.status_code == 200, path
        assert response.json() == {"status": "ok"}

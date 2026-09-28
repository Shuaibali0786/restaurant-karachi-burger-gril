"""Rate limiting: the proxy header rules, the health-check exemption and the off switch.

None of these need the database (health is given a stand-in session).
"""

import uuid
from types import SimpleNamespace

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from app.core import rate_limit
from app.core.db import get_session
from app.core.rate_limit import client_ip, limiter


def _settings(**overrides):
    values = {"trust_proxy": False, "ratelimit_enabled": True, "ratelimit_storage_uri": "memory://"}
    return SimpleNamespace(**{**values, **overrides})


def _request(forwarded: str | None, peer: str = "10.0.0.1") -> Request:
    headers = [(b"x-forwarded-for", forwarded.encode())] if forwarded else []
    return Request({"type": "http", "headers": headers, "client": (peer, 1234), "method": "GET", "path": "/"})


def test_untrusted_mode_ignores_x_forwarded_for(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(rate_limit, "get_settings", lambda: _settings(trust_proxy=False))
    assert client_ip(_request("203.0.113.9, 10.1.1.1")) == "10.0.0.1"


def test_trusted_mode_uses_the_left_most_forwarded_address(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(rate_limit, "get_settings", lambda: _settings(trust_proxy=True))
    assert client_ip(_request("203.0.113.9, 10.1.1.1")) == "203.0.113.9"
    assert client_ip(_request(None)) == "10.0.0.1"  # no header: fall back to the socket address


def _limited_app(app: FastAPI) -> FastAPI:
    name = f"probe_{uuid.uuid4().hex}"
    path = f"/api/v1/_probe/{name}"

    def probe(request: Request) -> dict[str, str]:  # noqa: ARG001 - required by slowapi
        return {"ok": "yes"}

    # slowapi keeps limits by function name, so every probe needs its own name.
    probe.__name__ = probe.__qualname__ = name
    app.get(path)(limiter.limit("2/minute")(probe))
    app.state.probe_path = path
    return app


def test_a_spoofed_header_cannot_dodge_the_limit_when_untrusted(app: FastAPI, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(rate_limit, "get_settings", lambda: _settings(trust_proxy=False))
    client = TestClient(_limited_app(app))
    path = app.state.probe_path
    statuses = [client.get(path, headers={"X-Forwarded-For": f"198.51.100.{n}"}).status_code for n in range(3)]
    assert statuses == [200, 200, 429]


def test_each_forwarded_address_has_its_own_limit_when_trusted(app: FastAPI, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(rate_limit, "get_settings", lambda: _settings(trust_proxy=True))
    client = TestClient(_limited_app(app))
    path = app.state.probe_path
    first = [client.get(path, headers={"X-Forwarded-For": "198.51.100.1"}).status_code for _ in range(3)]
    other = client.get(path, headers={"X-Forwarded-For": "198.51.100.2"}).status_code
    assert first == [200, 200, 429]
    assert other == 200


def test_health_checks_are_never_rate_limited(app: FastAPI):
    class _Session:
        def exec(self, *_args, **_kwargs):
            return None

    app.dependency_overrides[get_session] = lambda: _Session()
    client = TestClient(app)
    for path in ("/healthz", "/health", "/api/v1/healthz"):
        assert all(client.get(path).status_code == 200 for _ in range(60)), path


def test_the_off_switch_disables_the_limits_and_the_login_lockout(monkeypatch: pytest.MonkeyPatch):
    # slowapi reads RATELIMIT_ENABLED from the environment, which is how production turns it off.
    monkeypatch.setenv("RATELIMIT_ENABLED", "false")
    monkeypatch.setattr(rate_limit, "get_settings", lambda: _settings(ratelimit_enabled=False))
    assert rate_limit._build_limiter().enabled is False
    guard = rate_limit.LoginGuard("memory://", enabled=False)
    for _ in range(20):
        guard.record_failure("203.0.113.5", "someone@example.com")
    assert guard.is_blocked("203.0.113.5", "someone@example.com") is False

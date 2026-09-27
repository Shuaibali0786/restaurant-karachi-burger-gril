"""Test harness.

Safety first: the application under test is always pointed at TEST_DATABASE_URL (a dedicated Neon
branch), never at the development database. If TEST_DATABASE_URL points at the same database as
DATABASE_URL, the whole run aborts. Without TEST_DATABASE_URL, unit tests still run and integration
tests are skipped.
"""

import os
import uuid
from collections.abc import Callable, Iterator
from datetime import datetime
from pathlib import Path

import pytest
from dotenv import dotenv_values
from sqlalchemy import make_url

ROOT = Path(__file__).resolve().parents[1]
_file = dotenv_values(ROOT / ".env")


def _pg(url: str | None) -> str | None:
    if url and url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


_dev_url = _pg(os.environ.get("DATABASE_URL") or _file.get("DATABASE_URL"))
_test_url = _pg(os.environ.get("TEST_DATABASE_URL") or _file.get("TEST_DATABASE_URL"))


def _same_database(a: str, b: str) -> bool:
    x, y = make_url(a), make_url(b)
    return (x.host, x.port or 5432, x.database) == (y.host, y.port or 5432, y.database)


if _test_url and _dev_url and _same_database(_test_url, _dev_url):
    pytest.exit("TEST_DATABASE_URL must not point at the same database as DATABASE_URL. Aborting.", returncode=2)

# Everything below is set BEFORE the app is imported, so the app can never read the real .env values.
_placeholder = "postgresql+psycopg://test:test@localhost:5432/kbg_test_not_configured"
os.environ["DATABASE_URL"] = _test_url or _placeholder
os.environ["DATABASE_URL_DIRECT"] = _test_url or _placeholder
os.environ["TEST_DATABASE_URL"] = _test_url or ""
os.environ["JWT_SECRET"] = "test-only-secret-0123456789-0123456789-0123456789"
os.environ["COOKIE_SECURE"] = "false"
os.environ["TRUST_PROXY"] = "false"
os.environ["RATELIMIT_ENABLED"] = "true"
os.environ["RATELIMIT_STORAGE_URI"] = "memory://"
os.environ["FRONTEND_URL"] = "http://localhost:3000"
os.environ["FREE_DELIVERY_THRESHOLD"] = "1500"
for _name in ("ADMIN_EMAIL", "ADMIN_PASSWORD"):
    os.environ.pop(_name, None)

from alembic.config import Config  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import Engine  # noqa: E402
from sqlmodel import Session  # noqa: E402

from alembic import command  # noqa: E402
from app.core import clock  # noqa: E402
from app.core.db import build_engine, get_session  # noqa: E402
from app.core.rate_limit import limiter, login_guard  # noqa: E402
from app.core.security import COOKIE_NAME, create_token, hash_password  # noqa: E402
from app.main import create_app  # noqa: E402
from app.models import User  # noqa: E402


def pytest_collection_modifyitems(items: list[pytest.Item]) -> None:
    for item in items:
        path = str(item.fspath).replace("\\", "/")
        if "/tests/unit/" in path:
            item.add_marker(pytest.mark.unit)
        elif "/tests/integration/" in path:
            item.add_marker(pytest.mark.integration)


@pytest.fixture(autouse=True)
def _reset_shared_state() -> Iterator[None]:
    """Fresh rate-limit counters and a real clock for every test."""
    limiter.reset()
    login_guard.clear_all()
    clock.set_now_override(None)
    yield
    clock.set_now_override(None)


@pytest.fixture
def freeze_time() -> Callable[[datetime], None]:
    """freeze_time(datetime(2026, 9, 30, 20, 0, tzinfo=PKT)) fixes clock.now() for the test."""

    def _freeze(moment: datetime) -> None:
        clock.set_now_override(lambda: moment)

    return _freeze


# ---------------------------------------------------------------- app without a database


@pytest.fixture
def app() -> FastAPI:
    """A fresh app per test, so tests can add throwaway routes before the first request."""
    return create_app()


@pytest.fixture
def api(app: FastAPI) -> Iterator[TestClient]:
    """Client for tests that do not touch the database."""
    with TestClient(app) as test_client:
        yield test_client


# ---------------------------------------------------------------- app with the test database


@pytest.fixture(scope="session")
def engine() -> Iterator[Engine]:
    if not _test_url:
        pytest.skip("TEST_DATABASE_URL is not set (see backend/.env.example): integration tests skipped")
    alembic_cfg = Config(str(ROOT / "alembic.ini"))
    alembic_cfg.attributes["url"] = _test_url
    command.upgrade(alembic_cfg, "head")
    test_engine = build_engine(_test_url)
    from app.services import seed  # imported here: it needs the schema to exist

    with Session(test_engine) as session:
        seed.seed_all(session)
        session.commit()
    yield test_engine
    test_engine.dispose()


@pytest.fixture
def db_session(engine: Engine) -> Iterator[Session]:
    """Every test runs inside a transaction that is rolled back, so tests never leave data behind."""
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(app: FastAPI, db_session: Session) -> Iterator[TestClient]:
    app.dependency_overrides[get_session] = lambda: db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def make_user(
    session: Session,
    *,
    role: str = "customer",
    email: str | None = None,
    phone: str | None = None,
    name: str = "Test User",
    password: str = "correct-horse-battery",
) -> User:
    user = User(
        id=uuid.uuid4(),
        name=name,
        email=email or (None if phone else f"{uuid.uuid4().hex[:8]}@example.com"),
        phone=phone,
        password_hash=hash_password(password),
        role=role,
    )
    session.add(user)
    session.flush()
    return user


def sign_in(test_client: TestClient, user: User) -> None:
    """Attach a valid session cookie for `user` (independent of the login routes)."""
    test_client.cookies.set(COOKIE_NAME, create_token(user.id, user.role))


@pytest.fixture
def customer_client(client: TestClient, db_session: Session) -> TestClient:
    sign_in(client, make_user(db_session, role="customer"))
    return client


@pytest.fixture
def admin_client(client: TestClient, db_session: Session) -> TestClient:
    sign_in(client, make_user(db_session, role="admin", email="admin@example.com"))
    return client

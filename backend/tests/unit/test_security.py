import uuid
from datetime import UTC, datetime, timedelta

import jwt

from app.core.config import get_settings
from app.core.rate_limit import LoginGuard
from app.core.security import ALGORITHM, create_token, decode_token, hash_password, verify_password


def test_password_hash_is_argon2_and_verifies():
    hashed = hash_password("correct-horse-battery")
    assert hashed.startswith("$argon2")
    assert "correct-horse" not in hashed
    assert verify_password("correct-horse-battery", hashed)[0] is True
    assert verify_password("wrong-password", hashed)[0] is False


def test_unknown_account_never_verifies():
    assert verify_password("anything", None) == (False, None)


def test_garbage_hash_is_not_an_error():
    assert verify_password("anything", "not-a-hash") == (False, None)


def test_token_round_trip_carries_subject_and_role():
    user_id = uuid.uuid4()
    claims = decode_token(create_token(user_id, "admin"))
    assert claims is not None
    assert claims["sub"] == str(user_id)
    assert claims["role"] == "admin"
    expires = datetime.fromtimestamp(claims["exp"], UTC)
    assert timedelta(days=6, hours=23) < expires - datetime.now(UTC) <= timedelta(days=7)


def test_tampered_expired_and_foreign_tokens_are_rejected():
    settings = get_settings()
    good = create_token(uuid.uuid4(), "customer")
    assert decode_token(good + "x") is None
    assert decode_token("garbage") is None
    expired = jwt.encode(
        {"sub": "x", "exp": datetime.now(UTC) - timedelta(seconds=1)}, settings.jwt_secret, algorithm=ALGORITHM
    )
    assert decode_token(expired) is None
    other_secret = jwt.encode({"sub": "x", "exp": datetime.now(UTC) + timedelta(days=1)}, "z" * 40, algorithm=ALGORITHM)
    assert decode_token(other_secret) is None


def test_login_guard_blocks_the_sixth_failure_and_resets():
    guard = LoginGuard("memory://")
    ip, who = "1.2.3.4", "Ayesha@Example.com"
    for _ in range(5):
        assert not guard.is_blocked(ip, who)
        guard.record_failure(ip, who)
    assert guard.is_blocked(ip, who)
    assert guard.is_blocked(ip, "  ayesha@example.com ")  # identifier is normalised
    assert not guard.is_blocked("9.9.9.9", who)  # another IP is unaffected
    guard.reset(ip, who)
    assert not guard.is_blocked(ip, who)


def test_login_guard_can_be_disabled():
    guard = LoginGuard("memory://", enabled=False)
    for _ in range(10):
        guard.record_failure("1.2.3.4", "x")
    assert not guard.is_blocked("1.2.3.4", "x")

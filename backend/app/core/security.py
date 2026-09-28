"""Password hashing (Argon2id via pwdlib), JWT session tokens and the session cookie (ADR-0002)."""

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from fastapi import Response
from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError

from app.core.config import get_settings

COOKIE_NAME = "kbg_session"
# A harmless companion cookie the page scripts CAN read. It only says "a session probably exists", so
# the site can skip asking who is signed in for every guest page view. It carries no secret and grants
# nothing: the httpOnly session cookie and the API remain the only authority.
HINT_COOKIE_NAME = "kbg_auth"
ALGORITHM = "HS256"

_hasher = PasswordHash.recommended()
# Verified against when the account does not exist, so response time does not reveal it.
_DUMMY_HASH = _hasher.hash("timing-equaliser-not-a-real-password")


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str | None) -> tuple[bool, str | None]:
    """Return (valid, upgraded_hash). Pass None for an unknown account: a dummy verify runs and the
    result is always invalid. An upgraded hash, when returned, must be stored."""
    if password_hash is None:
        _hasher.verify(password, _DUMMY_HASH)
        return False, None
    try:
        return _hasher.verify_and_update(password, password_hash)
    except UnknownHashError:
        return False, None


def create_token(user_id: uuid.UUID, role: str) -> str:
    settings = get_settings()
    issued = datetime.now(UTC)
    claims = {
        "sub": str(user_id),
        "role": role,
        "iat": issued,
        "exp": issued + timedelta(days=settings.jwt_expire_days),
    }
    return jwt.encode(claims, settings.jwt_secret, algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any] | None:
    """Return the claims, or None if the token is invalid or expired."""
    try:
        return jwt.decode(token, get_settings().jwt_secret, algorithms=[ALGORITHM], options={"require": ["sub", "exp"]})
    except jwt.PyJWTError:
        return None


def set_session_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=settings.jwt_expire_days * 86_400,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        HINT_COOKIE_NAME,
        "1",
        max_age=settings.jwt_expire_days * 86_400,
        httponly=False,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(COOKIE_NAME, path="/", httponly=True, secure=settings.cookie_secure, samesite="lax")
    response.delete_cookie(HINT_COOKIE_NAME, path="/", secure=settings.cookie_secure, samesite="lax")

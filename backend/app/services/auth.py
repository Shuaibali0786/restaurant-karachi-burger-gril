"""Signs customers and admins in. Signup is User Story 5; this covers login only."""

from sqlmodel import Session, select

from app.core import clock
from app.core.errors import AppError
from app.core.normalise import normalise_email, normalise_pk_mobile
from app.core.rate_limit import login_guard
from app.core.security import verify_password
from app.models import User

_GENERIC_ERROR = "The email/phone or password is incorrect."


def _normalise_identifier(identifier: str) -> str:
    """Email if it looks like one, else whatever was typed (phone normalisation happens against the
    stored value below, since a partially-typed phone must still match the lockout key by raw text)."""
    identifier = identifier.strip()
    return normalise_email(identifier) or identifier


def authenticate(session: Session, identifier: str, password: str, *, ip: str, require_role: str | None = None) -> User:
    """Returns the signed-in user. Raises INVALID_CREDENTIALS for any failure (wrong password,
    unknown account, or an account that doesn't have `require_role`) so none of them can be told
    apart from the outside — and RATE_LIMITED after 5 failures in 15 minutes for this IP+identifier."""
    lookup_key = _normalise_identifier(identifier)
    if login_guard.is_blocked(ip, lookup_key):
        raise AppError("RATE_LIMITED", "Too many attempts. Please wait a few minutes and try again.")

    normalised_phone = normalise_pk_mobile(identifier)
    normalised_email = normalise_email(identifier)
    user: User | None = None
    if normalised_email:
        user = session.exec(select(User).where(User.email == normalised_email)).first()
    elif normalised_phone:
        user = session.exec(select(User).where(User.phone == normalised_phone)).first()

    valid, upgraded_hash = verify_password(password, user.password_hash if user and user.is_active else None)
    if not valid or user is None or (require_role is not None and user.role != require_role):
        login_guard.record_failure(ip, lookup_key)
        raise AppError("INVALID_CREDENTIALS", _GENERIC_ERROR)

    login_guard.reset(ip, lookup_key)
    if upgraded_hash:
        user.password_hash = upgraded_hash
    user.last_login_at = clock.now()
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

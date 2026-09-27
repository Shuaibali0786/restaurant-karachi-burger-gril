"""Shared FastAPI dependencies: database session and the signed-in user (ADR-0002)."""

import uuid
from typing import Annotated

from fastapi import Depends, Request
from sqlmodel import Session

from app.core.db import get_session
from app.core.errors import AppError
from app.core.security import COOKIE_NAME, decode_token
from app.models import User

SessionDep = Annotated[Session, Depends(get_session)]


def get_current_user_optional(request: Request, session: SessionDep) -> User | None:
    """The signed-in user, or None for guests. The user is re-loaded on every request, so a disabled
    account or a changed role takes effect immediately."""
    token = request.cookies.get(COOKIE_NAME)
    claims = decode_token(token) if token else None
    if claims is None:
        return None
    try:
        user_id = uuid.UUID(str(claims["sub"]))
    except ValueError:
        return None
    user = session.get(User, user_id)
    return user if user is not None and user.is_active else None


OptionalUser = Annotated[User | None, Depends(get_current_user_optional)]


def get_current_user(user: OptionalUser) -> User:
    if user is None:
        raise AppError("UNAUTHENTICATED", "Please sign in to continue.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_admin(user: CurrentUser) -> User:
    if user.role != "admin":
        raise AppError("FORBIDDEN", "You do not have access to this area.")
    return user


AdminUser = Annotated[User, Depends(require_admin)]

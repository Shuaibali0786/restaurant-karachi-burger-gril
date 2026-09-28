"""Signup, login, logout and the current session. Admin login is app/api/routes/admin/auth.py."""

from fastapi import APIRouter, Request, Response

from app.api.deps import CurrentUser, SessionDep
from app.core.rate_limit import client_ip, limiter
from app.core.security import clear_session_cookie, create_token, set_session_cookie
from app.models import User
from app.schemas.auth import LoginInput, SessionUser, SignupInput
from app.services import auth as auth_service

router = APIRouter(tags=["auth"])


def _session_user(user: User) -> SessionUser:
    return SessionUser(id=str(user.id), name=user.name, email=user.email, phone=user.phone, role=user.role)


@router.post("/auth/signup", status_code=201, summary="Create a customer account and sign in")
@limiter.limit("5/hour")
def signup(request: Request, body: SignupInput, response: Response, session: SessionDep) -> SessionUser:  # noqa: ARG001
    user = auth_service.signup(session, body)
    set_session_cookie(response, create_token(user.id, user.role))
    return _session_user(user)


@router.post("/auth/login", summary="Sign in with email or phone plus password")
@limiter.limit("20/15 minutes")
def login(request: Request, body: LoginInput, response: Response, session: SessionDep) -> SessionUser:
    user = auth_service.authenticate(session, body.identifier, body.password, ip=client_ip(request))
    set_session_cookie(response, create_token(user.id, user.role))
    return _session_user(user)


@router.post("/auth/logout", status_code=204, summary="Clear the session cookie")
def logout(response: Response) -> None:
    clear_session_cookie(response)


@router.get("/auth/me", summary="The current session's user")
def me(user: CurrentUser) -> SessionUser:
    return _session_user(user)

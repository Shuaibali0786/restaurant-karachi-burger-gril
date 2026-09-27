"""Admin sign-in (contracts/openapi.yaml: POST /admin/auth/login). Separate from customer login
(User Story 5): a customer account, a wrong password and an unknown account all get the same
INVALID_CREDENTIALS, so no one can tell which is true from the outside."""

from fastapi import APIRouter, Request, Response

from app.api.deps import SessionDep
from app.core.rate_limit import client_ip, limiter
from app.core.security import create_token, set_session_cookie
from app.schemas.auth import LoginInput, SessionUser
from app.services import auth as auth_service

router = APIRouter(tags=["admin"])


@router.post("/auth/login", summary="Admin login; non-admin accounts get the same INVALID_CREDENTIALS")
@limiter.limit("20/15 minutes")
def admin_login(request: Request, body: LoginInput, response: Response, session: SessionDep) -> SessionUser:
    user = auth_service.authenticate(
        session, body.identifier, body.password, ip=client_ip(request), require_role="admin"
    )
    set_session_cookie(response, create_token(user.id, user.role))
    return SessionUser(id=str(user.id), name=user.name, email=user.email, phone=user.phone, role=user.role)

"""Session endpoints shared by customers and admins. Signup and customer login are User Story 5;
admin login is app/api/routes/admin/auth.py."""

from fastapi import APIRouter, Response

from app.api.deps import CurrentUser
from app.core.security import clear_session_cookie
from app.schemas.auth import SessionUser

router = APIRouter(tags=["auth"])


@router.post("/auth/logout", status_code=204, summary="Clear the session cookie")
def logout(response: Response) -> None:
    clear_session_cookie(response)


@router.get("/auth/me", summary="The current session's user")
def me(user: CurrentUser) -> SessionUser:
    return SessionUser(id=str(user.id), name=user.name, email=user.email, phone=user.phone, role=user.role)

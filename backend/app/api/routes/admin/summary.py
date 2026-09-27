"""Today's order count and sales total (contracts/openapi.yaml: GET /admin/summary/today)."""

from fastapi import APIRouter

from app.api.deps import AdminUser, SessionDep
from app.schemas.admin import TodaySummary
from app.services import admin as admin_service

router = APIRouter(tags=["admin"])


@router.get("/summary/today", summary="Today's order count and sales (PKT business day, cancelled excluded)")
def get_today_summary(session: SessionDep, _: AdminUser) -> TodaySummary:
    return admin_service.today_summary(session)

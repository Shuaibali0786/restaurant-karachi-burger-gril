"""Admin delivery-area editing: fee and enabled/disabled. Adding a brand-new area is out of scope
for this phase (spec Out of Scope); staff edit the fee and turn the seeded areas on or off."""

from fastapi import APIRouter

from app.api.deps import AdminUser, SessionDep
from app.schemas.admin_catalog import AdminAreaOut, AreaPatch
from app.services import admin_catalog

router = APIRouter(tags=["admin"])


@router.get("/delivery-areas", summary="All delivery areas, including disabled ones")
def list_areas(session: SessionDep, _: AdminUser) -> list[AdminAreaOut]:
    return admin_catalog.list_all_areas(session)


@router.patch("/delivery-areas/{area_id}", summary="Edit an area's fee or enabled state")
def update_area(area_id: str, patch: AreaPatch, session: SessionDep, _: AdminUser) -> AdminAreaOut:
    return admin_catalog.patch_area(session, area_id, patch)

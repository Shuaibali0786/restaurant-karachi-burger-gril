"""Admin delivery areas: list, add, edit fee/enabled, and remove an area that has no orders."""

from fastapi import APIRouter

from app.api.deps import AdminUser, SessionDep
from app.schemas.admin_catalog import AdminAreaOut, AreaCreate, AreaPatch
from app.services import admin_catalog

router = APIRouter(tags=["admin"])


@router.get("/delivery-areas", summary="All delivery areas, including disabled ones")
def list_areas(session: SessionDep, _: AdminUser) -> list[AdminAreaOut]:
    return admin_catalog.list_all_areas(session)


@router.patch("/delivery-areas/{area_id}", summary="Edit an area's fee or enabled state")
def update_area(area_id: str, patch: AreaPatch, session: SessionDep, _: AdminUser) -> AdminAreaOut:
    return admin_catalog.patch_area(session, area_id, patch)


@router.post("/delivery-areas", status_code=201, summary="Add a delivery area (name and fee)")
def create_area(body: AreaCreate, session: SessionDep, _: AdminUser) -> AdminAreaOut:
    return admin_catalog.create_area(session, body)


@router.delete("/delivery-areas/{area_id}", status_code=204, summary="Remove an area that has no orders")
def delete_area(area_id: str, session: SessionDep, _: AdminUser) -> None:
    admin_catalog.delete_area(session, area_id)

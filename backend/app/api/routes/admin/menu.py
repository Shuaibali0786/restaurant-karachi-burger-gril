"""Admin menu editing (contracts/openapi.yaml: GET/PATCH /admin/menu-items...).

Exposed ahead of the full admin menu screen (US6) so staff can mark an item sold out through
`/docs` or a direct request while the UI is still being built. Every route requires an admin
session (see app.api.deps.AdminUser); a customer session or no session is refused.
"""

from fastapi import APIRouter

from app.api.deps import AdminUser, SessionDep
from app.schemas.admin_catalog import AdminMenuItemOut, MenuItemPatch
from app.services import admin_catalog

router = APIRouter(tags=["admin"])


@router.get("/menu-items", summary="All items, including hidden ones")
def list_menu_items(session: SessionDep, _: AdminUser) -> list[AdminMenuItemOut]:
    return admin_catalog.list_all_items(session)


@router.patch("/menu-items/{slug}", summary="Edit price, availability and sold-out (never changes past orders)")
def update_menu_item(slug: str, patch: MenuItemPatch, session: SessionDep, _: AdminUser) -> AdminMenuItemOut:
    return admin_catalog.patch_item(session, slug, patch)

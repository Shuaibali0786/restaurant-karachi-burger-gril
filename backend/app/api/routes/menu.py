"""Public menu endpoints (contracts/openapi.yaml: menu tag). Cacheable by the frontend's ISR (60 s)."""

from fastapi import APIRouter, Query

from app.api.deps import SessionDep
from app.core.errors import AppError
from app.schemas.menu import CategoryOut, DeliveryAreaOut, MenuItemViewOut, PromoOut
from app.services import menu as menu_service

router = APIRouter(tags=["menu"])


@router.get("/categories", summary="Menu categories with option groups and add-ons")
def get_categories(session: SessionDep) -> list[CategoryOut]:
    return menu_service.list_categories(session)


@router.get("/menu-items", summary="Available menu items")
def get_menu_items(
    session: SessionDep,
    category: str | None = None,
    search: str | None = Query(default=None, max_length=60),
    sort: str = Query(default="popular", pattern="^(popular|price-asc|price-desc)$"),
    featured: str | None = Query(default=None, pattern="^(most-loved|chef-special)$"),
) -> list[MenuItemViewOut]:
    return menu_service.list_items(session, category=category, search=search, sort=sort, featured=featured)


@router.get("/menu-items/{slug}", summary="One item (hidden items return available=false, not 404)")
def get_menu_item(slug: str, session: SessionDep) -> MenuItemViewOut:
    item = menu_service.get_item(session, slug)
    if item is None:
        raise AppError("NOT_FOUND", "We couldn't find that item.")
    return item


@router.get("/promos", summary="Active promotions")
def get_promos(session: SessionDep) -> list[PromoOut]:
    return menu_service.list_promos(session)


@router.get("/delivery-areas", summary="Enabled delivery areas with fees")
def get_delivery_areas(session: SessionDep) -> list[DeliveryAreaOut]:
    return menu_service.list_enabled_areas(session)

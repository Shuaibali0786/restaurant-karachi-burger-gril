"""Admin edits to menu items. Price edits never touch past orders: order lines are a snapshot
taken at order time (data-model.md), so changing `menu_item.base_price` here has no effect on any
order already placed."""

import re

from sqlalchemy import func
from sqlmodel import Session, select

from app.core.errors import AppError
from app.models import DeliveryArea, MenuItem, Order
from app.schemas.admin_catalog import AdminAreaOut, AdminMenuItemOut, AreaCreate, AreaPatch, MenuItemPatch


def _out(item: MenuItem) -> AdminMenuItemOut:
    return AdminMenuItemOut(
        slug=item.slug,
        name=item.name,
        category=item.category_id,
        base_price=item.base_price,
        available=item.is_available,
        sold_out=item.is_sold_out,
    )


def list_all_items(session: Session) -> list[AdminMenuItemOut]:
    items = session.exec(select(MenuItem).order_by(MenuItem.category_id, MenuItem.name)).all()
    return [_out(item) for item in items]


def patch_item(session: Session, slug: str, patch: MenuItemPatch) -> AdminMenuItemOut:
    item = session.exec(select(MenuItem).where(MenuItem.slug == slug)).first()
    if item is None:
        raise AppError("NOT_FOUND", "We couldn't find that item.")
    if patch.base_price is not None:
        item.base_price = patch.base_price
    if patch.available is not None:
        item.is_available = patch.available
    if patch.sold_out is not None:
        item.is_sold_out = patch.sold_out
    session.add(item)
    session.commit()
    session.refresh(item)
    return _out(item)


def _area_out(area: DeliveryArea) -> AdminAreaOut:
    return AdminAreaOut(id=area.id, name=area.name, fee=area.fee, enabled=area.is_enabled, order=area.sort_order)


def list_all_areas(session: Session) -> list[AdminAreaOut]:
    areas = sorted(session.exec(select(DeliveryArea)).all(), key=lambda a: a.sort_order)
    return [_area_out(a) for a in areas]


def patch_area(session: Session, area_id: str, patch: AreaPatch) -> AdminAreaOut:
    area = session.get(DeliveryArea, area_id)
    if area is None:
        raise AppError("NOT_FOUND", "We couldn't find that delivery area.")
    if patch.fee is not None:
        area.fee = patch.fee
    if patch.enabled is not None:
        area.is_enabled = patch.enabled
    session.add(area)
    session.commit()
    session.refresh(area)
    return _area_out(area)


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def create_area(session: Session, data: AreaCreate) -> AdminAreaOut:
    """A new area starts enabled, at the end of the list. Its id is the kebab-case name and never
    changes afterwards (orders keep pointing at it)."""
    name = data.name.strip()
    area_id = _slug(name)
    if not area_id:
        raise AppError("VALIDATION_FAILED", "Please check the area name.", fields={"name": "Use letters or numbers."})
    areas = session.exec(select(DeliveryArea)).all()
    if any(a.id == area_id or a.name.lower() == name.lower() for a in areas):
        raise AppError(
            "CONFLICT", "There is already a delivery area with that name.", fields={"name": "Already exists."}
        )
    area = DeliveryArea(
        id=area_id,
        name=name,
        fee=data.fee,
        is_enabled=True,
        sort_order=max((a.sort_order for a in areas), default=0) + 1,
    )
    session.add(area)
    session.commit()
    session.refresh(area)
    return _area_out(area)


def delete_area(session: Session, area_id: str) -> None:
    """Removes an area nobody has ordered to. One with past orders is kept (orders point at it) and
    staff are told to turn it off instead, which hides it from checkout just the same."""
    area = session.get(DeliveryArea, area_id)
    if area is None:
        raise AppError("NOT_FOUND", "We couldn't find that delivery area.")
    used = session.exec(select(func.count()).select_from(Order).where(Order.area_id == area_id)).one()
    if used:
        raise AppError(
            "CONFLICT",
            "This area has past orders, so it can't be removed. Turn it off instead to hide it from checkout.",
        )
    session.delete(area)
    session.commit()

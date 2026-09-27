"""Admin edits to menu items. Price edits never touch past orders: order lines are a snapshot
taken at order time (data-model.md), so changing `menu_item.base_price` here has no effect on any
order already placed."""

from sqlmodel import Session, select

from app.core.errors import AppError
from app.models import DeliveryArea, MenuItem
from app.schemas.admin_catalog import AdminAreaOut, AdminMenuItemOut, AreaPatch, MenuItemPatch


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

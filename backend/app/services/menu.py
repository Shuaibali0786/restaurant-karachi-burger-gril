"""Builds menu views from the database and applies the same filter/search/sort rules as the
frontend's `filterMenu` (frontend/src/lib/menu.ts), so server-side search results and the
client-side menu page always agree."""

from collections.abc import Callable, Sequence
from dataclasses import dataclass
from typing import cast

from sqlmodel import Session, select

from app.models import Category, CategoryAddon, CategoryOption, DeliveryArea, MenuItem, Promo
from app.schemas.menu import (
    AddonOut,
    CategoryOut,
    DeliveryAreaOut,
    MenuItemViewOut,
    OptionGroupOut,
    OptionOut,
    PricePromoOut,
    PromoOut,
    WeekdayPercentPromoOut,
)

MenuSort = str  # "popular" | "price-asc" | "price-desc"


@dataclass(frozen=True)
class CategoryShape:
    """A category's options and add-ons, loaded once and reused for every item in it."""

    category: Category
    options: tuple[CategoryOption, ...]
    addons: tuple[CategoryAddon, ...]


def load_category_shapes(session: Session) -> dict[str, CategoryShape]:
    """Public: also used by services/orders.py to build the pricing catalogue and line snapshots."""
    # Sorted in Python: mypy's SQLModel stubs don't accept a plain `int` column in `.order_by()`,
    # and these tables are small (8 categories, a few dozen options/add-ons), so this costs nothing.
    categories = sorted(session.exec(select(Category)).all(), key=lambda c: c.sort_order)
    options = sorted(session.exec(select(CategoryOption)).all(), key=lambda o: o.sort_order)
    addons = sorted(session.exec(select(CategoryAddon)).all(), key=lambda a: a.sort_order)
    shapes: dict[str, CategoryShape] = {}
    for category in categories:
        shapes[category.id] = CategoryShape(
            category=category,
            options=tuple(o for o in options if o.category_id == category.id),
            addons=tuple(a for a in addons if a.category_id == category.id),
        )
    return shapes


def _build_view(item: MenuItem, shape: CategoryShape) -> MenuItemViewOut:
    resolved_options = [
        OptionOut(
            id=o.key, label=o.label, price_delta=item.option_overrides.get(o.key, o.price_delta), includes=o.includes
        )
        for o in shape.options
    ]
    resolved_addons = [AddonOut(id=a.key, label=a.label, price=a.price) for a in shape.addons]
    return MenuItemViewOut(
        slug=item.slug,
        name=item.name,
        category=item.category_id,
        base_price=item.base_price,
        image=item.image,
        image_alt=item.image_alt,
        description=item.description,
        tag=item.tag,
        rating=item.rating,
        popularity=item.popularity,
        featured=item.featured,
        options=resolved_options,
        addons=resolved_addons,
        sold_out=item.is_sold_out,
        available=item.is_available,
    )


def list_categories(session: Session) -> list[CategoryOut]:
    shapes = load_category_shapes(session)
    return [
        CategoryOut(
            id=shape.category.id,
            name=shape.category.name,
            image=shape.category.image,
            image_alt=shape.category.image_alt,
            order=shape.category.sort_order,
            option_group=OptionGroupOut(
                label=shape.category.option_group_label,
                options=[
                    OptionOut(id=o.key, label=o.label, price_delta=o.price_delta, includes=o.includes)
                    for o in shape.options
                ],
            ),
            addons=[AddonOut(id=a.key, label=a.label, price=a.price) for a in shape.addons],
        )
        for shape in sorted(shapes.values(), key=lambda s: s.category.sort_order)
    ]


def _sort_key(sort: MenuSort) -> Callable[[MenuItemViewOut], tuple[int, int]]:
    if sort == "price-asc":
        return lambda v: (v.base_price, v.popularity)
    if sort == "price-desc":
        return lambda v: (-v.base_price, v.popularity)
    return lambda v: (v.popularity, v.popularity)


def list_items(
    session: Session,
    *,
    category: str | None = None,
    search: str | None = None,
    sort: MenuSort = "popular",
    featured: str | None = None,
    include_hidden: bool = False,
) -> list[MenuItemViewOut]:
    """Available (or, for admin, every) item, filtered, searched and sorted like the frontend."""
    shapes = load_category_shapes(session)
    query = select(MenuItem)
    if category is not None:
        query = query.where(MenuItem.category_id == category)
    if not include_hidden:
        query = query.where(MenuItem.is_available == True)  # noqa: E712 - SQLAlchemy needs `== True`
    items = session.exec(query).all()

    needle = search.strip().lower() if search else ""
    if needle:
        items = [
            item
            for item in items
            if needle in f"{item.name} {item.description} {shapes[item.category_id].category.name}".lower()
        ]
    if featured:
        items = [item for item in items if featured in item.featured]

    views = [_build_view(item, shapes[item.category_id]) for item in items]
    views.sort(key=_sort_key(sort))
    return views


def get_item(session: Session, slug: str) -> MenuItemViewOut | None:
    """The item regardless of availability: a hidden item still returns `available: false`."""
    item = session.exec(select(MenuItem).where(MenuItem.slug == slug)).first()
    if item is None:
        return None
    shapes = load_category_shapes(session)
    return _build_view(item, shapes[item.category_id])


def _promo_out(promo: Promo) -> PromoOut:
    # The `promo` table's CHECK constraint guarantees these columns for each kind.
    if promo.kind == "price":
        return PricePromoOut(
            id=promo.id,
            title=promo.title,
            kind="price",
            item_slug=promo.item_slug,
            price=cast(int, promo.price),
            was_price=cast(int, promo.was_price),
            image=promo.image,
        )
    return WeekdayPercentPromoOut(
        id=promo.id,
        title=promo.title,
        kind="weekday-percent",
        item_slug=promo.item_slug,
        weekday=cast(int, promo.weekday),
        percent=cast(int, promo.percent),
        image=promo.image,
    )


def list_promos(session: Session) -> list[PromoOut]:
    promos: Sequence[Promo] = session.exec(select(Promo).where(Promo.is_active == True)).all()  # noqa: E712
    return [_promo_out(p) for p in promos]


def list_enabled_areas(session: Session) -> list[DeliveryAreaOut]:
    areas = session.exec(select(DeliveryArea).where(DeliveryArea.is_enabled == True)).all()  # noqa: E712
    ordered = sorted(areas, key=lambda a: a.sort_order)
    return [DeliveryAreaOut(id=a.id, name=a.name, fee=a.fee) for a in ordered]


def list_all_areas(session: Session) -> list[DeliveryArea]:
    return sorted(session.exec(select(DeliveryArea)).all(), key=lambda a: a.sort_order)

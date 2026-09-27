"""Loads the exported frontend catalogue into the database (research R6, ADR-0003).

Rows are matched by natural key (category id, option/add-on key, item slug, promo id, area id,
testimonial id). Missing rows are inserted; existing rows are left alone, so prices, availability and
sold-out flags that staff changed survive a re-run. `reset_menu=True` (development only) rewrites the
descriptive and price fields of existing rows from the JSON, but never the availability flags.
"""

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from sqlmodel import Session, select

from app.models import (
    Category,
    CategoryAddon,
    CategoryOption,
    DeliveryArea,
    MenuItem,
    Promo,
    SampleTestimonial,
)

DATA_DIR = Path(__file__).resolve().parents[1] / "seed" / "data"


@dataclass
class SeedReport:
    inserted: dict[str, int] = field(default_factory=dict)
    updated: dict[str, int] = field(default_factory=dict)
    unchanged: dict[str, int] = field(default_factory=dict)

    def count(self, table: str, outcome: str) -> None:
        bucket = {"inserted": self.inserted, "updated": self.updated, "unchanged": self.unchanged}[outcome]
        bucket[table] = bucket.get(table, 0) + 1

    def total(self, outcome: str) -> int:
        return sum({"inserted": self.inserted, "updated": self.updated, "unchanged": self.unchanged}[outcome].values())


def _load(name: str) -> Any:
    return json.loads((DATA_DIR / name).read_text(encoding="utf-8"))


def _apply(row: Any, values: dict[str, Any], table: str, report: SeedReport, reset: bool) -> bool:
    """Update `row` from `values` when resetting. Returns True if the row was changed."""
    if not reset:
        report.count(table, "unchanged")
        return False
    changed = any(getattr(row, key) != value for key, value in values.items())
    for key, value in values.items():
        setattr(row, key, value)
    report.count(table, "updated" if changed else "unchanged")
    return changed


def seed_all(session: Session, *, reset_menu: bool = False) -> SeedReport:
    """Insert missing catalogue rows. The caller commits."""
    report = SeedReport()
    menu = _load("menu.json")

    option_keys: dict[str, set[str]] = {}
    for c in menu["categories"]:
        values = {
            "name": c["name"],
            "image": c["image"],
            "image_alt": c["imageAlt"],
            "sort_order": c["order"],
            "option_group_label": c["optionGroupLabel"],
        }
        category = session.get(Category, c["id"])
        if category is None:
            session.add(Category(id=c["id"], **values))
            report.count("category", "inserted")
        else:
            _apply(category, values, "category", report, reset_menu)
        session.flush()

        option_keys[c["id"]] = {o["key"] for o in c["options"]}
        for o in c["options"]:
            option_values = {
                "label": o["label"],
                "price_delta": o["priceDelta"],
                "includes": o["includes"],
                "sort_order": o["sortOrder"],
            }
            existing = session.exec(
                select(CategoryOption).where(CategoryOption.category_id == c["id"], CategoryOption.key == o["key"])
            ).first()
            if existing is None:
                session.add(CategoryOption(category_id=c["id"], key=o["key"], **option_values))
                report.count("category_option", "inserted")
            else:
                _apply(existing, option_values, "category_option", report, reset_menu)
        for a in c["addons"]:
            addon_values = {"label": a["label"], "price": a["price"], "sort_order": a["sortOrder"]}
            existing_addon = session.exec(
                select(CategoryAddon).where(CategoryAddon.category_id == c["id"], CategoryAddon.key == a["key"])
            ).first()
            if existing_addon is None:
                session.add(CategoryAddon(category_id=c["id"], key=a["key"], **addon_values))
                report.count("category_addon", "inserted")
            else:
                _apply(existing_addon, addon_values, "category_addon", report, reset_menu)
        session.flush()

    for i in menu["items"]:
        unknown = set(i["optionOverrides"]) - option_keys[i["category"]]
        if unknown:
            raise ValueError(f'Item "{i["slug"]}" overrides unknown options {sorted(unknown)}')
        item_values = {
            "name": i["name"],
            "category_id": i["category"],
            "base_price": i["basePrice"],
            "description": i["description"],
            "image": i["image"],
            "image_alt": i["imageAlt"],
            "tag": i["tag"],
            "rating": i["rating"],
            "popularity": i["popularity"],
            "featured": i["featured"],
            "option_overrides": i["optionOverrides"],
        }
        item = session.exec(select(MenuItem).where(MenuItem.slug == i["slug"])).first()
        if item is None:
            session.add(MenuItem(slug=i["slug"], **item_values))
            report.count("menu_item", "inserted")
        else:
            _apply(item, item_values, "menu_item", report, reset_menu)
    session.flush()

    for p in _load("promos.json"):
        promo_values = {
            "title": p["title"],
            "image": p["image"],
            "kind": p["kind"],
            "item_slug": p["itemSlug"],
            "price": p.get("price"),
            "was_price": p.get("wasPrice"),
            "weekday": p.get("weekday"),
            "percent": p.get("percent"),
        }
        promo = session.get(Promo, p["id"])
        if promo is None:
            session.add(Promo(id=p["id"], **promo_values))
            report.count("promo", "inserted")
        else:
            _apply(promo, promo_values, "promo", report, reset_menu)

    for a in _load("areas.json"):
        area_values = {"name": a["name"], "fee": a["fee"], "sort_order": a["order"]}
        area = session.get(DeliveryArea, a["id"])
        if area is None:
            session.add(DeliveryArea(id=a["id"], is_enabled=a["enabled"], **area_values))
            report.count("delivery_area", "inserted")
        else:
            _apply(area, area_values, "delivery_area", report, reset_menu)

    for t in _load("sample_testimonials.json"):
        testimonial_values = {"name": t["name"], "area": t["area"], "quote": t["quote"], "rating": t["rating"]}
        testimonial = session.get(SampleTestimonial, t["id"])
        if testimonial is None:
            session.add(SampleTestimonial(id=t["id"], **testimonial_values))
            report.count("sample_testimonial", "inserted")
        else:
            _apply(testimonial, testimonial_values, "sample_testimonial", report, reset_menu)

    session.flush()
    return report

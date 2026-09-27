"""Proves app/services/pricing.py agrees with the REAL frontend pricing code (ADR-0003, research R5).

`frontend/scripts/export-backend-data.ts` runs the frontend's own `unitPrice`/`cartTotals` and writes
their results to tests/fixtures/pricing_golden.json. This test rebuilds the same catalogue from the
seed JSON (app/seed/data/menu.json + promos.json — the same files the seed script loads into the
database) and checks that the backend's pricing module produces identical numbers for every case.
"""

import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

from app.services.pricing import (
    CartLineInput,
    PriceAddon,
    PricedItem,
    PriceOption,
    WeekdayPromo,
    cart_totals,
    promo_discount_per_unit,
    resolve_cart,
    unit_price,
)
from app.services.pricing import active_promo_for as _active_promo_for

FIXTURES = Path(__file__).resolve().parents[1] / "fixtures"
SEED_DATA = Path(__file__).resolve().parents[2] / "app" / "seed" / "data"
PKT = ZoneInfo("Asia/Karachi")


def _load(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def _build_catalog(menu: dict) -> dict[str, PricedItem]:
    options_by_category = {c["id"]: {o["key"]: o["priceDelta"] for o in c["options"]} for c in menu["categories"]}
    addons_by_category = {
        c["id"]: tuple(PriceAddon(a["key"], a["price"]) for a in c["addons"]) for c in menu["categories"]
    }
    catalog: dict[str, PricedItem] = {}
    for item in menu["items"]:
        overrides = item["optionOverrides"]
        options = tuple(
            PriceOption(key, overrides.get(key, delta)) for key, delta in options_by_category[item["category"]].items()
        )
        catalog[item["slug"]] = PricedItem(
            slug=item["slug"],
            base_price=item["basePrice"],
            options=options,
            addons=addons_by_category[item["category"]],
        )
    return catalog


def _build_promos(promos_json: list[dict]) -> list[WeekdayPromo]:
    return [
        WeekdayPromo(item_slug=p["itemSlug"], weekday=p["weekday"], percent=p["percent"])
        for p in promos_json
        if p["kind"] == "weekday-percent"
    ]


@pytest.fixture(scope="module")
def golden() -> dict:
    if not (FIXTURES / "pricing_golden.json").exists():
        pytest.skip("pricing_golden.json is missing; run: npm run export:backend-data (in frontend/)")
    return _load(FIXTURES / "pricing_golden.json")  # type: ignore[return-value]


@pytest.fixture(scope="module")
def catalog() -> dict[str, PricedItem]:
    return _build_catalog(_load(SEED_DATA / "menu.json"))  # type: ignore[arg-type]


@pytest.fixture(scope="module")
def promos() -> list[WeekdayPromo]:
    return _build_promos(_load(SEED_DATA / "promos.json"))  # type: ignore[arg-type]


def test_golden_fixture_covers_every_seeded_item(golden: dict, catalog: dict[str, PricedItem]):
    covered = {case["item"] for case in golden["unitPrices"]}
    assert covered == set(catalog)


@pytest.mark.parametrize("day", ["wednesday", "thursday"])
def test_unit_price_and_discount_match_the_frontend_for_every_case(
    golden: dict, catalog: dict[str, PricedItem], promos: list[WeekdayPromo], day: str
):
    now = datetime.fromisoformat(golden["days"][day])
    assert now.astimezone(PKT).strftime("%A").lower() == day
    for case in golden["unitPrices"]:
        item = catalog[case["item"]]
        unit = unit_price(item, case["option"], case["addons"])
        assert unit == case["unitPrice"], f"{case['item']}/{case['option']}/{case['addons']} unitPrice on {day}"
        promo = _active_promo_for(item.slug, promos, now)
        discount = promo_discount_per_unit(unit, promo)
        assert discount == case["discountPerUnit"][day], f"{case['item']}/{case['option']} discount on {day}"


def test_cart_totals_match_the_frontend_for_every_scenario(
    golden: dict, catalog: dict[str, PricedItem], promos: list[WeekdayPromo]
):
    for case in golden["carts"]:
        now = datetime.fromisoformat(golden["days"][case["day"]])
        lines = [
            CartLineInput(
                item_slug=line["item"],
                option_key=line["option"],
                addon_keys=tuple(line["addons"]),
                quantity=line["quantity"],
            )
            for line in case["lines"]
        ]
        resolved = resolve_cart(lines, catalog, promos, now)
        assert not resolved.invalid, f'cart case "{case["name"]}" has an invalid line'
        totals = cart_totals(
            resolved.lines, delivery_fee=golden["deliveryFee"], free_delivery_threshold=golden["freeDeliveryThreshold"]
        )
        expected = case["expected"]
        assert (totals.subtotal, totals.discount, totals.delivery, totals.total) == (
            expected["subtotal"],
            expected["discount"],
            expected["delivery"],
            expected["total"],
        ), case["name"]

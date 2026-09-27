from datetime import datetime
from zoneinfo import ZoneInfo

import pytest

from app.core.errors import AppError
from app.services.pricing import (
    CartLineInput,
    PriceAddon,
    PricedItem,
    PriceOption,
    WeekdayPromo,
    active_promo_for,
    cart_totals,
    promo_discount_per_unit,
    resolve_cart,
    unit_price,
)

PKT = ZoneInfo("Asia/Karachi")
WEDNESDAY = datetime(2026, 9, 30, 20, 0, tzinfo=PKT)
THURSDAY = datetime(2026, 10, 1, 20, 0, tzinfo=PKT)

ZINGER = PricedItem(
    slug="burns-road-zinger",
    base_price=690,
    options=(PriceOption("single", 0), PriceOption("double", 300), PriceOption("meal", 350)),
    addons=(PriceAddon("extra-cheese", 100), PriceAddon("jalapenos", 50)),
)
WINGS = PricedItem(
    slug="fire-wings",
    base_price=890,
    options=(PriceOption("regular", 0),),
    addons=(),
)
WINGS_PROMO = WeekdayPromo(item_slug="fire-wings", weekday=3, percent=20)


def test_unit_price_adds_option_and_addons():
    assert unit_price(ZINGER, "double", ["extra-cheese"]) == 690 + 300 + 100


def test_unit_price_before_an_option_is_chosen_shows_base_plus_addons():
    assert unit_price(ZINGER, None, ["jalapenos"]) == 690 + 50


def test_unit_price_rejects_an_option_the_item_does_not_have():
    with pytest.raises(AppError) as excinfo:
        unit_price(ZINGER, "family-pack", [])
    assert excinfo.value.code == "INVALID_OPTION"


def test_unit_price_rejects_an_addon_the_item_does_not_have():
    with pytest.raises(AppError):
        unit_price(ZINGER, "single", ["avocado"])


def test_active_promo_only_on_its_weekday_in_pakistan_time():
    assert active_promo_for("fire-wings", [WINGS_PROMO], WEDNESDAY) == WINGS_PROMO
    assert active_promo_for("fire-wings", [WINGS_PROMO], THURSDAY) is None
    assert active_promo_for("burns-road-zinger", [WINGS_PROMO], WEDNESDAY) is None


def test_promo_discount_rounds_half_up_like_javascript_math_round():
    # 890 * 20% = 178.0 exactly; use a case that actually lands on .5 to prove the rounding rule.
    assert promo_discount_per_unit(25, WeekdayPromo("x", 3, 50)) == 13  # 12.5 -> 13 (half-up)
    assert promo_discount_per_unit(890, WINGS_PROMO) == 178
    assert promo_discount_per_unit(100, None) == 0


def test_resolve_cart_marks_unknown_item_option_and_addon_as_invalid():
    catalog = {"burns-road-zinger": ZINGER}
    lines = [
        CartLineInput("burns-road-zinger", "double", (), 1),
        CartLineInput("does-not-exist", "single", (), 1),
        CartLineInput("burns-road-zinger", "no-such-option", (), 1),
        CartLineInput("burns-road-zinger", "single", ("no-such-addon",), 1),
    ]
    resolved = resolve_cart(lines, catalog, [], THURSDAY)
    assert len(resolved.lines) == 1
    assert len(resolved.invalid) == 3


def test_resolve_cart_applies_the_wednesday_discount_to_the_line():
    catalog = {"fire-wings": WINGS}
    lines = [CartLineInput("fire-wings", "regular", (), 2)]
    resolved = resolve_cart(lines, catalog, [WINGS_PROMO], WEDNESDAY)
    line = resolved.lines[0]
    assert line.unit_price == 890
    assert line.discount_per_unit == 178
    assert line.line_total == (890 - 178) * 2


def test_cart_totals_empty_cart_has_no_delivery_fee():
    totals = cart_totals([], delivery_fee=150, free_delivery_threshold=1500)
    assert totals == cart_totals([], delivery_fee=150, free_delivery_threshold=1500)
    assert (totals.subtotal, totals.discount, totals.delivery, totals.total) == (0, 0, 0, 0)


def test_cart_totals_charges_delivery_below_the_threshold_and_waives_it_at_or_above():
    catalog = {"burns-road-zinger": ZINGER}
    below = resolve_cart([CartLineInput("burns-road-zinger", "single", (), 1)], catalog, [], THURSDAY)
    at_threshold = resolve_cart(
        [CartLineInput("burns-road-zinger", "meal", (), 1), CartLineInput("burns-road-zinger", "double", (), 1)],
        catalog,
        [],
        THURSDAY,
    )
    below_totals = cart_totals(below.lines, delivery_fee=150, free_delivery_threshold=1500)
    at_totals = cart_totals(at_threshold.lines, delivery_fee=150, free_delivery_threshold=1500)
    assert below_totals.delivery == 150
    assert at_totals.subtotal == 1040 + 990
    assert at_totals.delivery == 0
    assert at_totals.total == at_totals.subtotal


def test_cart_totals_mixed_promo_and_non_promo_lines():
    catalog = {"fire-wings": WINGS, "burns-road-zinger": ZINGER}
    lines = [CartLineInput("fire-wings", "regular", (), 2), CartLineInput("burns-road-zinger", "single", (), 1)]
    resolved = resolve_cart(lines, catalog, [WINGS_PROMO], WEDNESDAY)
    totals = cart_totals(resolved.lines, delivery_fee=150, free_delivery_threshold=1500)
    assert totals.subtotal == 890 * 2 + 690
    assert totals.discount == 178 * 2
    assert totals.total == totals.subtotal - totals.discount + totals.delivery

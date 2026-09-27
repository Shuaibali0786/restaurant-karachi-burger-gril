from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from app.core import clock
from app.core.clock import PKT

UTC = ZoneInfo("UTC")


def pkt(y: int, mo: int, d: int, h: int, mi: int = 0) -> datetime:
    return datetime(y, mo, d, h, mi, tzinfo=PKT)


# 2026-09-30 is a Wednesday (2026-09-27 is a Sunday).
def test_weekday_is_sunday_zero():
    assert clock.pkt_weekday(pkt(2026, 9, 27, 15)) == 0
    assert clock.pkt_weekday(pkt(2026, 9, 30, 15)) == 3


def test_wednesday_follows_pakistan_time_not_utc():
    # Tuesday 19:00 UTC is already Wednesday 00:00 in Pakistan.
    assert clock.is_wednesday(datetime(2026, 9, 29, 19, 0, tzinfo=UTC))
    # Wednesday 18:59 UTC is still Wednesday 23:59 in Pakistan; 19:00 UTC is Thursday.
    assert clock.is_wednesday(datetime(2026, 9, 30, 18, 59, tzinfo=UTC))
    assert not clock.is_wednesday(datetime(2026, 9, 30, 19, 0, tzinfo=UTC))
    assert not clock.is_wednesday(datetime(2026, 9, 29, 18, 59, tzinfo=UTC))


@pytest.mark.parametrize(
    ("hour", "minute", "expected"),
    [(11, 59, False), (12, 0, True), (23, 59, True), (0, 0, True), (2, 59, True), (3, 0, False), (8, 0, False)],
)
def test_is_open(hour: int, minute: int, expected: bool):
    assert clock.is_open(pkt(2026, 9, 30, hour, minute)) is expected


def test_next_opening():
    assert clock.next_opening(pkt(2026, 9, 30, 8)) == pkt(2026, 9, 30, 12)
    open_now = pkt(2026, 9, 30, 20)
    assert clock.next_opening(open_now) == open_now


def test_schedule_slots_mid_evening():
    slots = clock.schedule_slots(pkt(2026, 9, 30, 20, 10))
    assert slots[0] == pkt(2026, 9, 30, 21, 0)  # 20:10 + 45 min = 20:55 -> next :00/:30
    assert slots[-1] == pkt(2026, 10, 1, 2, 30)
    assert all(b - a == timedelta(minutes=30) for a, b in zip(slots, slots[1:], strict=False))


def test_schedule_slots_before_opening_start_after_first_half_hour():
    slots = clock.schedule_slots(pkt(2026, 9, 30, 9, 0))
    assert slots[0] == pkt(2026, 9, 30, 12, 30)


def test_schedule_slots_after_midnight_belong_to_previous_service_day():
    slots = clock.schedule_slots(pkt(2026, 10, 1, 1, 0))
    assert slots == [pkt(2026, 10, 1, 2, 0), pkt(2026, 10, 1, 2, 30)]


def test_schedule_slots_empty_late_at_night():
    assert clock.schedule_slots(pkt(2026, 10, 1, 2, 0)) == []


def test_is_valid_slot_and_grace():
    now = pkt(2026, 9, 30, 20, 10)
    assert clock.is_valid_slot(pkt(2026, 9, 30, 21, 0), now)
    assert not clock.is_valid_slot(pkt(2026, 9, 30, 20, 30), now)  # under the 45 min lead
    assert not clock.is_valid_slot(pkt(2026, 9, 30, 21, 15), now)  # not a half-hour boundary
    # At 20:18 the first slot is 21:30, but a page opened at 20:14 offered 21:00: the grace keeps it valid.
    assert clock.schedule_slots(pkt(2026, 9, 30, 20, 18))[0] == pkt(2026, 9, 30, 21, 30)
    assert clock.is_valid_slot(pkt(2026, 9, 30, 21, 0), pkt(2026, 9, 30, 20, 18))
    # At 20:25 the same slot is outside the 5 minute grace.
    assert not clock.is_valid_slot(pkt(2026, 9, 30, 21, 0), pkt(2026, 9, 30, 20, 25))
    assert not clock.is_valid_slot(datetime(2026, 9, 30, 21, 0), now)  # naive datetimes are refused


def test_business_date_counts_after_midnight_orders_for_previous_evening():
    assert clock.business_date(pkt(2026, 9, 30, 20, 0)) == date(2026, 9, 30)
    assert clock.business_date(pkt(2026, 10, 1, 1, 0)) == date(2026, 9, 30)
    assert clock.business_date(pkt(2026, 10, 1, 5, 59)) == date(2026, 9, 30)
    assert clock.business_date(pkt(2026, 10, 1, 6, 0)) == date(2026, 10, 1)


def test_now_override_round_trip():
    clock.set_now_override(lambda: pkt(2026, 9, 30, 12, 0))
    try:
        assert clock.now() == pkt(2026, 9, 30, 12, 0)
    finally:
        clock.set_now_override(None)
    assert clock.now().tzinfo is not None

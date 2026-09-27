"""Pakistan time rules. Mirrors frontend/src/lib/time.ts (research R3).

PKT is a fixed UTC+5 with no daylight saving. `tzdata` is a dependency because Windows has no
system IANA database. `now()` is the single time source so tests can freeze it.
"""

from collections.abc import Callable
from datetime import date, datetime, timedelta
from datetime import time as dtime
from zoneinfo import ZoneInfo

PKT = ZoneInfo("Asia/Karachi")
WEDNESDAY = 3  # Sunday = 0, matching the frontend and the promo table
OPENS_AT = 12  # 12 noon
CLOSES_AT = 3  # 3 AM the following day
SLOT = timedelta(minutes=30)
SCHEDULE_LEAD = timedelta(minutes=45)
SLOT_GRACE = timedelta(minutes=5)

_now_override: Callable[[], datetime] | None = None


def now() -> datetime:
    """Current instant as an aware datetime in PKT."""
    return (_now_override() if _now_override else datetime.now(PKT)).astimezone(PKT)


def set_now_override(fn: Callable[[], datetime] | None) -> None:
    """Test hook: freeze or restore the clock."""
    global _now_override
    _now_override = fn


def pkt_weekday(moment: datetime) -> int:
    """Weekday on the Pakistan wall clock, Sunday = 0."""
    return (moment.astimezone(PKT).weekday() + 1) % 7


def is_wednesday(moment: datetime) -> bool:
    return pkt_weekday(moment) == WEDNESDAY


def is_open(moment: datetime) -> bool:
    """Open daily 12 noon - 3 AM PKT."""
    hour = moment.astimezone(PKT).hour
    return hour >= OPENS_AT or hour < CLOSES_AT


def _service_window(moment: datetime) -> tuple[datetime, datetime]:
    """Opening and closing instants of the service day that `moment` belongs to."""
    local = moment.astimezone(PKT)
    day = local.date() - timedelta(days=1) if local.hour < CLOSES_AT else local.date()
    opens = datetime.combine(day, dtime(OPENS_AT), PKT)
    closes = datetime.combine(day + timedelta(days=1), dtime(CLOSES_AT), PKT)
    return opens, closes


def next_opening(moment: datetime) -> datetime:
    """When the restaurant next opens (now, if already open)."""
    local = moment.astimezone(PKT)
    if is_open(local):
        return local
    return datetime.combine(local.date(), dtime(OPENS_AT), PKT)


def schedule_slots(moment: datetime) -> list[datetime]:
    """'Schedule for later' slots: every 30 minutes, at least 45 minutes ahead, inside the current
    service day. The first slot is 30 minutes after opening and the last is 2:30 AM."""
    opens, closes = _service_window(moment)
    earliest = max(moment + SCHEDULE_LEAD, opens + SLOT)
    epoch = datetime(1970, 1, 1, tzinfo=ZoneInfo("UTC"))
    step = SLOT.total_seconds()
    first = epoch + timedelta(seconds=-(-((earliest - epoch).total_seconds()) // step) * step)
    slots: list[datetime] = []
    slot = first
    while slot <= closes - SLOT:
        slots.append(slot.astimezone(PKT))
        slot += SLOT
    return slots


def is_valid_slot(slot: datetime, moment: datetime) -> bool:
    """A slot is valid if it is offered now, or was offered within the last few minutes (a page that
    was opened just before a slot boundary)."""
    if slot.tzinfo is None:
        return False
    target = slot.astimezone(PKT)
    return any(target == s for s in schedule_slots(moment) + schedule_slots(moment - SLOT_GRACE))


def business_date(moment: datetime) -> date:
    """The service day a moment belongs to. The day runs noon to 3 AM, so a 1 AM order counts toward
    the previous evening: PKT time minus 6 hours."""
    return (moment.astimezone(PKT) - timedelta(hours=6)).date()

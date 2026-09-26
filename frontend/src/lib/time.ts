/**
 * Pakistan Standard Time helpers. PKT is a fixed UTC+5 with no daylight saving,
 * so plain offset arithmetic is exact and identical on server and client.
 */
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const PKT_OFFSET = 5 * HOUR;

export const WEDNESDAY = 3;
const OPENS_AT = 12; // 12 noon
const CLOSES_AT = 3; // 3 AM, the following day

/** Weekday (0 = Sunday), hours and minutes on the Pakistan wall clock. */
export function pktParts(now: Date) {
  const shifted = new Date(now.getTime() + PKT_OFFSET);
  return {
    weekday: shifted.getUTCDay(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
  };
}

/** Milliseconds since the most recent PKT midnight. */
function msSincePktMidnight(now: Date): number {
  return (now.getTime() + PKT_OFFSET) % DAY;
}

export function msUntilNextPktMidnight(now: Date): number {
  return DAY - msSincePktMidnight(now);
}

export function isWednesdayPkt(now: Date): boolean {
  return pktParts(now).weekday === WEDNESDAY;
}

/** Milliseconds until the next Wednesday 00:00 PKT (a full week ahead if today is Wednesday). */
export function msUntilNextWednesdayPkt(now: Date): number {
  const daysAhead = (WEDNESDAY - pktParts(now).weekday + 7) % 7 || 7;
  return (daysAhead - 1) * DAY + msUntilNextPktMidnight(now);
}

/** Wings Wednesday banner: time left today, or time until it starts. */
export function wingsWednesdayCountdown(now: Date): { mode: "ends" | "starts"; ms: number } {
  return isWednesdayPkt(now)
    ? { mode: "ends", ms: msUntilNextPktMidnight(now) }
    : { mode: "starts", ms: msUntilNextWednesdayPkt(now) };
}

/** Open daily 12 noon – 3 AM PKT. */
export function isOpenNow(now: Date): boolean {
  const { hours } = pktParts(now);
  return hours >= OPENS_AT || hours < CLOSES_AT;
}

const SLOT_MS = 30 * 60_000;
const SCHEDULE_LEAD_MS = 45 * 60_000;

/** "9:05 PM" on the Pakistan wall clock. */
export function formatPktTime(date: Date): string {
  const shifted = new Date(date.getTime() + PKT_OFFSET);
  const hours = shifted.getUTCHours();
  const minutes = String(shifted.getUTCMinutes()).padStart(2, "0");
  return `${hours % 12 || 12}:${minutes} ${hours < 12 ? "AM" : "PM"}`;
}

/**
 * "Schedule for later today" slots: every 30 minutes, at least 45 minutes
 * from now, within the current service day (12 noon – 3 AM PKT). The last
 * slot is 2:30 AM so the order arrives before closing.
 */
export function scheduleSlots(now: Date): Date[] {
  const midnight = now.getTime() - msSincePktMidnight(now);
  const afterMidnight = pktParts(now).hours < CLOSES_AT;
  const opens = midnight + (afterMidnight ? OPENS_AT - 24 : OPENS_AT) * HOUR;
  const closes = midnight + (afterMidnight ? CLOSES_AT : CLOSES_AT + 24) * HOUR;

  const earliest = Math.max(now.getTime() + SCHEDULE_LEAD_MS, opens + SLOT_MS);
  const slots: Date[] = [];
  // PKT is a whole-hour offset, so UTC half-hour boundaries are PKT :00/:30 too.
  for (let t = Math.ceil(earliest / SLOT_MS) * SLOT_MS; t <= closes - SLOT_MS; t += SLOT_MS) {
    slots.push(new Date(t));
  }
  return slots;
}

/** Splits a duration into whole days, hours, minutes and seconds. */
export function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

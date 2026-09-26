import { describe, expect, it } from "vitest";
import {
  formatPktTime,
  isOpenNow,
  scheduleSlots,
  isWednesdayPkt,
  msUntilNextPktMidnight,
  msUntilNextWednesdayPkt,
  pktParts,
  wingsWednesdayCountdown,
} from "@/lib/time";

const HOUR = 3_600_000;
// Helper: a Date for a given Pakistan wall-clock time (PKT = UTC+5, no DST).
const pkt = (iso: string) => new Date(`${iso}+05:00`);

describe("Pakistan time helpers", () => {
  it("reads the PKT weekday even when it is still Tuesday in UTC", () => {
    const wedEarly = pkt("2026-09-30T01:30:00"); // Wednesday 01:30 PKT = Tuesday 20:30 UTC
    expect(wedEarly.getUTCDay()).toBe(2);
    expect(pktParts(wedEarly)).toMatchObject({ weekday: 3, hours: 1, minutes: 30 });
    expect(isWednesdayPkt(wedEarly)).toBe(true);
  });

  it("counts down to the next PKT midnight", () => {
    expect(msUntilNextPktMidnight(pkt("2026-09-30T23:00:00"))).toBe(HOUR);
    expect(msUntilNextPktMidnight(pkt("2026-09-30T00:00:00"))).toBe(24 * HOUR);
  });

  it("finds the start of the next Wednesday", () => {
    expect(msUntilNextWednesdayPkt(pkt("2026-10-01T00:00:00"))).toBe(6 * 24 * HOUR); // Thursday
    expect(msUntilNextWednesdayPkt(pkt("2026-09-29T22:00:00"))).toBe(2 * HOUR); // Tuesday night
  });

  it("switches the Wings Wednesday countdown between 'ends' and 'starts'", () => {
    expect(wingsWednesdayCountdown(pkt("2026-09-30T20:00:00"))).toEqual({ mode: "ends", ms: 4 * HOUR });
    expect(wingsWednesdayCountdown(pkt("2026-09-29T22:00:00"))).toEqual({ mode: "starts", ms: 2 * HOUR });
  });

  it("knows opening hours (12 noon to 3 AM, across midnight)", () => {
    expect(isOpenNow(pkt("2026-09-30T11:59:00"))).toBe(false);
    expect(isOpenNow(pkt("2026-09-30T12:00:00"))).toBe(true);
    expect(isOpenNow(pkt("2026-09-30T23:59:00"))).toBe(true);
    expect(isOpenNow(pkt("2026-10-01T02:59:00"))).toBe(true);
    expect(isOpenNow(pkt("2026-10-01T03:00:00"))).toBe(false);
  });
});

describe("delivery scheduling", () => {
  it("formats Pakistan wall-clock times in 12-hour style", () => {
    expect(formatPktTime(pkt("2026-09-30T21:05:00"))).toBe("9:05 PM");
    expect(formatPktTime(pkt("2026-10-01T00:30:00"))).toBe("12:30 AM");
    expect(formatPktTime(pkt("2026-09-30T12:00:00"))).toBe("12:00 PM");
  });

  it("offers half-hour slots at least 45 minutes ahead until 2:30 AM", () => {
    const slots = scheduleSlots(pkt("2026-09-30T20:10:00")).map(formatPktTime);
    expect(slots[0]).toBe("9:00 PM");
    expect(slots.at(-1)).toBe("2:30 AM");
    expect(slots).toHaveLength(12);
  });

  it("still offers slots after midnight until closing", () => {
    expect(scheduleSlots(pkt("2026-10-01T01:00:00")).map(formatPktTime)).toEqual(["2:00 AM", "2:30 AM"]);
    expect(scheduleSlots(pkt("2026-10-01T02:00:00"))).toEqual([]);
  });

  it("starts from opening time when ordering in the closed morning hours", () => {
    const slots = scheduleSlots(pkt("2026-09-30T09:00:00")).map(formatPktTime);
    expect(slots[0]).toBe("12:30 PM");
    expect(slots.at(-1)).toBe("2:30 AM");
  });
});

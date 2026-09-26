import { describe, expect, it } from "vitest";
import { formatPhone, formatRs } from "@/lib/format";

describe("formatRs", () => {
  it.each([
    [1190, "Rs 1,190"],
    [0, "Rs 0"],
    [150, "Rs 150"],
    [7330, "Rs 7,330"],
    [146600, "Rs 146,600"],
  ])("formats %i as %s", (amount, expected) => {
    expect(formatRs(amount)).toBe(expected);
  });
});

describe("formatPhone", () => {
  it("shows a normalised mobile number the local way", () => {
    expect(formatPhone("+923001234567")).toBe("0300 1234567");
  });
});

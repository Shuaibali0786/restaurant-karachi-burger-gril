import { describe, expect, it } from "vitest";
import { getMenuItem } from "@/lib/api";
import { lineKey, MAX_QUANTITY, mergeLine } from "@/lib/cart";
import { lineTotal, unitPrice } from "@/lib/pricing";
import type { CartLine, MenuItemView } from "@/lib/types";

const item = async (slug: string) => (await getMenuItem(slug)) as MenuItemView;

describe("unitPrice / lineTotal", () => {
  it("adds option and add-ons to the base price", async () => {
    const zinger = await item("burns-road-zinger");
    const unit = unitPrice(zinger, "double", ["extra-cheese"]);
    expect(unit).toBe(690 + 300 + 100);
    expect(lineTotal(unit, 2)).toBe(2180);
  });

  it("uses per-item size prices for fried chicken", async () => {
    const bucket = await item("crispy-bucket");
    expect(unitPrice(bucket, "family-pack", [])).toBe(4770);
  });

  it("shows the base price before an option is chosen", async () => {
    const zinger = await item("burns-road-zinger");
    expect(unitPrice(zinger, null, ["jalapenos"])).toBe(740);
  });

  it("rejects options and add-ons the item does not have", async () => {
    const zinger = await item("burns-road-zinger");
    expect(() => unitPrice(zinger, "family-pack", [])).toThrow();
    expect(() => unitPrice(zinger, "single", ["avocado"])).toThrow();
  });
});

describe("cart lines", () => {
  const base = { itemSlug: "burns-road-zinger", optionId: "double", addonIds: ["jalapenos", "extra-cheese"], note: " no onions ", quantity: 2 };

  it("builds an order-independent key with a trimmed note", () => {
    expect(lineKey(base)).toBe(lineKey({ ...base, addonIds: ["extra-cheese", "jalapenos"], note: "no onions" }));
    expect(lineKey(base)).not.toBe(lineKey({ ...base, note: "extra spicy" }));
  });

  it("merges identical configurations and caps quantity", () => {
    let lines: CartLine[] = [];
    lines = mergeLine(lines, base, "2026-09-26T12:00:00Z");
    lines = mergeLine(lines, { ...base, addonIds: ["extra-cheese", "jalapenos"] }, "2026-09-26T12:01:00Z");
    expect(lines).toHaveLength(1);
    expect(lines[0]?.quantity).toBe(4);
    expect(lines[0]?.note).toBe("no onions");

    lines = mergeLine(lines, { ...base, quantity: 50 }, "2026-09-26T12:02:00Z");
    expect(lines[0]?.quantity).toBe(MAX_QUANTITY);

    lines = mergeLine(lines, { ...base, note: "extra spicy" }, "2026-09-26T12:03:00Z");
    expect(lines).toHaveLength(2);
  });
});

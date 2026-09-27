import { describe, expect, it } from "vitest";
import { menuItems } from "@/lib/data/menu-items";
import { mergeLine, type CartLineInput } from "@/lib/cart";
import { toView } from "@/lib/menu-view";
import { cartTotals, DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, resolveCart } from "@/lib/pricing";
import type { CartLine } from "@/lib/types";

const views = menuItems.map(toView);
const NOW = new Date("2026-10-01T20:00:00+05:00"); // Thursday, no deals running

const cart = (...inputs: CartLineInput[]): CartLine[] =>
  inputs.reduce<CartLine[]>((lines, input) => mergeLine(lines, input, NOW.toISOString()), []);

const line = (itemSlug: string, optionId: string, quantity = 1): CartLineInput => ({
  itemSlug,
  optionId,
  addonIds: [],
  note: "",
  quantity,
});

const resolvedLines = (...inputs: CartLineInput[]) => resolveCart(cart(...inputs), views, [], NOW).lines;

describe("cartTotals with a per-area delivery fee", () => {
  it("charges the given fee below the free-delivery threshold", () => {
    const lines = resolvedLines(line("burns-road-zinger", "single"));
    expect(cartTotals(lines, 200)).toMatchObject({ delivery: 200, total: 690 + 200 });
  });

  it("still makes delivery free at or above Rs 1,500, whatever the area's fee", () => {
    const lines = resolvedLines(line("crispy-bucket", "regular"), line("masala-fries", "regular"));
    expect(cartTotals(lines, 300)).toMatchObject({ subtotal: 1780, delivery: 0, total: 1780 });
  });

  it("falls back to the default Rs 150 fee when none is given", () => {
    const lines = resolvedLines(line("burns-road-zinger", "single"));
    expect(cartTotals(lines)).toMatchObject({ delivery: DELIVERY_FEE });
    expect(DELIVERY_FEE).toBe(150);
    expect(FREE_DELIVERY_THRESHOLD).toBe(1500);
  });

  it("charges no delivery for an empty cart regardless of the fee passed in", () => {
    expect(cartTotals([], 500)).toEqual({ subtotal: 0, discount: 0, delivery: 0, total: 0, freeDeliveryRemaining: 1500 });
  });
});

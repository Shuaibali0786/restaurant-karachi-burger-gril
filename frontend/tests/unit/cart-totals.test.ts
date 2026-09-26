import { describe, expect, it } from "vitest";
import { getMenuItems, getPromos } from "@/lib/api";
import { mergeLine, type CartLineInput } from "@/lib/cart";
import { cartTotals, resolveCart } from "@/lib/pricing";
import type { CartLine } from "@/lib/types";

const pkt = (iso: string) => new Date(`${iso}+05:00`);
const WEDNESDAY = pkt("2026-09-30T20:00:00");
const THURSDAY = pkt("2026-10-01T20:00:00");

const cart = (...inputs: CartLineInput[]): CartLine[] =>
  inputs.reduce<CartLine[]>((lines, input) => mergeLine(lines, input, WEDNESDAY.toISOString()), []);

const line = (itemSlug: string, optionId: string, quantity = 1, addonIds: string[] = []): CartLineInput => ({
  itemSlug,
  optionId,
  addonIds,
  note: "",
  quantity,
});

describe("cart totals", async () => {
  const items = await getMenuItems();
  const promos = await getPromos();
  const resolve = (lines: CartLine[], now: Date) => resolveCart(lines, items, promos, now);
  const totals = (lines: CartLine[], now: Date) => cartTotals(resolve(lines, now).lines);

  it("charges Rs 150 delivery below Rs 1,500 and says how much more is needed", () => {
    expect(totals(cart(line("double-trouble-cheese", "single")), THURSDAY)).toEqual({
      subtotal: 1190,
      discount: 0,
      delivery: 150,
      total: 1340,
      freeDeliveryRemaining: 310,
    });
  });

  it("makes delivery free at Rs 1,500 or more", () => {
    const t = totals(cart(line("crispy-bucket", "regular"), line("masala-fries", "regular")), THURSDAY);
    expect(t).toMatchObject({ subtotal: 1780, delivery: 0, total: 1780, freeDeliveryRemaining: 0 });
  });

  it("combines options, add-ons and quantity", () => {
    expect(totals(cart(line("burns-road-zinger", "double", 2, ["extra-cheese"])), THURSDAY)).toMatchObject({
      subtotal: 2180,
      delivery: 0,
      total: 2180,
    });
  });

  it("takes 20% off Fire Wings on Wednesdays in Pakistan time", () => {
    // Double wings: 890 + 800 = 1,690; 20% = 338 off; 1,352 is under 1,500 so delivery applies.
    expect(totals(cart(line("fire-wings", "double")), WEDNESDAY)).toEqual({
      subtotal: 1690,
      discount: 338,
      delivery: 150,
      total: 1502,
      freeDeliveryRemaining: 148,
    });
  });

  it("charges full price for wings on other days and flags a Wednesday deal that has ended", () => {
    const view = resolve(cart(line("fire-wings", "regular", 2)), THURSDAY);
    expect(cartTotals(view.lines)).toMatchObject({ subtotal: 1780, discount: 0 });
    expect(view.promoEnded).toBe(true);
  });

  it("does not discount other items on Wednesdays", () => {
    expect(totals(cart(line("burns-road-zinger", "single")), WEDNESDAY).discount).toBe(0);
  });

  it("drops lines that no longer match the menu but keeps the rest", () => {
    const lines = [
      ...cart(line("burns-road-zinger", "single")),
      { ...cart(line("burns-road-zinger", "single"))[0]!, key: "ghost", itemSlug: "retired-burger" },
      { ...cart(line("burns-road-zinger", "single"))[0]!, key: "bad-option", optionId: "family-pack" },
    ];
    const view = resolve(lines, THURSDAY);
    expect(view.lines.map((l) => l.line.key)).toEqual([lines[0]!.key]);
    expect(view.invalidKeys.sort()).toEqual(["bad-option", "ghost"]);
  });

  it("is empty and free of charges for an empty cart", () => {
    expect(totals([], THURSDAY)).toEqual({ subtotal: 0, discount: 0, delivery: 0, total: 0, freeDeliveryRemaining: 1500 });
  });
});

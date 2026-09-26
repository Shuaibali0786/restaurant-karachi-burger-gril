import { describe, expect, it } from "vitest";
import { getOrder, placeOrder } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { DEMO_STAGE_MS, estimatedArrival, generateOrderId, orderStageIndex, orderStatus } from "@/lib/orders";
import type { PlaceOrderInput } from "@/lib/types";

const input: PlaceOrderInput = {
  customer: { name: "Ayesha Khan", phone: "0300-1234567" },
  delivery: { area: "clifton", address: "House 12, Street 4, Block 5", landmark: "Near Dolmen Mall" },
  timing: { type: "asap" },
  payment: "cod",
  lines: [
    { itemSlug: "burns-road-zinger", optionId: "double", addonIds: ["extra-cheese"], note: "No onions", quantity: 2, addedAt: new Date().toISOString() },
  ],
};

describe("placeOrder", () => {
  it("re-prices from the menu, snapshots lines and can be read back", async () => {
    const order = await placeOrder(input);
    expect(order.id).toMatch(/^KBG-\d{5}$/);
    expect(order.customer.phone).toBe("+923001234567");
    expect(order.delivery.areaName).toBe("Clifton");
    expect(order.lines[0]).toMatchObject({ name: "Burns Road Zinger", optionLabel: "Double", addonLabels: ["Extra cheese"], unitPrice: 1090, lineTotal: 2180 });
    expect(order.totals).toEqual({ subtotal: 2180, discount: 0, delivery: 0, total: 2180 });
    expect(await getOrder(order.id)).toEqual(order);
  });

  it("rejects an empty cart, bad details and items no longer on the menu", async () => {
    await expect(placeOrder({ ...input, lines: [] })).rejects.toMatchObject({ code: "EMPTY_CART" });
    await expect(placeOrder({ ...input, customer: { name: "Ayesha", phone: "021-1234567" } })).rejects.toBeInstanceOf(ApiError);
    await expect(
      placeOrder({ ...input, lines: [{ ...input.lines[0]!, itemSlug: "retired-burger" }] }),
    ).rejects.toMatchObject({ code: "UNKNOWN_ITEM" });
  });

  it("returns null for an order that doesn't exist", async () => {
    expect(await getOrder("KBG-00000")).toBeNull();
  });
});

describe("order tracker and timing", () => {
  const placedAt = "2026-09-30T15:00:00.000Z";
  const at = (ms: number) => new Date(new Date(placedAt).getTime() + ms);

  it("advances Confirmed → Preparing → On the way → Delivered and then stays", () => {
    expect(orderStatus({ placedAt }, at(0))).toBe("confirmed");
    expect(orderStatus({ placedAt }, at(DEMO_STAGE_MS))).toBe("preparing");
    expect(orderStatus({ placedAt }, at(2 * DEMO_STAGE_MS))).toBe("on-the-way");
    expect(orderStatus({ placedAt }, at(3 * DEMO_STAGE_MS))).toBe("delivered");
    expect(orderStageIndex({ placedAt }, at(60 * DEMO_STAGE_MS))).toBe(3);
  });

  it("estimates arrival 30 minutes after an ASAP order, or at the scheduled slot", () => {
    expect(estimatedArrival({ placedAt, timing: { type: "asap" } }).toISOString()).toBe("2026-09-30T15:30:00.000Z");
    expect(estimatedArrival({ placedAt, timing: { type: "scheduled", slot: "2026-09-30T17:00:00.000Z" } }).toISOString()).toBe(
      "2026-09-30T17:00:00.000Z",
    );
  });

  it("creates KBG- ids with 5 digits and avoids ones already used", () => {
    const rolls = [0.5, 0.5, 0.1];
    const id = generateOrderId(new Set(["KBG-55000"]), () => rolls.shift() ?? 0);
    expect(id).toBe("KBG-19000");
  });
});

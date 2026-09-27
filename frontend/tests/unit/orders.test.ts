import { afterEach, describe, expect, it, vi } from "vitest";
import { getOrder, placeOrder } from "@/lib/api";
import { DEMO_STAGE_MS, estimatedArrival, generateOrderId, orderStageIndex, orderStatus } from "@/lib/orders";
import type { Order, PlaceOrderInput } from "@/lib/types";

// placeOrder's own business rules (pricing, opening hours, sold-out items, area validation, ...) now
// live on the server and are proven there (backend/tests/integration/test_orders_api.py); here we
// only check what stays on this side of the wire: the idempotency key and saving the reply locally
// so "My orders on this device" and the confirmation page can read it back (see lib/local-orders.ts).

const input: PlaceOrderInput = {
  customer: { name: "Ayesha Khan", phone: "0300-1234567" },
  delivery: { area: "clifton", address: "House 12, Street 4, Block 5", landmark: "Near Dolmen Mall" },
  timing: { type: "asap" },
  payment: "cod",
  lines: [
    { itemSlug: "burns-road-zinger", optionId: "double", addonIds: ["extra-cheese"], note: "No onions", quantity: 2, addedAt: new Date().toISOString() },
  ],
};

const serverOrder: Order = {
  id: "KBG-10042",
  customer: { name: "Ayesha Khan", phone: "+923001234567" },
  delivery: { area: "clifton", areaName: "Clifton", address: input.delivery.address, landmark: input.delivery.landmark },
  timing: { type: "asap" },
  payment: "cod",
  lines: [
    {
      itemSlug: "burns-road-zinger",
      name: "Burns Road Zinger",
      optionId: "double",
      optionLabel: "Double",
      addonIds: ["extra-cheese"],
      addonLabels: ["Extra cheese"],
      note: "No onions",
      quantity: 2,
      unitPrice: 1090,
      discount: 0,
      lineTotal: 2180,
    },
  ],
  totals: { subtotal: 2180, discount: 0, delivery: 0, total: 2180 },
  placedAt: "2026-09-30T15:00:00.000Z",
  status: "confirmed",
  statusHistory: [{ status: "confirmed", at: "2026-09-30T15:00:00.000Z" }],
  viewer: "owner",
};

afterEach(() => vi.unstubAllGlobals());

describe("placeOrder", () => {
  it("sends an Idempotency-Key header and saves the server's order locally", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(serverOrder), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const order = await placeOrder(input);
    expect(order).toEqual(serverOrder);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const key = (init.headers as Record<string, string>)["Idempotency-Key"];
    expect(key).toMatch(/^[0-9a-f-]{36}$/);

    expect(await getOrder(order.id)).toEqual(order);
  });

  it("reuses the same idempotency key across retries from the same call site", async () => {
    const keys: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        keys.push((init.headers as Record<string, string>)["Idempotency-Key"] ?? "");
        return Promise.resolve(new Response(JSON.stringify(serverOrder), { status: 201 }));
      }),
    );
    const key = crypto.randomUUID();
    await placeOrder(input, { idempotencyKey: key });
    await placeOrder(input, { idempotencyKey: key });
    expect(keys).toEqual([key, key]);
  });

  it("returns null for an order that doesn't exist on this device", async () => {
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

import { afterEach, describe, expect, it, vi } from "vitest";
import { getOrder, placeOrder } from "@/lib/api";
import { estimatedArrival, stageIndexFor } from "@/lib/orders";
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
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify(serverOrder), { status: 201 })));
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

  it("returns null for an order neither this device nor the server has heard of", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { code: "NOT_FOUND", message: "We couldn't find that order." } }), { status: 404 }),
      ),
    );
    expect(await getOrder("KBG-00000")).toBeNull();
  });
});

describe("order tracker and timing", () => {
  const placedAt = "2026-09-30T15:00:00.000Z";

  it("maps the real status to a step on the tracker rail, and Cancelled to none", () => {
    expect(stageIndexFor("confirmed")).toBe(0);
    expect(stageIndexFor("preparing")).toBe(1);
    expect(stageIndexFor("on-the-way")).toBe(2);
    expect(stageIndexFor("delivered")).toBe(3);
    expect(stageIndexFor("cancelled")).toBe(-1);
  });

  it("estimates arrival 30 minutes after an ASAP order, or at the scheduled slot", () => {
    expect(estimatedArrival({ placedAt, timing: { type: "asap" } }).toISOString()).toBe("2026-09-30T15:30:00.000Z");
    expect(estimatedArrival({ placedAt, timing: { type: "scheduled", slot: "2026-09-30T17:00:00.000Z" } }).toISOString()).toBe(
      "2026-09-30T17:00:00.000Z",
    );
  });
});

import type { Order, OrderStatus } from "@/lib/types";

export const ORDER_STAGES: { id: OrderStatus; label: string; detail: string }[] = [
  { id: "confirmed", label: "Order confirmed", detail: "We've received your order." },
  { id: "preparing", label: "Preparing", detail: "Our chefs are firing up the grill." },
  { id: "on-the-way", label: "On the way", detail: "Your rider is heading to you." },
  { id: "delivered", label: "Delivered", detail: "Enjoy your meal — shukriya!" },
];

/** Demo only: the tracker moves to the next stage every few seconds. */
export const DEMO_STAGE_MS = 6_000;
const ASAP_DELIVERY_MS = 30 * 60_000;

/** Index into ORDER_STAGES for the simulated tracker. */
export function orderStageIndex(order: Pick<Order, "placedAt">, now: Date): number {
  const elapsed = now.getTime() - new Date(order.placedAt).getTime();
  return Math.min(ORDER_STAGES.length - 1, Math.max(0, Math.floor(elapsed / DEMO_STAGE_MS)));
}

export function orderStatus(order: Pick<Order, "placedAt">, now: Date): OrderStatus {
  return ORDER_STAGES[orderStageIndex(order, now)]!.id;
}

/** When the order should arrive: ~30 minutes for ASAP, or the chosen slot. */
export function estimatedArrival(order: Pick<Order, "placedAt" | "timing">): Date {
  return order.timing.type === "scheduled"
    ? new Date(order.timing.slot)
    : new Date(new Date(order.placedAt).getTime() + ASAP_DELIVERY_MS);
}

/** KBG- plus 5 digits (e.g. KBG-10234), avoiding ids already used on this device. */
export function generateOrderId(taken: ReadonlySet<string>, random: () => number = Math.random): string {
  for (;;) {
    const id = `KBG-${10000 + Math.floor(random() * 90000)}`;
    if (!taken.has(id)) return id;
  }
}

import type { Order, OrderStatus } from "@/lib/types";

export const ORDER_STAGES: { id: Exclude<OrderStatus, "cancelled">; label: string; detail: string }[] = [
  { id: "confirmed", label: "Order confirmed", detail: "We've received your order." },
  { id: "preparing", label: "Preparing", detail: "Our chefs are firing up the grill." },
  { id: "on-the-way", label: "On the way", detail: "Your rider is heading to you." },
  { id: "delivered", label: "Delivered", detail: "Enjoy your meal — shukriya!" },
];

const ASAP_DELIVERY_MS = 30 * 60_000;

/** Index into ORDER_STAGES for the order's real status from the server; -1 for Cancelled (its own
 * state, not a step on this rail — see OrderTracker). */
export function stageIndexFor(status: OrderStatus): number {
  return ORDER_STAGES.findIndex((stage) => stage.id === status);
}

/** When the order should arrive: ~30 minutes for ASAP, or the chosen slot. */
export function estimatedArrival(order: Pick<Order, "placedAt" | "timing">): Date {
  return order.timing.type === "scheduled"
    ? new Date(order.timing.slot)
    : new Date(new Date(order.placedAt).getTime() + ASAP_DELIVERY_MS);
}

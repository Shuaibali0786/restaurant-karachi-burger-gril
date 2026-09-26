import type { Order } from "@/lib/types";

/**
 * Phase 1 stand-in for the backend's orders table: orders placed on this
 * device, kept in localStorage (last 20). If storage is blocked, orders live in
 * memory for the visit so the confirmation page still works.
 */
const KEY = "kbg-orders-v1";
const KEEP = 20;
const memory = new Map<string, Order>();

function read(): Order[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    return [...memory.values()];
  }
}

export function loadOrders(): Order[] {
  return read();
}

export function loadOrder(id: string): Order | null {
  return read().find((order) => order.id === id) ?? memory.get(id) ?? null;
}

export function saveOrder(order: Order): void {
  memory.set(order.id, order);
  try {
    const orders = [order, ...read().filter((o) => o.id !== order.id)].slice(0, KEEP);
    window.localStorage.setItem(KEY, JSON.stringify(orders));
  } catch {
    // Storage unavailable: the in-memory copy covers this visit.
  }
}

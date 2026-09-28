"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { getAdminOrders } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatRs } from "@/lib/format";
import { formatPktTime } from "@/lib/time";
import type { OrderStatus } from "@/lib/types";
import { usePolling } from "@/hooks/usePolling";
import { EmptyState } from "@/components/ui/EmptyState";
import { NewOrderAlert } from "@/components/admin/NewOrderAlert";

const STATUS_OPTIONS: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "on-the-way", label: "On the way" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_TONE: Record<OrderStatus, string> = {
  confirmed: "bg-flame-400 text-charcoal-950",
  preparing: "bg-ember-500 text-charcoal-950",
  "on-the-way": "bg-charcoal-950 text-flame-400",
  delivered: "bg-cream-200 text-ink-600",
  cancelled: "bg-ember-700/10 text-ember-700",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  confirmed: "Confirmed",
  preparing: "Preparing",
  "on-the-way": "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** The live list, remounted (via `key` in OrdersBoard) whenever a filter changes so it fetches
 * immediately instead of waiting for the next 15 s tick. */
function OrdersList({ status, date }: { status: OrderStatus | ""; date: string }) {
  const seenIds = useRef<Set<string> | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [newCount, setNewCount] = useState(0);

  const { data: orders, error } = usePolling({
    fetcher: () => getAdminOrders({ status: status || undefined, date: date || undefined }),
  });

  useEffect(() => {
    if (!orders) return;
    if (seenIds.current) {
      const fresh = orders.filter((order) => !seenIds.current!.has(order.id));
      if (fresh.length > 0) {
        setNewIds((prev) => new Set([...prev, ...fresh.map((order) => order.id)]));
        setNewCount((n) => n + fresh.length);
      }
    }
    seenIds.current = new Set(orders.map((order) => order.id));
  }, [orders]);

  const dismiss = (id: string) => {
    setNewIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  if (!orders) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-card bg-white ring-1 ring-cream-200">
        <Loader2 aria-hidden="true" className="size-6 animate-spin text-ember-700" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink-600">
          {orders.length} order{orders.length === 1 ? "" : "s"}
          {error ? <span className="ml-2 text-ember-700">· connection trouble, retrying…</span> : null}
        </p>
        <NewOrderAlert count={newCount} />
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={<Loader2 aria-hidden="true" className="size-9" />} title="No orders yet" text="New orders will appear here automatically." />
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/orders/${order.id}`}
                onClick={() => dismiss(order.id)}
                className={cn(
                  "flex min-h-16 flex-wrap items-center justify-between gap-3 rounded-card bg-white p-4 shadow-card ring-1 ring-cream-200 transition hover:ring-ember-500 sm:flex-nowrap",
                  newIds.has(order.id) && "ring-2 ring-flame-400 motion-safe:animate-order-flash",
                )}
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-extrabold text-ink-900 tabular-nums">
                    {order.id}
                    {newIds.has(order.id) && <span className="rounded-full bg-flame-400 px-2 py-0.5 text-[10px] font-black text-charcoal-950 uppercase">New</span>}
                  </p>
                  <p className="truncate text-sm text-ink-600">
                    {order.customerName} · {order.areaName} · {formatPktTime(new Date(order.placedAt))}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap", STATUS_TONE[order.status])}>
                    {STATUS_LABEL[order.status]}
                  </span>
                  <span className="font-extrabold text-ink-900 tabular-nums">{formatRs(order.total)}</span>
                  <ChevronRight aria-hidden="true" className="size-4 text-ink-600" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function OrdersBoard() {
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [date, setDate] = useState("");

  return (
    <section aria-labelledby="orders-board-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 id="orders-board-title" className="font-display text-2xl font-black text-ink-900">
          Live orders
        </h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as OrderStatus | "")}
            aria-label="Filter by status"
            className="min-h-11 rounded-xl border-0 bg-white px-3 text-sm font-semibold text-ink-900 ring-1 ring-cream-200 focus:ring-2 focus:ring-ember-500 focus:outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            aria-label="Filter by date"
            className="min-h-11 rounded-xl border-0 bg-white px-3 text-sm font-semibold text-ink-900 ring-1 ring-cream-200 focus:ring-2 focus:ring-ember-500 focus:outline-none"
          />
        </div>
      </div>
      <OrdersList key={`${status}-${date}`} status={status} date={date} />
    </section>
  );
}

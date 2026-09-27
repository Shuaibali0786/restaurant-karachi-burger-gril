"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import { ChevronRight, Search } from "lucide-react";
import type { Order } from "@/lib/types";
import { getOrder, getRecentOrders } from "@/lib/api";
import { formatRs } from "@/lib/format";
import { ORDER_STAGES, stageIndexFor } from "@/lib/orders";
import { formatPktTime } from "@/lib/time";
import { buttonClasses } from "@/components/ui/Button";
import { inputClass } from "@/components/forms/Field";

/** The label shown for an order's current status in the "on this device" list. */
function stageLabel(order: Order): string {
  if (order.status === "cancelled") return "Cancelled";
  return ORDER_STAGES[stageIndexFor(order.status)]!.label;
}

/** Find an order by number, or pick one of the orders placed on this device. */
export function TrackOrder() {
  const router = useRouter();
  const uid = useId();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getRecentOrders().then(setOrders);
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const digits = value.replace(/\D/g, "");
    const id = `KBG-${digits}`;
    if (digits.length !== 5) {
      setError("Order numbers look like KBG-12345.");
      return;
    }
    if (!(await getOrder(id))) {
      setError(`We couldn't find ${id}. Please check the order number and try again.`);
      return;
    }
    router.push(`/order/${id}`);
  };

  return (
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <form onSubmit={onSubmit} noValidate className="rounded-card bg-white p-6 shadow-card ring-1 ring-cream-200 sm:p-8">
        <h2 className="font-display text-3xl font-black text-ink-900">Find your order</h2>
        <label htmlFor={`${uid}-id`} className="mt-4 mb-1.5 block text-sm font-bold text-ink-900">
          Order number
        </label>
        <div className="flex gap-2">
          <input
            id={`${uid}-id`}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError(null);
            }}
            placeholder="KBG-12345"
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${uid}-error` : undefined}
            className={`${inputClass} min-h-12 uppercase`}
          />
          <button type="submit" className={buttonClasses("primary", "md", "min-h-12 shrink-0")}>
            <Search aria-hidden="true" className="size-4" /> Track
          </button>
        </div>
        {error && (
          <p id={`${uid}-error`} role="alert" className="mt-2 text-sm font-semibold text-ember-700">
            {error}
          </p>
        )}
        <p className="mt-4 text-sm text-ink-600">You&apos;ll find the number on your confirmation page.</p>
      </form>

      <section aria-labelledby={`${uid}-recent`} className="rounded-card bg-cream-100/70 p-6 ring-1 ring-cream-200 sm:p-8">
        <h2 id={`${uid}-recent`} className="font-display text-3xl font-black text-ink-900">
          Orders on this device
        </h2>
        {orders === null ? (
          <div className="mt-4 h-24 animate-pulse rounded-xl bg-cream-200/60" />
        ) : orders.length === 0 ? (
          <p className="mt-3 text-ink-600">
            No orders yet.{" "}
            <Link href="/menu" className="font-bold text-ember-700 underline underline-offset-4">
              Start one from the menu
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {orders.map((order) => {
              const stage = stageLabel(order);
              return (
                <li key={order.id}>
                  <Link
                    href={`/order/${order.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 ring-1 ring-cream-200 transition hover:ring-ember-500"
                  >
                    <span>
                      <span className="block font-extrabold text-ink-900 tabular-nums">{order.id}</span>
                      <span className="block text-sm text-ink-600">
                        {formatPktTime(new Date(order.placedAt))} · {order.lines.reduce((n, l) => n + l.quantity, 0)} items · {formatRs(order.totals.total)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 text-sm font-bold text-ember-700">
                      {stage} <ChevronRight aria-hidden="true" className="size-4" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

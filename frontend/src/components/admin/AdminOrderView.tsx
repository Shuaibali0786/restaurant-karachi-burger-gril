"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, SearchX } from "lucide-react";
import type { Order } from "@/lib/types";
import { getAdminOrder } from "@/lib/api";
import { usePolling } from "@/hooks/usePolling";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { OrderDetail } from "@/components/admin/OrderDetail";
import { StatusControl } from "@/components/admin/StatusControl";

type LoadState = { status: "loading" } | { status: "missing" } | { status: "ready"; order: Order };

/** Order detail page: loads the order, polls every 15 s for changes made by another staff member,
 * and lets StatusControl push its own update immediately without waiting for the next poll tick. */
export function AdminOrderView({ id }: { id: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void getAdminOrder(id)
      .then((order) => {
        if (active) setState({ status: "ready", order });
      })
      .catch(() => {
        if (active) setState({ status: "missing" });
      });
    return () => {
      active = false;
    };
  }, [id]);

  const { data: polled } = usePolling({
    fetcher: () => getAdminOrder(id),
    enabled: state.status === "ready",
    done: (value) => value.status === "delivered" || value.status === "cancelled",
  });

  if (state.status === "loading") {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Loader2 aria-hidden="true" className="size-6 animate-spin text-ember-700" />
      </div>
    );
  }

  if (state.status === "missing") {
    return (
      <EmptyState
        icon={<SearchX aria-hidden="true" className="size-9" />}
        title="Order not found"
        text={`We couldn't find order ${id}.`}
        action={<ButtonLink href="/admin">Back to dashboard</ButtonLink>}
      />
    );
  }

  // Prefer whichever copy has moved furthest: right after a manual status change, `polled` may
  // still hold a stale pre-change fetch until its next tick catches up.
  const order = polled && polled.statusHistory.length >= state.order.statusHistory.length ? polled : state.order;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="flex items-center gap-1 text-sm font-bold text-ink-600 hover:text-ember-700">
          <ArrowLeft aria-hidden="true" className="size-4" /> Back to dashboard
        </Link>
        <h1 className="font-display text-2xl font-black text-ink-900 tabular-nums">{order.id}</h1>
      </div>

      <div className="rounded-card bg-white p-4 shadow-card ring-1 ring-cream-200">
        <StatusControl order={order} onChanged={(updated) => setState({ status: "ready", order: updated })} />
      </div>

      <OrderDetail order={order} />
    </div>
  );
}

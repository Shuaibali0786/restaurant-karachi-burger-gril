"use client";

import { useState } from "react";
import { Ban, CircleAlert, Loader2 } from "lucide-react";
import { getAdminOrder, setOrderStatus } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import type { Order, OrderStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  confirmed: "preparing",
  preparing: "on-the-way",
  "on-the-way": "delivered",
};

const NEXT_LABEL: Record<OrderStatus, string> = {
  confirmed: "Preparing",
  preparing: "On the way",
  "on-the-way": "Delivered",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  confirmed: "Confirmed",
  preparing: "Preparing",
  "on-the-way": "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

interface StatusControlProps {
  order: Order;
  /** Called with the freshly loaded order after any successful — or conflicting — change. */
  onChanged: (order: Order) => void;
}

/** Move-forward and cancel buttons, following the same state machine the server enforces
 * (data-model.md): only the next step, or cancel from any non-terminal status. */
export function StatusControl({ order, onChanged }: StatusControlProps) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isTerminal = order.status === "delivered" || order.status === "cancelled";
  const next = NEXT_STATUS[order.status];

  const apply = async (target: OrderStatus) => {
    setBusy(true);
    setMessage(null);
    try {
      const updated = await setOrderStatus(order.id, target, order.status);
      onChanged(updated);
    } catch (error) {
      if (error instanceof ApiError && error.code === "INVALID_TRANSITION") {
        const current = error.details?.currentStatus as OrderStatus | undefined;
        setMessage(`This order has already moved on to "${current ? (STATUS_LABEL[current] ?? current) : "another status"}". Refreshed below.`);
        onChanged(await getAdminOrder(order.id)); // someone else changed it first — show the real state
      } else {
        setMessage(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
      setConfirmingCancel(false);
    }
  };

  if (isTerminal) {
    return (
      <p className="rounded-xl bg-cream-100 px-4 py-3 text-sm font-bold text-ink-600 ring-1 ring-cream-200">
        {order.status === "delivered" ? "This order has been delivered." : "This order was cancelled."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {message && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-ember-500/10 p-3 text-sm font-semibold text-ember-700 ring-1 ring-ember-500/30">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {next && (
          <Button onClick={() => void apply(next)} disabled={busy} className="min-h-12 flex-1 sm:flex-none">
            {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
            Mark as {NEXT_LABEL[order.status]}
          </Button>
        )}
        {!confirmingCancel ? (
          <Button variant="secondary" onClick={() => setConfirmingCancel(true)} disabled={busy} className="min-h-12 border-ember-700 text-ember-700">
            <Ban aria-hidden="true" className="size-4" /> Cancel order
          </Button>
        ) : (
          <div className="flex min-h-12 flex-1 items-center gap-2 rounded-full bg-ember-500/10 px-4 ring-1 ring-ember-500/30 sm:flex-none">
            <span className="text-sm font-bold text-ember-700">Cancel this order?</span>
            <button type="button" onClick={() => void apply("cancelled")} disabled={busy} className="text-sm font-black text-ember-700 underline underline-offset-2">
              Yes, cancel
            </button>
            <button type="button" onClick={() => setConfirmingCancel(false)} disabled={busy} className="text-sm font-bold text-ink-600 underline underline-offset-2">
              No
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

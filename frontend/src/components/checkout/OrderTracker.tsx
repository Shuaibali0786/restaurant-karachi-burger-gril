"use client";

import { Ban, Bike, Check, ChefHat, House, ReceiptText } from "lucide-react";
import type { Order } from "@/lib/types";
import { getOrder } from "@/lib/api";
import { cn } from "@/lib/cn";
import { ORDER_STAGES, stageIndexFor } from "@/lib/orders";
import { usePolling } from "@/hooks/usePolling";

const icons = [ReceiptText, ChefHat, Bike, House];

/**
 * Confirmed → Preparing → On the way → Delivered, polled from the server every 15 s (research
 * R11) so it stays live without a reload. Stops polling once Delivered or Cancelled — Cancelled
 * replaces the whole rail with its own state.
 */
export function OrderTracker({ id, initialOrder }: { id: string; initialOrder: Order }) {
  const { data: order } = usePolling({
    fetcher: async () => {
      const fresh = await getOrder(id);
      if (!fresh) throw new Error("Order not found");
      return fresh;
    },
    initialData: initialOrder,
    done: (value) => value.status === "delivered" || value.status === "cancelled",
  });

  const current = order ?? initialOrder;

  if (current.status === "cancelled") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p aria-live="polite" className="sr-only">
          Order status: Cancelled.
        </p>
        <span
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-full bg-ember-700/10 text-ember-700 ring-1 ring-ember-700/30"
        >
          <Ban className="size-7" />
        </span>
        <p className="font-display text-2xl font-black text-ink-900">This order was cancelled</p>
        <p className="max-w-sm text-ink-600">If this wasn&apos;t expected, please contact us and we&apos;ll help sort it out.</p>
      </div>
    );
  }

  const index = stageIndexFor(current.status);
  const active = Math.max(index, 0);
  const stage = ORDER_STAGES[active]!;
  const progress = (active / (ORDER_STAGES.length - 1)) * 100;

  return (
    <div>
      <p aria-live="polite" className="sr-only">
        Order status: {stage.label}. {stage.detail}
      </p>

      <div className="relative">
        {/* Progress rail: vertical on phones, horizontal from sm */}
        <div aria-hidden="true" className="absolute top-6 bottom-6 left-6 w-1 rounded-full bg-cream-200 sm:top-6 sm:right-[12.5%] sm:bottom-auto sm:left-[12.5%] sm:h-1 sm:w-auto">
          <div
            className="w-full rounded-full bg-gradient-to-b from-ember-500 to-flame-400 transition-all duration-700 sm:h-full sm:bg-gradient-to-r max-sm:h-(--p) sm:w-(--p)"
            style={{ ["--p" as string]: `${progress}%` }}
          />
        </div>

        <ol className="relative grid gap-6 sm:grid-cols-4 sm:gap-2">
          {ORDER_STAGES.map((step, stepIndex) => {
            const Icon = icons[stepIndex]!;
            const done = stepIndex < active;
            const isActive = stepIndex === active;
            return (
              <li
                key={step.id}
                aria-current={isActive ? "step" : undefined}
                className="flex items-center gap-4 sm:flex-col sm:gap-3 sm:text-center"
              >
                <span
                  className={cn(
                    "relative flex size-12 shrink-0 items-center justify-center rounded-full transition-colors duration-500",
                    done && "bg-ember-500 text-charcoal-950",
                    isActive && "bg-charcoal-950 text-flame-400 ring-4 ring-flame-400/40",
                    !done && !isActive && "bg-cream-100 text-ink-600 ring-1 ring-cream-200",
                  )}
                >
                  {isActive && stepIndex < ORDER_STAGES.length - 1 && (
                    <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-flame-400/30 motion-reduce:hidden" />
                  )}
                  {done ? <Check aria-hidden="true" className="size-6" strokeWidth={3} /> : <Icon aria-hidden="true" className="size-6" />}
                </span>
                <span>
                  <span className={cn("block font-extrabold", done || isActive ? "text-ink-900" : "text-ink-600")}>{step.label}</span>
                  <span className={cn("block text-sm", isActive ? "text-ink-900" : "text-ink-600")}>
                    {done ? "Done" : isActive ? step.detail : "Up next"}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

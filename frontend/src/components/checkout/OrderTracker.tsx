"use client";

import { Bike, Check, ChefHat, House, ReceiptText } from "lucide-react";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/cn";
import { ORDER_STAGES, orderStageIndex } from "@/lib/orders";
import { useNow } from "@/hooks/useNow";

const icons = [ReceiptText, ChefHat, Bike, House];

/**
 * Confirmed → Preparing → On the way → Delivered. In this demo phase the stage
 * is derived from the time since the order was placed (a few seconds per step),
 * so it survives a refresh; the backend will supply real status later.
 */
export function OrderTracker({ order }: { order: Order }) {
  const now = useNow(1000);
  const current = now ? orderStageIndex(order, now) : 0;
  const stage = ORDER_STAGES[current]!;
  const progress = (current / (ORDER_STAGES.length - 1)) * 100;

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
          {ORDER_STAGES.map((step, index) => {
            const Icon = icons[index]!;
            const done = index < current;
            const active = index === current;
            return (
              <li
                key={step.id}
                aria-current={active ? "step" : undefined}
                className="flex items-center gap-4 sm:flex-col sm:gap-3 sm:text-center"
              >
                <span
                  className={cn(
                    "relative flex size-12 shrink-0 items-center justify-center rounded-full transition-colors duration-500",
                    done && "bg-ember-500 text-charcoal-950",
                    active && "bg-charcoal-950 text-flame-400 ring-4 ring-flame-400/40",
                    !done && !active && "bg-cream-100 text-ink-600 ring-1 ring-cream-200",
                  )}
                >
                  {active && index < ORDER_STAGES.length - 1 && (
                    <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-flame-400/30 motion-reduce:hidden" />
                  )}
                  {done ? <Check aria-hidden="true" className="size-6" strokeWidth={3} /> : <Icon aria-hidden="true" className="size-6" />}
                </span>
                <span>
                  <span className={cn("block font-extrabold", done || active ? "text-ink-900" : "text-ink-600")}>{step.label}</span>
                  <span className={cn("block text-sm", active ? "text-ink-900" : "text-ink-600")}>{done ? "Done" : active ? step.detail : "Up next"}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

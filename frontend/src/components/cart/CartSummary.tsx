import Link from "next/link";
import { ArrowRight, Bike, Clock3, Info, PartyPopper } from "lucide-react";
import type { CartTotals } from "@/lib/types";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/pricing";
import { formatRs } from "@/lib/format";
import { buttonClasses } from "@/components/ui/Button";

interface CartSummaryProps {
  totals: CartTotals;
  promoEnded: boolean;
  closedNow: boolean;
  onCheckout?: () => void;
}

/** Free-delivery progress, price breakdown, notices and the Checkout button. */
export function CartSummary({ totals, promoEnded, closedNow, onCheckout }: CartSummaryProps) {
  const progress = Math.min(100, Math.round(((FREE_DELIVERY_THRESHOLD - totals.freeDeliveryRemaining) / FREE_DELIVERY_THRESHOLD) * 100));
  const unlocked = totals.freeDeliveryRemaining === 0;

  return (
    <div className="space-y-4">
      {/* Free delivery progress */}
      <div className="rounded-2xl bg-white p-4 ring-1 ring-cream-200">
        <p className="flex items-center gap-2 text-sm font-bold text-ink-900">
          {unlocked ? (
            <>
              <PartyPopper aria-hidden="true" className="size-4 text-ember-700" />
              You&apos;ve unlocked free delivery!
            </>
          ) : (
            <>
              <Bike aria-hidden="true" className="size-4 text-ember-700" />
              Add {formatRs(totals.freeDeliveryRemaining)} more for free delivery
            </>
          )}
        </p>
        <div
          role="progressbar"
          aria-label="Progress towards free delivery"
          aria-valuemin={0}
          aria-valuemax={FREE_DELIVERY_THRESHOLD}
          aria-valuenow={FREE_DELIVERY_THRESHOLD - totals.freeDeliveryRemaining}
          aria-valuetext={unlocked ? "Free delivery unlocked" : `${formatRs(totals.freeDeliveryRemaining)} to go`}
          className="mt-3 h-2.5 overflow-hidden rounded-full bg-cream-100"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-ember-500 to-flame-400 transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {promoEnded && (
        <p className="flex gap-2 rounded-xl bg-cream-100 p-3 text-sm text-ink-900">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ember-700" />
          Wings Wednesday has ended, so wings are back to their regular price.
        </p>
      )}
      {closedNow && (
        <p className="flex gap-2 rounded-xl bg-cream-100 p-3 text-sm text-ink-900">
          <Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ember-700" />
          We&apos;re closed right now — orders open at 12 noon.
        </p>
      )}

      {/* Breakdown */}
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between text-ink-600">
          <dt>Subtotal</dt>
          <dd className="font-semibold text-ink-900 tabular-nums">{formatRs(totals.subtotal)}</dd>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-ember-700">
            <dt className="font-semibold">Wings Wednesday</dt>
            <dd className="font-bold tabular-nums">−{formatRs(totals.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between text-ink-600">
          <dt>Delivery</dt>
          <dd className="font-semibold text-ink-900 tabular-nums">
            {totals.delivery === 0 ? <span className="text-ember-700">Free</span> : formatRs(totals.delivery)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-cream-200 pt-3">
          <dt className="text-base font-extrabold text-ink-900">Total</dt>
          <dd className="text-2xl font-black text-ink-900 tabular-nums">{formatRs(totals.total)}</dd>
        </div>
      </dl>

      <Link href="/checkout" onClick={onCheckout} className={buttonClasses("primary", "lg", "w-full")}>
        <span>Checkout</span>
        <span className="flex items-center gap-2 tabular-nums">
          {formatRs(totals.total)}
          <ArrowRight aria-hidden="true" className="size-5" />
        </span>
      </Link>
    </div>
  );
}

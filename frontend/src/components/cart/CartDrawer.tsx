"use client";

import Link from "next/link";
import { useCallback, useId } from "react";
import { ArrowRight, CloudAlert, X } from "lucide-react";
import { useCartView } from "@/hooks/useCartView";
import { useCatalog } from "@/hooks/useCatalog";
import { useModalDialog } from "@/hooks/useModalDialog";
import { useUi } from "@/stores/ui";
import { EmptyState } from "@/components/ui/EmptyState";
import { CartEmpty } from "@/components/cart/CartEmpty";
import { CartLine } from "@/components/cart/CartLine";
import { CartSummary } from "@/components/cart/CartSummary";

/** Slide-in cart from the navbar bag icon (full width on phones). */
export function CartDrawer() {
  const { items, error, retry } = useCatalog();
  const open = useUi((state) => state.cartOpen);
  const closeCart = useUi((state) => state.closeCart);
  const onClosed = useCallback(() => closeCart(), [closeCart]);
  const { ref, close, onBackdropClick } = useModalDialog(open, onClosed);
  const { ready, lines, totals, count, promoEnded, closedNow } = useCartView(items);
  const titleId = useId();

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClick={onBackdropClick}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-none overflow-clip bg-cream-50 p-0 backdrop:bg-charcoal-950/70 backdrop:backdrop-blur-sm open:animate-slide-in-right sm:w-[26rem]"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
          <h2 id={titleId} className="font-display text-3xl font-black text-ink-900">
            Your order
            {count > 0 && <span className="ml-2 text-base font-bold text-ink-600">({count})</span>}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close cart"
            className="flex size-11 items-center justify-center rounded-full text-ink-900 hover:bg-cream-100"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>

        {error ? (
          <div className="flex flex-1 items-center px-5">
            <EmptyState
              icon={<CloudAlert aria-hidden="true" className="size-9" />}
              title="We're having trouble loading the menu"
              text="Please check your connection and try again."
              action={
                <button
                  type="button"
                  onClick={retry}
                  className="min-h-11 rounded-full bg-charcoal-950 px-6 font-bold text-cream-50 transition hover:bg-charcoal-800"
                >
                  Retry
                </button>
              }
            />
          </div>
        ) : ready && lines.length === 0 ? (
          <div className="flex flex-1 items-center px-5">
            <CartEmpty onBrowse={close} />
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-cream-200 overflow-y-auto overscroll-contain px-5">
              {lines.map((entry) => (
                <CartLine key={entry.line.key} entry={entry} onNavigate={close} />
              ))}
            </ul>
            <div className="border-t border-cream-200 bg-cream-100/60 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <CartSummary totals={totals} promoEnded={promoEnded} closedNow={closedNow} onCheckout={close} />
              <Link
                href="/cart"
                onClick={close}
                className="mt-3 flex min-h-11 items-center justify-center gap-1.5 text-sm font-bold text-ink-900 underline-offset-4 hover:text-ember-700 hover:underline"
              >
                View full cart <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}

"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { MenuItemView } from "@/lib/types";
import { useCartView } from "@/hooks/useCartView";
import { CartEmpty } from "@/components/cart/CartEmpty";
import { CartLine } from "@/components/cart/CartLine";
import { CartSummary } from "@/components/cart/CartSummary";

/** Full /cart page: lines on the left, sticky summary on the right (stacked on phones). */
export function CartView({ items }: { items: MenuItemView[] }) {
  const { ready, lines, totals, count, promoEnded, closedNow } = useCartView(items);

  if (!ready) {
    return <div className="h-96 animate-pulse rounded-card bg-cream-100" aria-label="Loading your cart" />;
  }

  if (lines.length === 0) return <CartEmpty />;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_24rem]">
      <section aria-labelledby="cart-items-title" className="rounded-card bg-white px-4 shadow-card ring-1 ring-cream-200 sm:px-6">
        <h2 id="cart-items-title" className="sr-only">
          Items in your cart ({count})
        </h2>
        <ul className="divide-y divide-cream-200">
          {lines.map((entry) => (
            <CartLine key={entry.line.key} entry={entry} size="roomy" />
          ))}
        </ul>
      </section>

      <aside aria-label="Order summary" className="rounded-card bg-cream-100/70 p-5 ring-1 ring-cream-200 lg:sticky lg:top-28">
        <h2 className="font-display mb-4 text-3xl font-black text-ink-900">Order summary</h2>
        <CartSummary totals={totals} promoEnded={promoEnded} closedNow={closedNow} />
        <Link
          href="/menu"
          className="mt-3 flex min-h-11 items-center justify-center gap-1.5 text-sm font-bold text-ink-900 underline-offset-4 hover:text-ember-700 hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" /> Continue shopping
        </Link>
      </aside>
    </div>
  );
}

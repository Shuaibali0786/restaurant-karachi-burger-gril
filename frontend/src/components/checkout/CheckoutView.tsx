"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import type { DeliveryAreaOption, MenuItemView, Order } from "@/lib/types";
import { formatRs } from "@/lib/format";
import { optionSummary } from "@/lib/menu";
import { useCartView } from "@/hooks/useCartView";
import { useCart } from "@/stores/cart";
import { buttonClasses } from "@/components/ui/Button";
import { CartEmpty } from "@/components/cart/CartEmpty";
import { CHECKOUT_FORM_ID, CheckoutForm } from "@/components/checkout/CheckoutForm";
import { OrderSummary } from "@/components/checkout/OrderSummary";

interface CheckoutViewProps {
  items: MenuItemView[];
  areas: DeliveryAreaOption[];
}

export function CheckoutView({ items, areas }: CheckoutViewProps) {
  const router = useRouter();
  const rawLines = useCart((state) => state.lines);
  const clearCart = useCart((state) => state.clear);
  const { ready, lines, totals, promoEnded } = useCartView(items);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);

  const onPlaced = (order: Order) => {
    setPlaced(true);
    clearCart();
    router.push(`/order/${order.id}`);
  };

  if (placed) {
    return (
      <p role="status" className="flex items-center justify-center gap-3 py-24 text-lg font-bold text-ink-900">
        <Loader2 aria-hidden="true" className="size-6 animate-spin text-ember-700" /> Order placed! Opening your order tracker…
      </p>
    );
  }
  if (!ready) return <div className="h-96 animate-pulse rounded-card bg-cream-100" aria-label="Loading checkout" />;
  if (lines.length === 0) return <CartEmpty />;

  const summaryLines = lines.map(({ line, item, option, addons, lineTotal }) => ({
    key: line.key,
    name: item.name,
    optionLabel: optionSummary(option),
    addonLabels: addons.map((a) => a.label),
    note: line.note,
    quantity: line.quantity,
    lineTotal,
  }));

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_24rem]">
      <CheckoutForm areas={areas} lines={rawLines} onPlaced={onPlaced} onSubmittingChange={setSubmitting} />

      <aside aria-label="Order summary" className="rounded-card bg-cream-100/70 p-5 ring-1 ring-cream-200 lg:sticky lg:top-28">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-3xl font-black text-ink-900">Your order</h2>
          <Link href="/cart" className="text-sm font-bold text-ember-700 underline-offset-4 hover:underline">
            Edit
          </Link>
        </div>
        {promoEnded && <p className="mt-2 text-sm text-ink-600">Wings Wednesday has ended — wings are at regular price.</p>}
        <div className="mt-2">
          <OrderSummary lines={summaryLines} totals={totals} />
        </div>

        <button
          type="submit"
          form={CHECKOUT_FORM_ID}
          disabled={submitting}
          className={buttonClasses("primary", "lg", "mt-5 w-full disabled:cursor-wait disabled:opacity-80")}
        >
          {submitting ? (
            <>
              <Loader2 aria-hidden="true" className="size-5 animate-spin" /> Placing order…
            </>
          ) : (
            <>Place order · {formatRs(totals.total)}</>
          )}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-600">
          <Lock aria-hidden="true" className="size-3.5" /> Cash on Delivery · pay when your food arrives
        </p>
        <Link
          href="/menu"
          className="mt-2 flex min-h-11 items-center justify-center gap-1.5 text-sm font-bold text-ink-900 underline-offset-4 hover:text-ember-700 hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" /> Add more items
        </Link>
      </aside>
    </div>
  );
}

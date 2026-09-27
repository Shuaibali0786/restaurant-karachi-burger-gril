"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, Copy, House, Info, MapPin, Phone, SearchX, UtensilsCrossed, Wallet } from "lucide-react";
import type { Order } from "@/lib/types";
import { getOrder } from "@/lib/api";
import { formatPhone, formatRs } from "@/lib/format";
import { estimatedArrival } from "@/lib/orders";
import { formatPktTime } from "@/lib/time";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { OrderTracker } from "@/components/checkout/OrderTracker";

type LoadState = { status: "loading" } | { status: "missing" } | { status: "ready"; order: Order };

function CopyOrderId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the number is still visible to copy by hand.
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Order number copied" : `Copy order number ${id}`}
      className="flex size-11 items-center justify-center rounded-full text-sand-300 transition hover:bg-charcoal-800 hover:text-flame-400"
    >
      {copied ? <Check aria-hidden="true" className="size-5 text-flame-400" /> : <Copy aria-hidden="true" className="size-5" />}
    </button>
  );
}

export function OrderConfirmation({ id }: { id: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void getOrder(id).then((order) => {
      if (active) setState(order ? { status: "ready", order } : { status: "missing" });
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (state.status === "loading") {
    return <div className="container-page py-16"><div className="h-96 animate-pulse rounded-card bg-cream-100" aria-label="Loading your order" /></div>;
  }

  if (state.status === "missing") {
    return (
      <div className="container-page py-10">
        <EmptyState
          icon={<SearchX aria-hidden="true" className="size-9" />}
          title="Order not found"
          text={`We couldn't find order ${id}. Please check the order number and try again.`}
          action={<ButtonLink href="/menu" size="lg">Browse menu</ButtonLink>}
        />
      </div>
    );
  }

  const { order } = state;
  const arrival = estimatedArrival(order);
  const scheduled = order.timing.type === "scheduled";
  const firstName = order.customer.name.split(" ")[0];
  // A masked phone (public viewer) is already meant for display; formatPhone would mangle it.
  const contactPhone = order.viewer === "public" ? order.customer.phone : formatPhone(order.customer.phone);

  const details = [
    order.delivery.address
      ? {
          Icon: MapPin,
          label: "Deliver to",
          value: [order.delivery.address, order.delivery.areaName].join(", "),
          extra: order.delivery.landmark && `Landmark: ${order.delivery.landmark}`,
        }
      : { Icon: MapPin, label: "Delivery area", value: order.delivery.areaName },
    { Icon: Phone, label: "Contact", value: `${order.customer.name} · ${contactPhone}` },
    { Icon: Wallet, label: "Payment", value: "Cash on Delivery", extra: `Please keep ${formatRs(order.totals.total)} ready for the rider` },
    ...(order.delivery.notes ? [{ Icon: Info, label: "Delivery notes", value: order.delivery.notes }] : []),
  ];

  return (
    <>
      <section className="relative isolate overflow-hidden bg-charcoal-950 text-cream-50">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(55%_90%_at_80%_10%,rgb(255_90_31/0.3),transparent_70%)]" />
        <div className="container-page py-12 sm:py-16">
          <span className="flex size-16 animate-badge-pop items-center justify-center rounded-full bg-ember-500 text-charcoal-950 shadow-glow">
            <Check aria-hidden="true" className="size-9" strokeWidth={3} />
          </span>
          <h1 className="font-display mt-5 text-5xl leading-none font-black sm:text-6xl">
            Shukriya, {firstName}! <span className="block text-flame-400">Your order is confirmed</span>
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-sand-300 uppercase">Order number</p>
              <p className="flex items-center gap-1 text-2xl font-black tabular-nums">
                {order.id}
                <CopyOrderId id={order.id} />
              </p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-sand-300 uppercase">{scheduled ? "Scheduled for" : "Estimated arrival"}</p>
              <p className="flex items-center gap-2 text-2xl font-black">
                <Clock3 aria-hidden="true" className="size-6 text-flame-400" />
                {scheduled ? formatPktTime(arrival) : `by ${formatPktTime(arrival)}`}
                {!scheduled && <span className="text-base font-semibold text-sand-300">(25–30 min)</span>}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-cream-50">
        <div className="container-page space-y-6 py-10">
          <section aria-labelledby="tracker-title" className="rounded-card bg-white p-5 shadow-card ring-1 ring-cream-200 sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
              <h2 id="tracker-title" className="font-display text-3xl font-black text-ink-900">Track your order</h2>
            </div>
            <OrderTracker id={order.id} initialOrder={order} />
          </section>

          <div className="grid items-start gap-6 lg:grid-cols-2">
            <section aria-labelledby="details-title" className="rounded-card bg-white p-5 shadow-card ring-1 ring-cream-200 sm:p-6">
              <h2 id="details-title" className="font-display mb-4 text-2xl font-black text-ink-900">Delivery details</h2>
              <dl className="space-y-4">
                {details.map(({ Icon, label, value, extra }) => (
                  <div key={label} className="flex gap-3">
                    <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ember-700" />
                    <div>
                      <dt className="text-sm font-semibold text-ink-600">{label}</dt>
                      <dd className="font-bold text-ink-900">{value}</dd>
                      {extra && <dd className="text-sm text-ink-600">{extra}</dd>}
                    </div>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="items-title" className="rounded-card bg-white p-5 shadow-card ring-1 ring-cream-200 sm:p-6">
              <h2 id="items-title" className="font-display mb-2 text-2xl font-black text-ink-900">Your items</h2>
              <OrderSummary
                lines={order.lines.map((line, index) => ({ key: `${line.itemSlug}-${index}`, ...line }))}
                totals={order.totals}
              />
            </section>
          </div>

          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/menu" size="lg" icon={<UtensilsCrossed aria-hidden="true" className="size-5" />}>
              Order again
            </ButtonLink>
            <ButtonLink href="/" size="lg" variant="secondary" icon={<House aria-hidden="true" className="size-5" />} className="text-ink-900">
              Back to home
            </ButtonLink>
          </div>
        </div>
      </div>
    </>
  );
}

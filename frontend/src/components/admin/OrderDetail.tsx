import { MapPin, Phone, StickyNote, User } from "lucide-react";
import type { Order } from "@/lib/types";
import { formatPktTime } from "@/lib/time";
import { OrderSummary } from "@/components/checkout/OrderSummary";

const STATUS_LABEL: Record<Order["status"], string> = {
  confirmed: "Confirmed",
  preparing: "Preparing",
  "on-the-way": "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Full order detail for staff: customer contact, delivery address, items with
 * options/extras/notes, totals and the status history — nothing masked, unlike the public tracker. */
export function OrderDetail({ order }: { order: Order }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-card bg-white p-4 shadow-card ring-1 ring-cream-200">
          <h2 className="mb-3 text-sm font-bold tracking-wide text-ink-600 uppercase">Customer</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User aria-hidden="true" className="size-4 shrink-0 text-ember-700" />
              <dd className="font-bold text-ink-900">{order.customer.name}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Phone aria-hidden="true" className="size-4 shrink-0 text-ember-700" />
              <dd className="font-bold text-ink-900 tabular-nums">
                <a href={`tel:${order.customer.phone}`} className="underline-offset-2 hover:underline">
                  {order.customer.phone}
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-card bg-white p-4 shadow-card ring-1 ring-cream-200">
          <h2 className="mb-3 text-sm font-bold tracking-wide text-ink-600 uppercase">Delivery</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ember-700" />
              <dd className="font-bold text-ink-900">
                {order.delivery.address ?? "—"}
                {order.delivery.landmark && <span className="block font-semibold text-ink-600">Near {order.delivery.landmark}</span>}
                <span className="block font-semibold text-ink-600">{order.delivery.areaName}</span>
              </dd>
            </div>
            {order.delivery.notes && (
              <div className="flex items-start gap-2">
                <StickyNote aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ember-700" />
                <dd className="italic text-ink-600">“{order.delivery.notes}”</dd>
              </div>
            )}
            <div className="text-ink-600">
              {order.timing.type === "asap" ? "As soon as possible" : `Scheduled for ${formatPktTime(new Date(order.timing.slot))}`}
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-card bg-white p-4 shadow-card ring-1 ring-cream-200">
        <h2 className="mb-3 text-sm font-bold tracking-wide text-ink-600 uppercase">Items</h2>
        <OrderSummary
          lines={order.lines.map((line) => ({
            key: `${line.itemSlug}-${line.optionId}`,
            name: line.name,
            optionLabel: line.optionLabel,
            addonLabels: line.addonLabels,
            note: line.note,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
          }))}
          totals={order.totals}
        />
      </div>

      <div className="rounded-card bg-white p-4 shadow-card ring-1 ring-cream-200">
        <h2 className="mb-3 text-sm font-bold tracking-wide text-ink-600 uppercase">Status history</h2>
        <ol className="space-y-2 text-sm">
          {order.statusHistory.map((event, index) => (
            <li key={`${event.status}-${index}`} className="flex justify-between gap-3">
              <span className="font-bold text-ink-900">{STATUS_LABEL[event.status]}</span>
              <span className="text-ink-600 tabular-nums">{formatPktTime(new Date(event.at))}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

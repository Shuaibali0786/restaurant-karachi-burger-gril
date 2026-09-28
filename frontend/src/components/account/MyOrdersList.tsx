"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ReceiptText } from "lucide-react";
import type { Order } from "@/lib/types";
import { getMyOrders } from "@/lib/api";
import { formatRs } from "@/lib/format";
import { formatPktTime } from "@/lib/time";
import { useSession } from "@/stores/session";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrderAgainButton } from "@/components/account/OrderAgainButton";

const STATUS_LABEL: Record<Order["status"], string> = {
  confirmed: "Confirmed",
  preparing: "Preparing",
  "on-the-way": "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const dateFormat = new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" });

export function MyOrdersList() {
  const router = useRouter();
  const user = useSession((state) => state.user);
  const load = useSession((state) => state.load);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  useEffect(() => {
    if (user === null) router.replace("/login?from=/account/orders");
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    getMyOrders()
      .then((list) => active && setOrders(list))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [user]);

  if (failed) {
    return <p role="alert" className="font-semibold text-ember-700">We couldn&apos;t load your orders. Please refresh the page.</p>;
  }

  if (!user || !orders) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Loader2 aria-label="Loading your orders" className="size-6 animate-spin text-ember-700" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<ReceiptText aria-hidden="true" className="size-9" />}
        title="No orders yet"
        text="Orders you place while logged in will show up here."
        action={<ButtonLink href="/menu" size="lg">Browse menu</ButtonLink>}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li key={order.id} className="rounded-card bg-white p-4 shadow-card ring-1 ring-cream-200 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link href={`/order/${order.id}`} className="text-lg font-extrabold text-ink-900 tabular-nums underline-offset-4 hover:underline">
                {order.id}
              </Link>
              <p className="text-sm text-ink-600">
                {dateFormat.format(new Date(order.placedAt))} · {formatPktTime(new Date(order.placedAt))}
              </p>
            </div>
            <div className="text-right">
              <p className="font-extrabold text-ink-900 tabular-nums">{formatRs(order.totals.total)}</p>
              <p className="text-sm font-bold text-ember-700">{STATUS_LABEL[order.status]}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-ink-600">
            {order.lines.map((line) => `${line.quantity} × ${line.name}`).join(", ")}
          </p>
          <div className="mt-3">
            <OrderAgainButton orderId={order.id} />
          </div>
        </li>
      ))}
    </ul>
  );
}

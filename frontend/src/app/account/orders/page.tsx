import type { Metadata } from "next";
import { MyOrdersList } from "@/components/account/MyOrdersList";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };

export default function MyOrdersPage() {
  return (
    <div className="bg-cream-50">
      <div className="container-page py-10">
        <h1 className="font-display text-4xl font-black text-ink-900">My orders</h1>
        <p className="mt-1 text-ink-600">Your past orders. Tap “Order again” to fill your cart with the same items.</p>
        <div className="mt-8">
          <MyOrdersList />
        </div>
      </div>
    </div>
  );
}

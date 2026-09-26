import type { Metadata } from "next";
import { getDeliveryAreas, getMenuItems } from "@/lib/api";
import { CheckoutView } from "@/components/checkout/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Enter your delivery details and place your Cash on Delivery order.",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const [items, areas] = await Promise.all([getMenuItems(), getDeliveryAreas()]);

  return (
    <div className="bg-cream-50">
      <div className="container-page py-10 sm:py-14">
        <h1 className="font-display mb-2 text-5xl font-black text-ink-900 sm:text-6xl">Checkout</h1>
        <p className="mb-8 text-ink-600">Delivering across Karachi · Cash on Delivery</p>
        <CheckoutView items={items} areas={areas} />
      </div>
    </div>
  );
}

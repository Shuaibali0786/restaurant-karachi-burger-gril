import type { Metadata } from "next";
import { getMenuItems } from "@/lib/api";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your order from Karachi Burger & Grill.",
  robots: { index: false },
};

export default async function CartPage() {
  const items = await getMenuItems();

  return (
    <div className="bg-cream-50">
      <div className="container-page py-10 sm:py-14">
        <h1 className="font-display mb-8 text-5xl font-black text-ink-900 sm:text-6xl">Your cart</h1>
        <CartView items={items} />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { TrackOrder } from "@/components/checkout/TrackOrder";

export const metadata: Metadata = {
  title: "Track order",
  description: "Find your Karachi Burger & Grill order and follow it to your door.",
  robots: { index: false },
};

export default function TrackPage() {
  return (
    <>
      <PageHero eyebrow="Where's my food?" title="Track your order" intro="Enter your order number, or pick one of the orders placed on this device." />
      <div className="bg-cream-50">
        <div className="container-page py-10 sm:py-14">
          <TrackOrder />
        </div>
      </div>
    </>
  );
}

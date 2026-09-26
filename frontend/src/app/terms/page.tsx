import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/content/LegalPage";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description: "Ordering, delivery, pricing and payment terms at Karachi Burger & Grill.",
};

const sections: LegalSection[] = [
  {
    heading: "Ordering",
    body: (
      <p>
        Orders are accepted daily from 12 noon to 3 AM (Pakistan time). You can order as soon as possible or schedule a
        delivery for later the same day. Once your order is placed, please{" "}
        <Link href="/contact" className="font-bold text-ember-700 underline underline-offset-4">
          call us
        </Link>{" "}
        quickly if you need to change it — once it&apos;s on the grill we may not be able to.
      </p>
    ),
  },
  {
    heading: "Prices and deals",
    body: (
      <ul>
        <li>All prices are in Pakistani rupees (Rs).</li>
        <li>Delivery is Rs 150, or free when your order (after any deals) is Rs 1,500 or more.</li>
        <li>Wings Wednesday gives 20% off Fire Wings on Wednesdays, Pakistan time, and is applied automatically.</li>
        <li>Deals can&apos;t be exchanged for cash and may change without notice.</li>
      </ul>
    ),
  },
  {
    heading: "Delivery",
    body: (
      <p>
        We deliver to Saddar, Clifton, DHA, PECHS, Gulshan and North Nazimabad. Delivery times are estimates — usually 25–30
        minutes — and can be longer in heavy traffic, rain or at busy times. Please keep your phone nearby so the rider can
        reach you.
      </p>
    ),
  },
  {
    heading: "Payment",
    body: <p>We currently accept Cash on Delivery only. Please have the order total ready for the rider.</p>,
  },
  {
    heading: "Allergies and food safety",
    body: (
      <p>
        All our food is halal. Our kitchen handles common allergens such as wheat, sesame, dairy and eggs, so we can&apos;t guarantee
        any item is free from allergens. If you have an allergy, add it to your special instructions and call us before ordering.
      </p>
    ),
  },
  {
    heading: "Problems with an order",
    body: <p>If something is missing or not right, contact us within 24 hours with your order number and we&apos;ll make it right.</p>,
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & conditions"
      intro="The simple rules for ordering from Karachi Burger & Grill."
      updated="26 September 2026"
      sections={sections}
    />
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/content/LegalPage";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Karachi Burger & Grill handles your details when you order.",
};

const sections: LegalSection[] = [
  {
    heading: "What we collect",
    body: (
      <>
        <p>When you place an order we ask for what we need to deliver it:</p>
        <ul>
          <li>your name and mobile number, so the rider can reach you;</li>
          <li>your delivery area, address, nearest landmark and any delivery notes;</li>
          <li>the items you order and any special instructions.</li>
        </ul>
      </>
    ),
  },
  {
    heading: "Where it's kept today",
    body: (
      <p>
        Your cart, favourites and recent orders are saved <strong>in your own browser</strong> on this device. Clearing
        your browser data removes them. We don&apos;t take card payments on this site, so we never see card details.
      </p>
    ),
  },
  {
    heading: "How we use it",
    body: (
      <ul>
        <li>To prepare and deliver your order and contact you about it.</li>
        <li>To reply when you message us through the contact form.</li>
        <li>To send offers only if you join our newsletter — you can unsubscribe at any time.</li>
      </ul>
    ),
  },
  {
    heading: "Sharing",
    body: <p>We don&apos;t sell your details. We share them only with the rider delivering your order, or when the law requires it.</p>,
  },
  {
    heading: "Your choices",
    body: (
      <p>
        You can ask us what we hold about you, or ask us to delete it, by{" "}
        <Link href="/contact" className="font-bold text-ember-700 underline underline-offset-4">
          contacting us
        </Link>
        . When accounts launch, this policy will be updated to explain how account data is stored.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="Short version: we use your details to get your food to you, and nothing else."
      updated="26 September 2026"
      sections={sections}
    />
  );
}

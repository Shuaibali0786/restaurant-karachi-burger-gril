import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Delivery areas, times, fees, payment, halal, scheduling and deals — answers to common questions.",
};

const faqs: { question: string; answer: ReactNode }[] = [
  {
    question: "Where do you deliver?",
    answer: "Saddar, Clifton, DHA, PECHS, Gulshan and North Nazimabad. Choose your area at checkout.",
  },
  {
    question: "How long does delivery take?",
    answer: "Usually 25–30 minutes. It can take a little longer at busy times, in heavy traffic or in the rain.",
  },
  {
    question: "How much is delivery?",
    answer: "Rs 150 — and free when your order is Rs 1,500 or more after any deals. Your cart shows how much more you need.",
  },
  {
    question: "What are your opening hours?",
    answer: "Every day from 12 noon to 3 AM, Pakistan time.",
  },
  {
    question: "Can I order for later?",
    answer: "Yes. At checkout choose “Schedule for later today” and pick a half-hour slot, up to 2:30 AM.",
  },
  {
    question: "How can I pay?",
    answer: "Cash on Delivery for now. Card, JazzCash and Easypaisa are coming soon.",
  },
  {
    question: "Is everything halal?",
    answer: "Yes — every ingredient we use is halal.",
  },
  {
    question: "How does Wings Wednesday work?",
    answer: "Every Wednesday (Pakistan time) you get 20% off Fire Wings. The discount is applied automatically in your cart.",
  },
  {
    question: "I have a food allergy. Can you help?",
    answer: (
      <>
        Our kitchen handles common allergens, so we can&apos;t guarantee any item is allergen-free. Add a note to your order and{" "}
        <Link href="/contact" className="font-bold text-ember-700 underline underline-offset-4">
          call us
        </Link>{" "}
        before ordering.
      </>
    ),
  },
  {
    question: "How do I track my order?",
    answer: (
      <>
        After ordering you&apos;ll see a tracker on your confirmation page. You can find it again any time from{" "}
        <Link href="/track" className="font-bold text-ember-700 underline underline-offset-4">
          Track Order
        </Link>
        .
      </>
    ),
  },
  {
    question: "Do I need an account?",
    answer: "No — you can order as a guest. Accounts with saved addresses and one-tap reorders are coming soon.",
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHero eyebrow="Got questions?" title="FAQ" intro="Everything people usually ask us about ordering, delivery and paying." />
      <div className="bg-cream-50">
        <div className="container-page max-w-3xl py-12 sm:py-16">
          <div className="space-y-3">
            {faqs.map(({ question, answer }) => (
              <details key={question} className="group rounded-2xl bg-white shadow-card ring-1 ring-cream-200 open:ring-ember-500/40">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-lg font-extrabold text-ink-900 [&::-webkit-details-marker]:hidden">
                  {question}
                  <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-ember-700 transition group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-5 leading-relaxed text-ink-600">{answer}</div>
              </details>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-start gap-4 rounded-card bg-charcoal-950 p-7 text-cream-50 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-lg font-bold">Still hungry for answers?</p>
            <ButtonLink href="/contact" icon={<MessageCircle aria-hidden="true" className="size-5" />}>
              Contact us
            </ButtonLink>
          </div>
        </div>
      </div>
    </>
  );
}

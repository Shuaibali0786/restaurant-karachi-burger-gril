import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";
import { getSiteInfo } from "@/lib/api";
import { PageHero } from "@/components/ui/PageHero";
import { LocationCard } from "@/components/content/LocationCard";
import { OpeningHours } from "@/components/content/OpeningHours";
import { ContactForm } from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Email or message Karachi Burger & Grill on Burns Road, Saddar, Karachi. Open daily 12 noon – 3 AM.",
};

export default async function ContactPage() {
  const site = await getSiteInfo();
  const channels = [
    { Icon: Mail, label: "Email", value: site.email, href: `mailto:${site.email}`, note: "Catering, events and feedback" },
    { Icon: MessageCircle, label: "Message form", value: "Reply within a day", href: "#message", note: "Use the form on this page" },
  ];

  return (
    <>
      <PageHero eyebrow="We'd love to hear from you" title="Get in touch" intro="Questions about an order, catering for an event, or just want to say shukriya? Here's how to reach us." />

      <div className="bg-cream-50">
        <div className="container-page space-y-8 py-10 sm:py-14">
          <ul className="grid gap-4 sm:grid-cols-2">
            {channels.map(({ Icon, label, value, href, note }) => (
              <li key={label}>
                <a href={href} className="group flex h-full gap-4 rounded-card bg-white p-5 shadow-card ring-1 ring-cream-200 transition hover:ring-ember-500">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ember-500/10 text-ember-700">
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink-600">{label}</span>
                    <span className="block font-extrabold break-all text-ink-900 group-hover:text-ember-700">{value}</span>
                    <span className="block text-sm text-ink-600">{note}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div id="message" className="scroll-mt-32">
              <ContactForm />
            </div>
            <div className="space-y-6">
              <LocationCard address={site.address} />
              <OpeningHours />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

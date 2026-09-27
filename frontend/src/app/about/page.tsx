import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Clock3, Flame, HeartHandshake, Leaf, ShieldCheck } from "lucide-react";
import { getSiteInfo } from "@/lib/api";
import { ButtonLink } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { OpeningHours } from "@/components/content/OpeningHours";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Karachi Burger & Grill brings the charcoal, spice and late-night energy of Burns Road to burgers, fried chicken and BBQ — halal and made fresh.",
};

const values = [
  { Icon: Flame, title: "Real charcoal", text: "Tikka, kebabs and patties cooked over coals, the Burns Road way." },
  { Icon: ShieldCheck, title: "100% halal", text: "Every ingredient, every order. No exceptions." },
  { Icon: Leaf, title: "Made fresh", text: "Nothing sits under a heat lamp — we cook when you order." },
  { Icon: HeartHandshake, title: "Karachi hospitality", text: "Generous portions and a team that treats you like family." },
];

export default async function AboutPage() {
  const site = await getSiteInfo();

  return (
    <>
      <PageHero
        eyebrow="Karachi ka asli zaiqa"
        title="Our Story"
        intro="From the smoke and late nights of Burns Road to your door — this is where Karachi Burger & Grill comes from."
        image={{ src: "/images/about-street.jpg" }}
      />

      <div className="bg-cream-50">
        {/* Origins */}
        <section aria-labelledby="origins-title" className="reveal-on-scroll container-page grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-2">
          <div>
            <p className="text-sm font-extrabold tracking-[0.2em] text-ember-700 uppercase">From Burns Road with fire</p>
            <h2 id="origins-title" className="font-display mt-2 text-5xl leading-none font-black text-ink-900">
              Born on Karachi&apos;s food street
            </h2>
            <div className="mt-5 space-y-4 text-lg leading-relaxed text-ink-600">
              <p>
                Burns Road never really sleeps. The coals are glowing long after midnight, the air smells of tikka and
                masala, and every stall has a regular who swears theirs is the best in the city.
              </p>
              <p>
                We wanted that same energy in a burger. So we took the charcoal grill, the Karachi spice cupboard and the
                late-night hours, and built a menu around them: crunchy zingers, smashed beef, fried chicken and proper BBQ.
              </p>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-card shadow-card">
            <Image src="/images/about-restaurant.jpg" alt="The colourful dining room at Karachi Burger & Grill" fill sizes="(min-width: 1024px) 45vw, 95vw" className="object-cover" />
          </div>
        </section>

        {/* Kitchen */}
        <section aria-labelledby="kitchen-title" className="bg-charcoal-900 py-16 text-cream-50 sm:py-20">
          <div className="container-page grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative row-span-2 overflow-hidden rounded-card">
                <Image src="/images/about-chef.jpg" alt="Our chef plating food while the kitchen team watches" fill sizes="(min-width: 1024px) 22vw, 45vw" className="object-cover" />
              </div>
              <div className="relative aspect-square overflow-hidden rounded-card">
                <Image src="/images/grill-platter.jpg" alt="A sizzling grill platter fresh off the coals" fill sizes="(min-width: 1024px) 22vw, 45vw" className="object-cover object-[center_62%]" />
              </div>
              <div className="relative aspect-square overflow-hidden rounded-card">
                <Image src="/images/about-customers.jpg" alt="Friends sharing a burger" fill sizes="(min-width: 1024px) 22vw, 45vw" className="object-cover" />
              </div>
            </div>
            <div>
              <SectionHeading id="kitchen-title" eyebrow="Inside our kitchen" title="The grill is our kitchen" tone="dark" className="mb-5" />
              <p className="text-lg leading-relaxed text-sand-300">
                Our marinades rest overnight. The fried chicken is hand-breaded in small batches so it stays shatter-crisp.
                Patties are smashed on a screaming-hot griddle, and the tikka goes onto real coals — which is why the whole
                street can smell it.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-sand-300">
                It&apos;s more work than a microwave and a freezer. It&apos;s also the only way we know how to cook.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section aria-labelledby="values-title" className="reveal-on-scroll container-page py-16 sm:py-20">
          <SectionHeading id="values-title" eyebrow="What we stand for" title="Halal. Fresh. Every day." align="center" />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ Icon, title, text }) => (
              <li key={title} className="rounded-card bg-white p-6 shadow-card ring-1 ring-cream-200">
                <span className="flex size-12 items-center justify-center rounded-full bg-ember-500/10 text-ember-700 ring-1 ring-ember-500/25">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <h3 className="mt-4 text-lg font-extrabold text-ink-900">{title}</h3>
                <p className="mt-1 text-ink-600">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Visit / hours */}
        <section aria-label="Visit us" className="reveal-on-scroll container-page grid items-start gap-6 pb-20 lg:grid-cols-2">
          <div className="rounded-card bg-charcoal-950 p-8 text-cream-50">
            <p className="font-script text-2xl text-flame-400">A table for everyone</p>
            <h2 className="font-display mt-1 text-4xl leading-none font-black">Late-night cravings welcome</h2>
            <p className="mt-4 flex items-center gap-2 text-sand-300">
              <Clock3 aria-hidden="true" className="size-5 text-flame-400" /> {site.hours} · {site.address}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/menu" size="lg" trailingIcon={<ArrowRight aria-hidden="true" className="size-5" />}>
                Order now
              </ButtonLink>
              <ButtonLink href="/contact" size="lg" variant="secondary" className="text-cream-50">
                Contact us
              </ButtonLink>
            </div>
          </div>
          <OpeningHours />
        </section>
      </div>
    </>
  );
}

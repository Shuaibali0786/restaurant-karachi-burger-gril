import Image from "next/image";
import { ArrowRight, Flame, Heart, ShieldCheck, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

const values = [
  { Icon: Heart, label: "Made with love" },
  { Icon: Sparkles, label: "Premium quality" },
  { Icon: Flame, label: "Charcoal-grilled" },
  { Icon: ShieldCheck, label: "Always halal" },
];

export function AboutTeaser() {
  return (
    <section aria-labelledby="about-teaser-title" className="overflow-hidden bg-cream-50 py-16 sm:py-24">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2">
        {/* Photo collage */}
        <div className="relative mx-auto grid w-full max-w-xl grid-cols-2 gap-4">
          <div className="relative row-span-2 overflow-hidden rounded-card shadow-card">
            <Image
              src="/images/about-chef.jpg"
              alt="Our chef preparing food at the counter"
              fill
              sizes="(min-width: 1024px) 22vw, 45vw"
              className="object-cover"
            />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-card shadow-card">
            <Image
              src="/images/about-street.jpg"
              alt="Flames rising from the charcoal grill"
              fill
              sizes="(min-width: 1024px) 22vw, 45vw"
              className="object-cover"
            />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-card shadow-card">
            <Image
              src="/images/about-restaurant.jpg"
              alt="The colourful dining room of Karachi Burger & Grill"
              fill
              sizes="(min-width: 1024px) 22vw, 45vw"
              className="object-cover"
            />
          </div>
          <p className="font-script absolute -bottom-6 left-1/2 -translate-x-1/2 -rotate-3 rounded-full bg-charcoal-950 px-5 py-2 text-2xl whitespace-nowrap text-flame-400 shadow-card">
            Pure happiness!
          </p>
        </div>

        {/* Story */}
        <div>
          <p className="text-sm font-extrabold tracking-[0.2em] text-ember-700 uppercase">Our story</p>
          <h2 id="about-teaser-title" className="font-display mt-2 text-5xl leading-none font-black text-ink-900 sm:text-6xl">
            Born on Burns Road
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-600">
            We grew up on Burns Road — the smoke, the late nights, the tikka sizzling over open coals. Karachi
            Burger &amp; Grill brings that same fire to burgers, fried chicken and BBQ: everything halal, made fresh
            when you order, and served hot till 3 AM.
          </p>
          <ul className="mt-6 grid max-w-md grid-cols-2 gap-3">
            {values.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-2 font-bold text-ink-900">
                <span className="flex size-9 items-center justify-center rounded-full bg-ember-500/10 text-ember-700">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                {label}
              </li>
            ))}
          </ul>
          <ButtonLink
            href="/about"
            variant="dark"
            size="lg"
            className="mt-8"
            trailingIcon={<ArrowRight aria-hidden="true" className="size-5" />}
          >
            Our Story
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import { ArrowRight, Bike, ChefHat, Clock3, Heart, MapPin, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { EmberParticles } from "@/components/home/EmberParticles";

const trust = [
  { Icon: ShieldCheck, label: "100% Halal" },
  { Icon: Clock3, label: "Open till 3 AM" },
  { Icon: Bike, label: "Free delivery over Rs 1,500" },
];

/** Hand-drawn curved arrow for the "Freshly made" doodle. */
function DoodleArrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 60" fill="none" aria-hidden="true" className={className}>
      <path
        d="M74 6c-10 2-26 8-36 20-7 8-10 17-12 26"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1 7"
      />
      <path d="M17 42l9 12 9-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const floatBase = "absolute z-20 animate-float-y rounded-2xl shadow-[0_18px_40px_-12px_rgb(0_0_0/0.6)] backdrop-blur";
const floatCard = `${floatBase} bg-white/95 text-ink-900`;

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="under-nav relative isolate overflow-hidden bg-charcoal-950 text-cream-50"
    >
      {/* Warm fire glow and a faint flame bed along the bottom */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(55%_65%_at_78%_55%,rgb(255_90_31/0.30),transparent_70%),radial-gradient(40%_50%_at_10%_10%,rgb(255_176_32/0.08),transparent_70%)]"
      />
      {/* Ember bed along the bottom: pure CSS, so no decorative image competes with the food photo for LCP. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-[radial-gradient(40%_70%_at_20%_100%,rgb(255_90_31/0.22),transparent_70%),radial-gradient(35%_60%_at_75%_100%,rgb(255_176_32/0.16),transparent_70%),radial-gradient(60%_80%_at_50%_110%,rgb(232_72_15/0.25),transparent_75%)]"
      />

      <div className="container-page grid items-center gap-10 pt-8 pb-24 sm:pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pt-10 lg:pb-32">
        {/* Copy */}
        <div className="max-w-2xl">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-charcoal-600 bg-charcoal-900/70 px-3 py-1.5 text-xs font-bold tracking-wide text-sand-300 uppercase">
              <MapPin aria-hidden="true" className="size-3.5 text-ember-500" />
              Burns Road · Karachi
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 id="hero-title" className="mt-5">
              <span className="font-display block text-xl font-bold tracking-[0.2em] text-flame-400 sm:text-2xl">
                It&apos;s not just food —
              </span>
              <span className="font-display mt-1 block text-[3.6rem] leading-[0.88] font-black sm:text-7xl xl:text-[5.75rem]">
                It&apos;s Karachi&apos;s
              </span>
              <span className="font-script -mt-1 block -rotate-2 bg-gradient-to-r from-ember-500 via-ember-400 to-flame-400 bg-clip-text pr-4 text-[4.5rem] leading-[1.05] text-transparent drop-shadow-[0_4px_24px_rgb(255_90_31/0.35)] sm:text-8xl xl:text-[7.5rem]">
                fire!
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-sand-300 sm:text-xl">
              Fresh ingredients. Bold flavours. Unforgettable taste.
            </p>
          </Reveal>

          <Reveal delay={0.24} className="mt-8 flex flex-wrap gap-3">
            <ButtonLink
              href="/menu"
              size="lg"
              icon={<Bike aria-hidden="true" className="size-5" />}
              trailingIcon={<ArrowRight aria-hidden="true" className="size-5" />}
            >
              Order Online
            </ButtonLink>
            <ButtonLink
              href="/menu"
              size="lg"
              variant="secondary"
              icon={<UtensilsCrossed aria-hidden="true" className="size-5" />}
              className="text-cream-50"
            >
              View Menu
            </ButtonLink>
          </Reveal>

          <Reveal delay={0.32}>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-sand-300">
              {trust.map(({ Icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon aria-hidden="true" className="size-4 text-flame-400" />
                  {label}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Food visual */}
        <div className="relative mx-auto aspect-[6/5] w-full max-w-xl lg:max-w-none">
          <div aria-hidden="true" className="absolute inset-[14%] rounded-full bg-ember-500/35 blur-3xl" />
          <div aria-hidden="true" className="absolute inset-x-[10%] bottom-[12%] h-[18%] rounded-[50%] bg-flame-400/25 blur-2xl" />

          <Image
            src="/images/grand-combo.jpg"
            alt="Grand Combo: a juicy cheeseburger, golden fries and a chilled drink"
            fill
            preload
            sizes="(min-width: 1024px) 48vw, (min-width: 640px) 36rem, 100vw"
            className="object-cover [mask-image:radial-gradient(ellipse_60%_58%_at_50%_55%,black_42%,transparent_98%)]"
          />
          <EmberParticles className="z-10" />

          {/* Floating badges */}
          <div className={`${floatCard} top-[6%] left-0 flex items-center gap-3 p-2.5 pr-4 sm:left-[2%]`}>
            <span className="flex size-10 items-center justify-center rounded-xl bg-ember-500 text-charcoal-950">
              <Bike aria-hidden="true" className="size-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-extrabold">25–30 min</span>
              <span className="block text-xs font-semibold text-ink-600">Delivery</span>
            </span>
          </div>

          <div
            className={`${floatCard} top-[42%] left-0 flex items-center gap-2 px-3 py-2 [animation-delay:1.2s] sm:top-auto sm:bottom-[20%] sm:left-[-2%]`}
          >
            <ChefHat aria-hidden="true" className="size-5 text-ember-700" />
            <span className="text-sm font-extrabold">Made fresh, every order</span>
          </div>

          <div className="absolute top-[2%] right-[2%] z-20 hidden flex-col items-center text-flame-400 sm:flex">
            <span className="font-display rotate-6 text-2xl font-extrabold tracking-wider">Hot off the grill!</span>
            <DoodleArrow className="-mt-1 mr-10 h-14 w-20 -scale-x-100 rotate-12" />
          </div>

          <div
            className={`${floatBase} right-0 bottom-0 flex items-center gap-3 bg-charcoal-900/90 p-3 pr-4 text-cream-50 ring-1 ring-charcoal-600 [animation-delay:2.2s] sm:right-[3%]`}
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-ember-500/15 text-ember-500 ring-1 ring-ember-500/40">
              <Heart aria-hidden="true" className="size-5" fill="currentColor" />
            </span>
            <span className="leading-tight">
              <span className="font-display block text-lg font-black text-flame-400 sm:text-2xl">Loved across Karachi</span>
              <span className="block text-xs font-semibold text-sand-300">Delivering from Saddar to DHA</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

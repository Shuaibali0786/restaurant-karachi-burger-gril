import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Promo } from "@/lib/types";
import { formatRs } from "@/lib/format";
import { buttonClasses } from "@/components/ui/Button";
import { WingsCountdown } from "@/components/ui/Countdown";
import { OpenItemButton } from "@/components/menu/OpenItemButton";

const photoMask = "[mask-image:radial-gradient(ellipse_70%_70%_at_60%_50%,black_45%,transparent_95%)]";

function ComboBanner({ promo }: { promo: Extract<Promo, { kind: "price" }> }) {
  return (
    <article className="relative isolate flex min-h-72 overflow-hidden rounded-card bg-flame-400 text-charcoal-950 shadow-card">
      <div aria-hidden="true" className="absolute -top-16 -left-16 -z-10 size-64 rounded-full bg-flame-300 blur-2xl" />
      <div className="relative z-10 flex max-w-[58%] flex-col justify-center p-6 sm:p-8">
        <h3 className="font-display text-4xl leading-[0.9] font-black sm:text-5xl">{promo.title}</h3>
        <p className="font-script mt-2 text-2xl text-charcoal-800">Big taste. Bigger savings!</p>
        <p className="mt-4 flex flex-wrap items-center gap-3">
          <s className="text-lg font-bold text-charcoal-800">
            <span className="sr-only">Was </span>
            {formatRs(promo.wasPrice)}
          </s>
          <span className="rounded-xl bg-charcoal-950 px-3 py-1 text-2xl font-black text-flame-400">
            <span className="sr-only">Now </span>
            {formatRs(promo.price)}
          </span>
        </p>
        <OpenItemButton slug={promo.itemSlug} className={buttonClasses("dark", "md", "mt-6 self-start")}>
          Order combo
          <ArrowRight aria-hidden="true" className="size-4" />
        </OpenItemButton>
      </div>
      {/* Round "plate" medallion: the studio photo's black background reads as intentional on gold. */}
      <div className="absolute top-1/2 -right-12 size-40 -translate-y-1/2 overflow-hidden rounded-full bg-charcoal-950 shadow-[0_20px_50px_-15px_rgb(30_23_18/0.7)] ring-8 ring-flame-300 sm:-right-6 sm:size-72">
        <Image
          src={promo.image}
          alt="Grand Combo burger, fries and drink"
          fill
          sizes="(min-width: 640px) 18rem, 10rem"
          className="scale-125 object-cover"
        />
      </div>
    </article>
  );
}

function WingsBanner({ promo }: { promo: Extract<Promo, { kind: "weekday-percent" }> }) {
  return (
    <article className="relative isolate flex min-h-72 overflow-hidden rounded-card bg-charcoal-900 text-cream-50 shadow-card ring-1 ring-charcoal-700">
      <div aria-hidden="true" className="absolute right-0 bottom-0 -z-10 size-72 rounded-full bg-ember-500/30 blur-3xl" />
      <div className="relative z-10 flex max-w-[64%] flex-col justify-center p-6 sm:p-8">
        <h3 className="font-display text-4xl leading-[0.9] font-black sm:text-5xl">{promo.title}</h3>
        <p className="mt-3 text-lg font-bold">
          Get <span className="text-2xl font-black text-flame-400">{promo.percent}% off</span> wings
        </p>
        <p className="text-sm text-sand-300">On Fire Wings, every Wednesday (Pakistan time)</p>
        <WingsCountdown className="mt-4" />
        <OpenItemButton slug={promo.itemSlug} className={buttonClasses("primary", "md", "mt-6 self-start")}>
          Grab the deal
          <ArrowRight aria-hidden="true" className="size-4" />
        </OpenItemButton>
      </div>
      <Image
        src={promo.image}
        alt="Fire Wings glazed in hot sauce"
        fill
        sizes="(min-width: 1024px) 30vw, 60vw"
        className={`left-[40%]! w-[60%]! object-cover ${photoMask}`}
      />
      {/* Keeps the copy readable where it overlaps the photo on narrow screens. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-charcoal-900 via-charcoal-900/85 to-transparent sm:via-charcoal-900/40"
      />
    </article>
  );
}

export function PromoBanners({ promos }: { promos: Promo[] }) {
  const combo = promos.find((p): p is Extract<Promo, { kind: "price" }> => p.kind === "price");
  const wings = promos.find((p): p is Extract<Promo, { kind: "weekday-percent" }> => p.kind === "weekday-percent");

  return (
    <section aria-label="Deals" className="bg-cream-50 py-16 sm:py-20">
      <div className="container-page grid gap-6 lg:grid-cols-2">
        {combo && <ComboBanner promo={combo} />}
        {wings && <WingsBanner promo={wings} />}
      </div>
    </section>
  );
}

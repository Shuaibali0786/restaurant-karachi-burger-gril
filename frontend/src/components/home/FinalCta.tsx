import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="defer-paint relative isolate overflow-hidden bg-charcoal-950 py-24 text-center text-cream-50 sm:py-32">
      <Image src="/images/fire-bg.jpg" alt="" fill sizes="100vw" className="-z-20 object-cover opacity-70" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-charcoal-950 via-charcoal-950/55 to-charcoal-950/80" />

      <div className="reveal-on-scroll container-page">
        <p className="text-sm font-extrabold tracking-[0.25em] text-flame-400 uppercase">Hungry yet?</p>
        <h2 id="final-cta-title" className="font-display mt-3 text-6xl leading-none font-black drop-shadow-[0_4px_30px_rgb(255_90_31/0.5)] sm:text-8xl">
          Taste the fire
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-lg text-sand-300">
          Hot, fresh and at your door in 30 minutes — anywhere from Saddar to DHA.
        </p>
        <ButtonLink
          href="/menu"
          size="lg"
          className="mt-8"
          trailingIcon={<ArrowRight aria-hidden="true" className="size-5" />}
        >
          Order Now
        </ButtonLink>
      </div>
    </section>
  );
}

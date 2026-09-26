import type { Metadata } from "next";
import Image from "next/image";
import { House, UtensilsCrossed } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmberParticles } from "@/components/home/EmberParticles";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/** Branded 404 in the fire theme. */
export default function NotFound() {
  return (
    <section className="relative isolate flex min-h-[75vh] items-center overflow-hidden bg-charcoal-950 text-cream-50">
      <Image src="/images/fire-bg.jpg" alt="" fill sizes="100vw" className="-z-20 object-cover object-bottom opacity-30 [mask-image:linear-gradient(to_top,black,transparent_70%)]" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_50%_45%,rgb(255_90_31/0.25),transparent_70%)]" />
      <EmberParticles />

      <div className="container-page py-20 text-center">
        <p className="font-display bg-gradient-to-b from-flame-400 to-ember-600 bg-clip-text text-[9rem] leading-none font-black text-transparent drop-shadow-[0_6px_40px_rgb(255_90_31/0.45)] sm:text-[13rem]">
          404
        </p>
        <p className="font-script mt-2 text-3xl text-flame-400">Wrong turn on Burns Road?</p>
        <h1 className="font-display mt-2 text-4xl font-black sm:text-5xl">This grill&apos;s gone cold</h1>
        <p className="mx-auto mt-3 max-w-md text-lg text-sand-300">
          The page you&apos;re looking for isn&apos;t here — but the burgers are still hot.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/menu" size="lg" icon={<UtensilsCrossed aria-hidden="true" className="size-5" />}>
            Back to menu
          </ButtonLink>
          <ButtonLink href="/" size="lg" variant="secondary" icon={<House aria-hidden="true" className="size-5" />} className="text-cream-50">
            Home
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

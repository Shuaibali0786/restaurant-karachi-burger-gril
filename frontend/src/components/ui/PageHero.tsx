import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/ui/Reveal";

interface PageHeroProps {
  title: string;
  /** Handwritten accent above the title. */
  eyebrow?: string;
  intro?: ReactNode;
  /** Optional background photo, heavily darkened. */
  image?: { src: string; position?: string };
  /** Optional visual for the right-hand side on wide screens (e.g. a photo collage). */
  media?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Dark "fire" page header shared by every inner page. */
export function PageHero({ title, eyebrow, intro, image, media, children, className }: PageHeroProps) {
  return (
    <section className={cn("relative isolate overflow-hidden bg-charcoal-950 text-cream-50", className)}>
      {image && (
        <Image
          src={image.src}
          alt=""
          fill
          preload
          sizes="100vw"
          className={cn("-z-20 object-cover opacity-35", image.position ?? "object-center")}
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_90%_at_85%_20%,rgb(255_90_31/0.28),transparent_70%),linear-gradient(to_top,var(--color-charcoal-950),transparent_60%)]"
      />
      <div className={cn("container-page py-12 sm:py-16", media ? "grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]" : undefined)}>
        <Reveal>
          {eyebrow && <p className="font-script text-2xl text-flame-400">{eyebrow}</p>}
          <h1 className="font-display mt-1 text-5xl leading-none font-black sm:text-7xl">{title}</h1>
          {intro && <div className="mt-3 max-w-2xl text-lg text-sand-300">{intro}</div>}
          {children}
        </Reveal>
        {media && (
          <Reveal delay={0.15} className="hidden lg:block">
            {media}
          </Reveal>
        )}
      </div>
    </section>
  );
}

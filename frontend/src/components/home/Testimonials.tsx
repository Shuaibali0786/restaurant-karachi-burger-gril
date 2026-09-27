import { Info, Quote } from "lucide-react";
import type { Testimonial } from "@/lib/types";
import { Rating } from "@/components/ui/Rating";
import { SectionHeading } from "@/components/ui/SectionHeading";

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .replace(".", "");

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const hasSamples = testimonials.some((t) => t.isSample);

  return (
    <section aria-labelledby="testimonials-title" className="defer-paint bg-cream-100/70 py-16 sm:py-20">
      <div className="reveal-on-scroll container-page">
        <SectionHeading id="testimonials-title" eyebrow="Straight from the table" title="What Karachi says" align="center" className="mb-4" />

        {/* Constitution X: sample reviews are always clearly labelled. */}
        {hasSamples && (
          <p className="mx-auto mb-10 flex w-fit items-center gap-2 rounded-full bg-charcoal-950 px-4 py-2 text-sm font-bold text-cream-50">
            <Info aria-hidden="true" className="size-4 text-flame-400" />
            Sample reviews
            <span className="font-medium text-sand-300">· real customer reviews coming soon</span>
          </p>
        )}

        {/* Focusable so keyboard users can scroll the row on phones. */}
        <ul tabIndex={0} aria-label="Sample reviews" className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3">
          {testimonials.map((t) => (
            <li key={t.id} className="w-[85%] shrink-0 snap-center md:w-auto">
              <figure className="flex h-full flex-col rounded-card bg-white p-6 shadow-card ring-1 ring-cream-200">
                <div className="flex items-center justify-between">
                  <Rating value={t.rating} />
                  <Quote aria-hidden="true" className="size-7 text-ember-500/30" />
                </div>
                <blockquote className="mt-4 flex-1 leading-relaxed text-ink-900">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-10 items-center justify-center rounded-full bg-flame-400 text-sm font-extrabold text-charcoal-950"
                  >
                    {initials(t.name)}
                  </span>
                  <span className="leading-tight">
                    <span className="block font-extrabold text-ink-900">{t.name}</span>
                    <span className="block text-sm text-ink-600">
                      {t.area}
                      {t.isSample && " · Sample review"}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

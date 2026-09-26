import { ExternalLink, MapPin, Navigation } from "lucide-react";

const DIRECTIONS_URL = "https://www.google.com/maps/search/?api=1&query=Burns+Road+Saddar+Karachi";

/** "Find us" card with a stylised street-grid backdrop instead of an embedded map. */
export function LocationCard({ address }: { address: string }) {
  return (
    <section
      aria-labelledby="find-us-title"
      className="relative isolate overflow-hidden rounded-card bg-charcoal-950 p-6 text-cream-50 ring-1 ring-charcoal-700 sm:p-8"
    >
      {/* Decorative street grid + glowing pin */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(var(--color-charcoal-700)_1px,transparent_1px),linear-gradient(90deg,var(--color-charcoal-700)_1px,transparent_1px)] [background-size:36px_36px]"
      />
      <div aria-hidden="true" className="absolute right-10 bottom-10 -z-10 h-2 w-[140%] -rotate-6 bg-charcoal-700" />
      <div aria-hidden="true" className="absolute top-8 right-16 -z-10 hidden size-40 rounded-full bg-ember-500/30 blur-2xl sm:block" />
      <span aria-hidden="true" className="absolute top-10 right-20 hidden sm:block">
        <MapPin className="size-16 animate-float-y text-ember-500 drop-shadow-[0_0_18px_rgb(255_90_31/0.8)]" fill="currentColor" strokeWidth={1.5} />
      </span>

      <p className="font-script text-2xl text-flame-400">Find us on Burns Road</p>
      <h2 id="find-us-title" className="font-display mt-1 text-4xl leading-none font-black sm:max-w-[60%]">
        The home of Karachi&apos;s food street
      </h2>
      <p className="mt-4 flex items-start gap-2 text-lg font-semibold">
        <MapPin aria-hidden="true" className="mt-1 size-5 shrink-0 text-ember-500" />
        {address}
      </p>
      <p className="mt-2 max-w-md text-sand-300">
        Right in the middle of the old food street — follow the smell of charcoal. Delivering across Saddar, Clifton, DHA,
        PECHS, Gulshan and North Nazimabad.
      </p>
      <a
        href={DIRECTIONS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-ember-500 px-5 font-bold text-charcoal-950 transition hover:bg-flame-400"
      >
        <Navigation aria-hidden="true" className="size-4" />
        Get directions
        <ExternalLink aria-hidden="true" className="size-4" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </section>
  );
}

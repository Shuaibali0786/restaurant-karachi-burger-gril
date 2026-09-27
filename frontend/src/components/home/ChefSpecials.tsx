import Image from "next/image";
import { Plus } from "lucide-react";
import type { MenuItemView } from "@/lib/types";
import { cn } from "@/lib/cn";
import { formatRs } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { OpenItemButton } from "@/components/menu/OpenItemButton";

/**
 * Per-photo framing so the food, not the smoke or background, is what shows.
 * Grill platter: food sits ~50–65% down the portrait photo. Grand Combo: burger
 * on the left of the photo, so the image lives on the right of the tile.
 */
const framing: Record<string, string> = {
  "grill-mix-platter": "object-[center_62%]",
  "grand-combo": "object-[18%_60%]",
  "loaded-fire-fries": "object-center",
};

function SpecialTile({ item, large }: { item: MenuItemView; large?: boolean }) {
  const position = framing[item.slug] ?? "object-center";

  return (
    <article
      className={cn(
        "group relative isolate flex min-h-72 flex-col overflow-hidden rounded-card bg-charcoal-950 ring-1 ring-charcoal-700 transition duration-300 hover:shadow-glow",
        large ? "justify-end lg:row-span-2 lg:min-h-[36rem]" : "justify-center",
      )}
    >
      {large ? (
        <>
          <Image
            src={item.image}
            alt={item.imageAlt}
            fill
            sizes="(min-width: 1024px) 60vw, 95vw"
            className={cn("-z-20 object-cover transition duration-700 group-hover:scale-105", position)}
          />
          {/* Light overlay: darkens only the text area so the food stays bright. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-t from-charcoal-950/95 via-charcoal-950/30 via-40% to-transparent"
          />
        </>
      ) : (
        // Small tiles: photo on the right, copy on the left, soft fade between.
        <div className="absolute inset-y-0 right-0 -z-20 w-[72%] [mask-image:linear-gradient(to_right,transparent,black_35%)]">
          <Image
            src={item.image}
            alt={item.imageAlt}
            fill
            sizes="(min-width: 1024px) 25vw, 70vw"
            className={cn("object-cover transition duration-700 group-hover:scale-105", position)}
          />
        </div>
      )}

      <div className={cn("p-5 sm:p-6", !large && "max-w-[54%]")}>
        {item.tag && <Badge tag={item.tag} />}
        <h3 className={cn("font-display mt-3 font-black text-cream-50", large ? "text-4xl sm:text-5xl" : "text-3xl")}>
          {item.name}
        </h3>
        <p className={cn("mt-1 text-sand-300", large ? "max-w-md text-base" : "line-clamp-2 text-sm")}>{item.description}</p>
        <div className={cn("mt-4 flex items-center gap-3", large ? "justify-between" : "flex-wrap")}>
          <p className="text-xl font-black text-flame-400">
            <span className="text-xs font-semibold text-sand-300">from </span>
            {formatRs(item.basePrice)}
          </p>
          <OpenItemButton
            slug={item.slug}
            aria-label={`Add ${item.name}`}
            className="inline-flex min-h-11 items-center gap-1 rounded-full bg-flame-400 px-4 text-sm font-extrabold text-charcoal-950 transition hover:bg-ember-500"
          >
            Add
            <Plus aria-hidden="true" className="size-4" strokeWidth={3} />
          </OpenItemButton>
        </div>
      </div>
    </article>
  );
}

export function ChefSpecials({ items }: { items: MenuItemView[] }) {
  const featured = items.find((item) => item.slug === "grill-mix-platter") ?? items[0];
  const others = items.filter((item) => item !== featured);
  if (!featured) return null;

  return (
    <section aria-labelledby="chef-specials-title" className="defer-paint bg-charcoal-900 py-16 text-cream-50 sm:py-20">
      <div className="reveal-on-scroll container-page">
        <SectionHeading
          id="chef-specials-title"
          eyebrow="Chef's specials"
          title="Fresh off the coals"
          tone="dark"
          link={{ label: "See the full menu", href: "/menu" }}
        />
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <SpecialTile item={featured} large />
          {others.map((item) => (
            <SpecialTile key={item.slug} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

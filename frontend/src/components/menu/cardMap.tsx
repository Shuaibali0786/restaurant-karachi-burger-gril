import type { ReactNode } from "react";
import type { MenuItemView, Promo } from "@/lib/types";
import { ProductCard } from "@/components/menu/ProductCard";

type WeekdayPromo = Extract<Promo, { kind: "weekday-percent" }>;

/** Weekday deal (if any) attached to an item — evaluated for "today" by the card's price island. */
export function dealFor(slug: string, promos: readonly Promo[]): WeekdayPromo | null {
  return promos.find((p): p is WeekdayPromo => p.kind === "weekday-percent" && p.itemSlug === slug) ?? null;
}

/**
 * Pre-renders product cards on the server, keyed by slug. Client lists (tabs,
 * filters, favourites) receive these finished cards and only choose which to
 * show — so the cards themselves don't hydrate as client components.
 */
export function buildCardMap(
  items: readonly MenuItemView[],
  promos: readonly Promo[],
  { eager = [] }: { eager?: readonly string[] } = {},
): Record<string, ReactNode> {
  return Object.fromEntries(
    items.map((item) => [
      item.slug,
      <ProductCard key={item.slug} item={item} deal={dealFor(item.slug, promos)} eager={eager.includes(item.slug)} />,
    ]),
  );
}

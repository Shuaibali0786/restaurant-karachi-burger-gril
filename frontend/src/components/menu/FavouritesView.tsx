"use client";

import { Fragment, type ReactNode } from "react";
import { Heart, UtensilsCrossed } from "lucide-react";
import type { MenuItemView } from "@/lib/types";
import { useFavourites } from "@/stores/favourites";
import { useHydrated } from "@/stores/hydration";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

/** Hearted items (saved on this device), in the order they were saved. */
export function FavouritesView({ items, cards }: { items: MenuItemView[]; cards: Record<string, ReactNode> }) {
  const hydrated = useHydrated();
  const slugs = useFavourites((state) => state.slugs);

  if (!hydrated) return <div className="h-80 animate-pulse rounded-card bg-cream-100" aria-label="Loading favourites" />;

  const bySlug = new Map(items.map((item) => [item.slug, item]));
  // Items that have left the menu simply don't show.
  const saved = slugs.map((slug) => bySlug.get(slug)).filter((item): item is MenuItemView => item !== undefined);

  if (saved.length === 0) {
    return (
      <EmptyState
        icon={<Heart aria-hidden="true" className="size-9" />}
        title="No favourites yet"
        text="Tap the heart on any item to save it here for your next craving."
        action={
          <ButtonLink href="/menu" size="lg" icon={<UtensilsCrossed aria-hidden="true" className="size-5" />}>
            Browse menu
          </ButtonLink>
        }
      />
    );
  }

  return (
    <>
      <p className="mb-6 font-bold text-ink-900" aria-live="polite">
        {saved.length} saved {saved.length === 1 ? "item" : "items"}
      </p>
      <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {saved.map((item) => (
          <Fragment key={item.slug}>{cards[item.slug]}</Fragment>
        ))}
      </div>
    </>
  );
}

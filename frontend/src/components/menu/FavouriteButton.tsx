"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { useFavourites } from "@/stores/favourites";
import { useHydrated } from "@/stores/hydration";

interface FavouriteButtonProps {
  slug: string;
  name: string;
  className?: string;
}

export function FavouriteButton({ slug, name, className }: FavouriteButtonProps) {
  const hydrated = useHydrated();
  const isFavourite = useFavourites((state) => state.slugs.includes(slug));
  const toggle = useFavourites((state) => state.toggle);
  const active = hydrated && isFavourite;

  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      aria-pressed={active}
      aria-label={active ? `Remove ${name} from favourites` : `Add ${name} to favourites`}
      className={cn(
        "flex size-11 items-center justify-center rounded-full bg-white/90 shadow-card backdrop-blur transition hover:scale-110",
        active ? "text-ember-600" : "text-ink-600 hover:text-ember-600",
        className,
      )}
    >
      <Heart aria-hidden="true" className="size-5" fill={active ? "currentColor" : "none"} />
    </button>
  );
}

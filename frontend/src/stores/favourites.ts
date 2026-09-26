"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistStorage } from "@/stores/storage";

interface FavouritesState {
  slugs: string[];
  toggle: (slug: string) => void;
}

/**
 * Hearted menu items, saved on the device. Screens intersect `slugs` with the
 * live menu, so an item removed from the menu simply stops showing.
 */
export const useFavourites = create<FavouritesState>()(
  persist(
    (set) => ({
      slugs: [],
      toggle: (slug) =>
        set((state) => ({
          slugs: state.slugs.includes(slug) ? state.slugs.filter((s) => s !== slug) : [...state.slugs, slug],
        })),
    }),
    {
      name: "kbg-favourites-v1",
      version: 1,
      storage: persistStorage,
      skipHydration: true,
      partialize: (state) => ({ slugs: state.slugs }),
      merge: (persisted, current) => {
        const slugs = (persisted as Partial<FavouritesState> | undefined)?.slugs;
        const valid = Array.isArray(slugs) ? [...new Set(slugs.filter((s): s is string => typeof s === "string"))] : [];
        return { ...current, slugs: valid };
      },
    },
  ),
);

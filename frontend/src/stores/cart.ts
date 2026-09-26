"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mergeLine, type CartLineInput } from "@/lib/cart";
import type { CartLine } from "@/lib/types";
import { persistStorage } from "@/stores/storage";

interface CartState {
  lines: CartLine[];
  /** Adds a configured item (only ever called from ItemDetail — Constitution III). */
  add: (input: CartLineInput) => void;
}

const isCartLine = (value: unknown): value is CartLine => {
  const line = value as Partial<CartLine> | null;
  return (
    typeof line?.key === "string" &&
    typeof line.itemSlug === "string" &&
    typeof line.optionId === "string" &&
    Array.isArray(line.addonIds) &&
    typeof line.note === "string" &&
    typeof line.quantity === "number"
  );
};

/** Cart saved on the device. Prices are never stored — they're recomputed from the menu. */
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (input) => set((state) => ({ lines: mergeLine(state.lines, input, new Date().toISOString()) })),
    }),
    {
      name: "kbg-cart-v1",
      version: 1,
      storage: persistStorage,
      skipHydration: true,
      partialize: (state) => ({ lines: state.lines }),
      // Corrupted entries are dropped individually; the rest of the cart survives.
      merge: (persisted, current) => {
        const lines = (persisted as { lines?: unknown } | undefined)?.lines;
        return { ...current, lines: Array.isArray(lines) ? lines.filter(isCartLine) : [] };
      },
    },
  ),
);

export const selectCartCount = (state: CartState) => state.lines.reduce((sum, line) => sum + line.quantity, 0);

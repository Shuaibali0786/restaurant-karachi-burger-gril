"use client";

import { create } from "zustand";

interface UiState {
  /** Slug of the item open in the item detail modal (Phase 4), or null. */
  activeItemSlug: string | null;
  openItem: (slug: string) => void;
  closeItem: () => void;
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** Cart icon element — the fly-to-cart animation target (Phase 5). */
  cartIcon: HTMLElement | null;
  setCartIcon: (element: HTMLElement | null) => void;
}

export const useUi = create<UiState>()((set) => ({
  activeItemSlug: null,
  openItem: (slug) => set({ activeItemSlug: slug }),
  closeItem: () => set({ activeItemSlug: null }),
  cartOpen: false,
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  cartIcon: null,
  setCartIcon: (element) => set({ cartIcon: element }),
}));

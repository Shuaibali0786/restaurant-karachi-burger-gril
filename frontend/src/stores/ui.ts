"use client";

import { create } from "zustand";

export const ITEM_PARAM = "item";

interface Toast {
  id: number;
  message: string;
}

interface UiState {
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** Cart icon element — the fly-to-cart animation target (Phase 5). */
  cartIcon: HTMLElement | null;
  setCartIcon: (element: HTMLElement | null) => void;
  toast: Toast | null;
  showToast: (message: string) => void;
  dismissToast: () => void;
}

export const useUi = create<UiState>()((set) => ({
  cartOpen: false,
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  cartIcon: null,
  setCartIcon: (element) => set({ cartIcon: element }),
  toast: null,
  showToast: (message) => set({ toast: { id: Date.now(), message } }),
  dismissToast: () => set({ toast: null }),
}));

/*
 * Item detail modal state lives in the URL (?item=<slug>) so it is shareable
 * and the browser/phone back button closes it, like a real ordering app.
 * Next.js syncs native history calls with useSearchParams.
 */
let openedByPush = false;
let opener: HTMLElement | null = null;

function urlWithItem(slug: string | null): string {
  const url = new URL(window.location.href);
  if (slug) url.searchParams.set(ITEM_PARAM, slug);
  else url.searchParams.delete(ITEM_PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Opens the item detail modal. Never adds to the cart (Constitution III). */
export function openItem(slug: string) {
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const alreadyOpen = new URL(window.location.href).searchParams.has(ITEM_PARAM);
  if (alreadyOpen) {
    window.history.replaceState(null, "", urlWithItem(slug));
  } else {
    window.history.pushState(null, "", urlWithItem(slug));
    openedByPush = true;
  }
}

/** Closes the modal: steps back if we pushed the entry, otherwise just drops the param. */
export function closeItem() {
  if (!new URL(window.location.href).searchParams.has(ITEM_PARAM)) return;
  if (openedByPush) {
    openedByPush = false;
    window.history.back();
  } else {
    window.history.replaceState(null, "", urlWithItem(null));
  }
}

/** Returns focus to the card or button that opened the modal. */
export function restoreItemOpenerFocus() {
  if (opener?.isConnected) opener.focus({ preventScroll: true });
  opener = null;
}

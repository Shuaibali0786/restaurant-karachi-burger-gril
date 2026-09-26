"use client";

import { useSyncExternalStore } from "react";

/**
 * Persisted stores use `skipHydration` so server HTML and the first client
 * render match; StoreHydrator rehydrates them after mount and flips this flag.
 */
let hydrated = false;
const listeners = new Set<() => void>();

export function markStoresHydrated() {
  hydrated = true;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** False on the server and first client render; true once persisted state is loaded. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => false,
  );
}

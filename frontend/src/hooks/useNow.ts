"use client";

import { useSyncExternalStore } from "react";

/**
 * The current time, re-rendering every `intervalMs`. Returns null on the
 * server and during hydration so time-dependent UI never mismatches.
 */
export function useNow(intervalMs = 1000): Date | null {
  const tick = useSyncExternalStore(
    (onChange) => {
      const id = window.setInterval(onChange, intervalMs);
      return () => window.clearInterval(id);
    },
    () => Math.floor(Date.now() / intervalMs),
    () => null,
  );
  // Derived from the snapshot so render stays pure (accurate to `intervalMs`).
  return tick === null ? null : new Date(tick * intervalMs);
}

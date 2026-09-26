"use client";

import { MotionConfig } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { useFavourites } from "@/stores/favourites";
import { markStoresHydrated } from "@/stores/hydration";

/** Loads persisted stores after mount so server and client HTML match. */
function StoreHydrator() {
  useEffect(() => {
    void Promise.resolve(useFavourites.persist.rehydrate()).then(markStoresHydrated);
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  // Every motion animation follows the OS "reduce motion" setting (Constitution IV).
  return (
    <MotionConfig reducedMotion="user">
      <StoreHydrator />
      {children}
    </MotionConfig>
  );
}

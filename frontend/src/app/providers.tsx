"use client";

import { useEffect, type ReactNode } from "react";
import type { Promo } from "@/lib/types";
import { useCart } from "@/stores/cart";
import { useFavourites } from "@/stores/favourites";
import { markStoresHydrated } from "@/stores/hydration";
import { PromosProvider } from "@/stores/promos";

/** Loads persisted stores after mount so server and client HTML match. */
function StoreHydrator() {
  useEffect(() => {
    void Promise.all([useFavourites.persist.rehydrate(), useCart.persist.rehydrate()]).then(markStoresHydrated);
  }, []);
  return null;
}

/*
 * Motion note (Constitution IV): page reveals, hovers, embers and transitions are
 * CSS and respect prefers-reduced-motion in globals.css. The one JS animation —
 * fly-to-cart — checks reduced motion itself and is loaded on demand.
 */
export function Providers({ promos, children }: { promos: readonly Promo[]; children: ReactNode }) {
  return (
    <PromosProvider promos={promos}>
      <StoreHydrator />
      {children}
    </PromosProvider>
  );
}

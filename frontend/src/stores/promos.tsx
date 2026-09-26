"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Promo } from "@/lib/types";

/** Active promotions, fetched on the server in the root layout and shared with client islands. */
const PromosContext = createContext<readonly Promo[]>([]);

export function PromosProvider({ promos, children }: { promos: readonly Promo[]; children: ReactNode }) {
  return <PromosContext.Provider value={promos}>{children}</PromosContext.Provider>;
}

export function usePromos(): readonly Promo[] {
  return useContext(PromosContext);
}

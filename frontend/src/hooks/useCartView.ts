"use client";

import { useEffect, useMemo } from "react";
import type { MenuItemView } from "@/lib/types";
import { cartTotals, resolveCart } from "@/lib/pricing";
import { isOpenNow } from "@/lib/time";
import { useNow } from "@/hooks/useNow";
import { useCart } from "@/stores/cart";
import { useHydrated } from "@/stores/hydration";
import { usePromos } from "@/stores/promos";

const CLOCK_MS = 30_000;

/**
 * The cart as the customer sees it: saved lines joined with the live menu and
 * today's deals (re-checked every 30 s so Wings Wednesday starts/ends on time).
 * `items` may be null while the menu is still loading — nothing is judged until it arrives.
 */
export function useCartView(items: readonly MenuItemView[] | null) {
  const hydrated = useHydrated();
  const lines = useCart((state) => state.lines);
  const removeMany = useCart((state) => state.removeMany);
  const promos = usePromos();
  const now = useNow(CLOCK_MS);

  const view = useMemo(
    () => (now && items ? resolveCart(lines, items, promos, now) : null),
    [lines, items, promos, now],
  );

  // Silently drop saved lines whose item/option/add-on left the menu (spec edge case).
  const invalidKey = view?.invalidKeys.join("|") ?? "";
  useEffect(() => {
    if (hydrated && view && view.invalidKeys.length > 0) removeMany(view.invalidKeys);
  }, [hydrated, invalidKey, view, removeMany]);

  const ready = hydrated && view !== null;
  const resolved = ready ? view.lines : [];

  return {
    ready,
    lines: resolved,
    totals: cartTotals(resolved),
    count: resolved.reduce((sum, l) => sum + l.line.quantity, 0),
    promoEnded: ready && view.promoEnded,
    closedNow: now !== null && !isOpenNow(now),
  };
}

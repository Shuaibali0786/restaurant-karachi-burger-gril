"use client";

import { useEffect, useState } from "react";
import type { MenuItemView } from "@/lib/types";

let cache: MenuItemView[] | null = null;
let pending: Promise<MenuItemView[]> | null = null;

function loadCatalog(): Promise<MenuItemView[]> {
  pending ??= import("@/lib/api")
    .then(({ getMenuItems }) => getMenuItems())
    .then((items) => (cache = items));
  return pending;
}

/**
 * The menu for site-wide overlays (item view, cart drawer), loaded once on
 * demand through lib/api instead of being embedded in every page's HTML.
 * Returns null until loaded. Phase 2: getMenuItems becomes a backend call.
 */
export function useCatalog(): MenuItemView[] | null {
  const [items, setItems] = useState<MenuItemView[] | null>(cache);

  useEffect(() => {
    if (cache) return;
    let active = true;
    void loadCatalog().then((loaded) => {
      if (active) setItems(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  return items;
}

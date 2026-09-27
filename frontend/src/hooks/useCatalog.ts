"use client";

import { useCallback, useEffect, useState } from "react";
import type { MenuItemView } from "@/lib/types";

let cache: MenuItemView[] | null = null;
let pending: Promise<MenuItemView[]> | null = null;

function loadCatalog(): Promise<MenuItemView[]> {
  pending ??= import("@/lib/api")
    .then(({ getMenuItems }) => getMenuItems())
    .then((items) => (cache = items))
    .catch((error: unknown) => {
      pending = null; // let the next mount (or a Retry click) try again
      throw error;
    });
  return pending;
}

export interface CatalogState {
  items: MenuItemView[] | null;
  /** The menu couldn't be loaded (backend unreachable). */
  error: boolean;
  retry: () => void;
}

/**
 * The menu for site-wide overlays (item view, cart drawer), loaded once on
 * demand through lib/api instead of being embedded in every page's HTML.
 * `items` is null while loading; `error` is set if the request failed.
 */
export function useCatalog(): CatalogState {
  const [items, setItems] = useState<MenuItemView[] | null>(cache);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (cache) return; // already in state via the useState initialiser above
    let active = true;
    loadCatalog()
      .then((loaded) => {
        if (active) setItems(loaded);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setError(false); // clear the stale error before the effect above tries again
    setAttempt((n) => n + 1);
  }, []);

  return { items, error, retry };
}

"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { menuSorts } from "@/lib/menu";
import type { CategorySlug, MenuSort } from "@/lib/types";

export interface MenuViewState {
  category: CategorySlug | null;
  search: string;
  sort: MenuSort;
}

const SORTS = new Set<string>(menuSorts.map((s) => s.value));

/**
 * Menu filter/search/sort state kept in the URL (?category=&q=&sort=) so views
 * are shareable. Updates use history.replaceState — instant, no server round-trip.
 */
export function useMenuQuery(categoryIds: readonly CategorySlug[]) {
  const params = useSearchParams();
  const pathname = usePathname();

  const state = useMemo<MenuViewState>(() => {
    const category = params.get("category");
    const sort = params.get("sort");
    return {
      category: categoryIds.find((id) => id === category) ?? null,
      search: params.get("q") ?? "",
      sort: sort && SORTS.has(sort) ? (sort as MenuSort) : "popular",
    };
  }, [params, categoryIds]);

  const update = useCallback(
    (patch: Partial<MenuViewState>) => {
      const next = new URLSearchParams(params.toString());
      const set = (key: string, value: string | null | undefined, fallback?: string) => {
        if (!value || value === fallback) next.delete(key);
        else next.set(key, value);
      };
      if ("category" in patch) set("category", patch.category);
      if ("search" in patch) set("q", patch.search?.trim());
      if ("sort" in patch) set("sort", patch.sort, "popular");
      const qs = next.toString();
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [params, pathname],
  );

  const clear = useCallback(() => window.history.replaceState(null, "", pathname), [pathname]);

  const isFiltered = Boolean(state.category || state.search || state.sort !== "popular");

  return { state, update, clear, isFiltered };
}

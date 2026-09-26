"use client";

import { useMemo } from "react";
import type { Category, CategorySlug, MenuItemView } from "@/lib/types";
import { filterMenu, menuSorts } from "@/lib/menu";
import { useMenuQuery } from "@/hooks/useMenuQuery";
import { Filters } from "@/components/menu/Filters";
import { MenuGrid } from "@/components/menu/MenuGrid";

interface MenuBrowserProps {
  items: MenuItemView[];
  categories: Category[];
}

/** Filter bar + results, sharing one URL-backed state. */
export function MenuBrowser({ items, categories }: MenuBrowserProps) {
  const categoryIds = useMemo(() => categories.map((c) => c.id), [categories]);
  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])) as Record<CategorySlug, string>,
    [categories],
  );
  const { state, update, clear, isFiltered } = useMenuQuery(categoryIds);

  // Category counts reflect the current search so the chips stay honest.
  const searched = useMemo(
    () => filterMenu(items, { search: state.search }, categoryNames),
    [items, state.search, categoryNames],
  );
  const counts = useMemo(() => {
    const result = Object.fromEntries(categoryIds.map((id) => [id, 0])) as Record<CategorySlug, number>;
    for (const item of searched) result[item.category] += 1;
    return result;
  }, [searched, categoryIds]);

  const visible = useMemo(
    () => filterMenu(items, { category: state.category ?? undefined, search: state.search, sort: state.sort }, categoryNames),
    [items, state, categoryNames],
  );

  const summaryParts = [
    state.search && `“${state.search}”`,
    state.category && `in ${categoryNames[state.category]}`,
    state.sort !== "popular" && `sorted ${menuSorts.find((s) => s.value === state.sort)?.label.toLowerCase()}`,
  ].filter(Boolean);

  return (
    <>
      <Filters categories={categories} counts={counts} total={searched.length} state={state} onChange={update} />
      <div className="container-page py-10">
        <MenuGrid
          items={visible}
          categories={categories}
          grouped={!isFiltered}
          summary={summaryParts.length ? summaryParts.join(" ") : undefined}
          onClear={isFiltered ? clear : undefined}
        />
      </div>
    </>
  );
}

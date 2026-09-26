import type { CategorySlug, MenuItemView, MenuQuery, MenuSort, Option } from "@/lib/types";

export const menuSorts: { value: MenuSort; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

/**
 * Filter + search + sort rules shared by `getMenuItems` (server) and the menu
 * page grid (client), so both always agree.
 */
export function filterMenu(
  items: MenuItemView[],
  query: MenuQuery,
  categoryNames: Partial<Record<CategorySlug, string>> = {},
): MenuItemView[] {
  const search = query.search?.trim().toLowerCase() ?? "";

  const matches = items.filter((item) => {
    if (query.category && item.category !== query.category) return false;
    if (!search) return true;
    const haystack = `${item.name} ${item.description} ${categoryNames[item.category] ?? ""}`.toLowerCase();
    return haystack.includes(search);
  });

  const sort = query.sort ?? "popular";
  return matches.sort((a, b) => {
    if (sort === "price-asc") return a.basePrice - b.basePrice || a.popularity - b.popularity;
    if (sort === "price-desc") return b.basePrice - a.basePrice || a.popularity - b.popularity;
    return a.popularity - b.popularity;
  });
}

/** "Meal (Masala Fries + Chilled Cola)" — an option label with what it includes, for carts and orders. */
export function optionSummary(option: Pick<Option, "label" | "includes">): string {
  return option.includes ? `${option.label} (${option.includes})` : option.label;
}

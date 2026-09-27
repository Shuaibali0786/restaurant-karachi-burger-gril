import { categories } from "@/lib/data/categories";
import type { MenuItem, MenuItemView } from "@/lib/types";

const categoryById = new Map(categories.map((category) => [category.id, category]));

/**
 * Resolves an item's options (with per-item overrides) and add-ons from its category.
 * Used on static data by the backend export script and the tests. The live site reads the same
 * shape from the API, where `soldOut`/`available` come from the database.
 */
export function toView({ optionOverrides, ...item }: MenuItem): MenuItemView {
  const category = categoryById.get(item.category);
  if (!category) throw new Error(`Unknown category "${item.category}" for "${item.slug}"`);

  return {
    ...item,
    options: category.optionGroup.options.map((option) => ({
      ...option,
      priceDelta: optionOverrides?.[option.id] ?? option.priceDelta,
    })),
    addons: category.addons,
    soldOut: false,
    available: true,
  };
}

import type { CategorySlug, OptionGroup } from "@/lib/types";

const group = (options: OptionGroup["options"]): OptionGroup => ({
  label: "Choose an option",
  required: true,
  options,
});

/**
 * Category-level option groups (spec Menu Catalogue). Fried Chicken and BBQ
 * size prices differ per item and are set by `optionOverrides` in menu-items.ts.
 */
export const optionGroups: Record<CategorySlug, OptionGroup> = {
  burgers: group([
    { id: "single", label: "Single", priceDelta: 0 },
    { id: "double", label: "Double", priceDelta: 300 },
    { id: "meal", label: "Meal", priceDelta: 350 },
  ]),
  wraps: group([
    { id: "regular", label: "Regular", priceDelta: 0 },
    { id: "large", label: "Large", priceDelta: 150 },
    { id: "meal", label: "Meal", priceDelta: 300 },
  ]),
  "fried-chicken": group([
    { id: "regular", label: "Regular", priceDelta: 0 },
    { id: "double", label: "Double", priceDelta: 0 },
    { id: "family-pack", label: "Family Pack", priceDelta: 0 },
  ]),
  sandwiches: group([
    { id: "regular", label: "Regular", priceDelta: 0 },
    { id: "large", label: "Large", priceDelta: 250 },
    { id: "meal", label: "Meal", priceDelta: 300 },
  ]),
  bbq: group([
    { id: "single", label: "Single", priceDelta: 0 },
    { id: "double", label: "Double", priceDelta: 0 },
    { id: "family-pack", label: "Family Pack", priceDelta: 0 },
  ]),
  bowls: group([
    { id: "regular", label: "Regular", priceDelta: 0 },
    { id: "large", label: "Large", priceDelta: 200 },
  ]),
  "sides-drinks": group([
    { id: "regular", label: "Regular", priceDelta: 0 },
    { id: "large", label: "Large", priceDelta: 120 },
  ]),
  combos: group([{ id: "regular", label: "Regular", priceDelta: 0 }]),
};

import type { Category } from "@/lib/types";
import { extras } from "@/lib/data/extras";
import { optionGroups } from "@/lib/data/options";

const category = (
  id: Category["id"],
  name: string,
  order: number,
  image: string,
  imageAlt: string,
): Category => ({
  id,
  name,
  order,
  image: `/images/${image}.jpg`,
  imageAlt,
  optionGroup: optionGroups[id],
  addons: extras[id],
});

export const categories: Category[] = [
  category("burgers", "Burgers", 1, "double-cheese-burger", "Stacked double cheeseburger on a dark background"),
  category("wraps", "Wraps", 2, "chicken-wrap", "Grilled chicken wraps cut in half on a wooden board"),
  category("fried-chicken", "Fried Chicken", 3, "fried-chicken", "Golden crispy fried chicken pieces with fries"),
  category("sandwiches", "Sandwiches", 4, "club-sandwich", "Toasted club sandwich stacked with chicken and salad"),
  category("bbq", "BBQ", 5, "chicken-tikka", "Charred chicken tikka on a board with green chutney"),
  category("bowls", "Bowls", 6, "quinoa-bowl", "Colourful quinoa bowl with vegetables and fruit"),
  category("sides-drinks", "Sides & Drinks", 7, "loaded-fries", "Loaded fries topped with cheese and spicy chicken"),
  category("combos", "Combos", 8, "grand-combo", "Cheeseburger, fries and a chilled drink"),
];

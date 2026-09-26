import type { Addon, CategorySlug } from "@/lib/types";

/** "Make it extra" add-ons per category (spec Menu Catalogue; owner-approved 2026-09-26). */
export const extras: Record<CategorySlug, Addon[]> = {
  burgers: [
    { id: "extra-cheese", label: "Extra cheese", price: 100 },
    { id: "jalapenos", label: "Jalapeños", price: 50 },
    { id: "extra-patty", label: "Extra patty", price: 300 },
    { id: "chipotle-sauce", label: "Chipotle sauce", price: 50 },
  ],
  wraps: [
    { id: "extra-cheese", label: "Extra cheese", price: 100 },
    { id: "jalapenos", label: "Jalapeños", price: 50 },
  ],
  "fried-chicken": [
    { id: "extra-dip", label: "Extra dip", price: 80 },
    { id: "coleslaw", label: "Coleslaw", price: 150 },
  ],
  sandwiches: [
    { id: "extra-cheese", label: "Extra cheese", price: 100 },
    { id: "fries-on-the-side", label: "Fries on the side", price: 150 },
  ],
  bbq: [
    { id: "extra-naan", label: "Extra naan", price: 60 },
    { id: "raita", label: "Raita", price: 80 },
  ],
  bowls: [
    { id: "extra-chicken", label: "Extra chicken", price: 250 },
    { id: "avocado", label: "Avocado", price: 200 },
  ],
  "sides-drinks": [],
  combos: [],
};

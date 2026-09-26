import type { Promo } from "@/lib/types";

export const promos: Promo[] = [
  {
    id: "burger-combo",
    title: "Burger Combo",
    kind: "price",
    itemSlug: "grand-combo",
    price: 1490,
    wasPrice: 1830,
    image: "/images/grand-combo.jpg",
  },
  {
    id: "wings-wednesday",
    title: "Wings Wednesday",
    kind: "weekday-percent",
    itemSlug: "fire-wings",
    weekday: 3,
    percent: 20,
    image: "/images/chicken-wings.jpg",
  },
];

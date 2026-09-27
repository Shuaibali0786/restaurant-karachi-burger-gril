import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { categories } from "@/lib/data/categories";
import { menuItems } from "@/lib/data/menu-items";
import { filterMenu } from "@/lib/menu";
import { toView } from "@/lib/menu-view";
import type { CategorySlug, FeaturedPlacement } from "@/lib/types";

// Tests the static catalogue data itself (Phase 2 seed source, see specs/002-restaurant-backend/
// research.md R6), independent of the transport: the live site now reads the same data through the
// API (lib/api.ts → lib/http.ts), which lib/http.test.ts and the backend's seed/parity tests cover.

const views = menuItems.map(toView);
const categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name])) as Record<CategorySlug, string>;
const publicFile = (src: string) => path.join(process.cwd(), "public", src);

const item = (slug: string) => views.find((candidate) => candidate.slug === slug) ?? null;
const items = (query: Parameters<typeof filterMenu>[1] = {}) => filterMenu(views, query, categoryNames);
const featured = (placement: FeaturedPlacement) => filterMenu(views.filter((i) => i.featured.includes(placement)), { sort: "popular" });

describe("menu catalogue", () => {
  it("has 33 items with unique slugs and popularity ranks", () => {
    expect(views).toHaveLength(33);
    expect(new Set(views.map((v) => v.slug)).size).toBe(33);
    expect(new Set(views.map((v) => v.popularity)).size).toBe(33);
  });

  it("only uses our own photos, all of which exist", () => {
    for (const src of [...views.map((v) => v.image), ...categories.map((c) => c.image)]) {
      expect(src.startsWith("/images/"), src).toBe(true);
      expect(fs.existsSync(publicFile(src)), src).toBe(true);
    }
  });

  it("gives every item alt text and a one-line description", () => {
    for (const v of views) {
      expect(v.imageAlt.length, v.slug).toBeGreaterThan(10);
      expect(v.description.length, v.slug).toBeLessThanOrEqual(120);
    }
  });

  it("applies per-item size prices for fried chicken and BBQ", () => {
    expect(item("crispy-bucket")?.options.map((o) => o.priceDelta)).toEqual([0, 1340, 3280]);
    expect(item("grill-mix-platter")?.options.map((o) => o.priceDelta)).toEqual([0, 2060, 5040]);
  });

  it("filters by search and category and sorts by price", () => {
    expect(items({ search: "TIKKA" }).map((i) => i.slug)).toEqual(["grill-mix-platter", "tikka-rice-bowl", "charcoal-chicken-tikka"]);
    expect(items({ category: "bbq", sort: "price-desc" }).map((i) => i.basePrice)).toEqual([2290, 790, 650]);
  });

  it("keeps Bestseller rare (max 3) and features 10 varied Most Loved items", () => {
    expect(views.filter((v) => v.tag === "bestseller").length).toBeLessThanOrEqual(3);
    const mostLoved = featured("most-loved");
    expect(mostLoved).toHaveLength(10);
    expect(new Set(mostLoved.map((v) => v.tag)).size).toBeGreaterThanOrEqual(4);
  });

  it("says what every Meal upgrade includes", () => {
    const meals = views.flatMap((v) => v.options.filter((o) => o.id === "meal"));
    expect(meals.length).toBeGreaterThan(0);
    for (const meal of meals) expect(meal.includes).toBe("Masala Fries + Chilled Cola");
  });

  it("returns null for an unknown slug", () => {
    expect(item("does-not-exist")).toBeNull();
  });

  it("features the three chef's specials", () => {
    expect(
      featured("chef-special")
        .map((v) => v.slug)
        .sort(),
    ).toEqual(["grand-combo", "grill-mix-platter", "loaded-fire-fries"]);
  });
});

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getCategories, getFeaturedItems, getMenuItem, getMenuItems } from "@/lib/api";

const publicFile = (src: string) => path.join(process.cwd(), "public", src);

describe("menu catalogue", () => {
  it("has 33 items with unique slugs and popularity ranks", async () => {
    const items = await getMenuItems();
    expect(items).toHaveLength(33);
    expect(new Set(items.map((item) => item.slug)).size).toBe(33);
    expect(new Set(items.map((item) => item.popularity)).size).toBe(33);
  });

  it("only uses our own photos, all of which exist", async () => {
    const items = await getMenuItems();
    const categories = await getCategories();
    for (const src of [...items.map((i) => i.image), ...categories.map((c) => c.image)]) {
      expect(src.startsWith("/images/"), src).toBe(true);
      expect(fs.existsSync(publicFile(src)), src).toBe(true);
    }
  });

  it("gives every item alt text and a one-line description", async () => {
    for (const item of await getMenuItems()) {
      expect(item.imageAlt.length, item.slug).toBeGreaterThan(10);
      expect(item.description.length, item.slug).toBeLessThanOrEqual(120);
    }
  });

  it("applies per-item size prices for fried chicken and BBQ", async () => {
    const bucket = await getMenuItem("crispy-bucket");
    expect(bucket?.options.map((o) => o.priceDelta)).toEqual([0, 1340, 3280]);
    const platter = await getMenuItem("grill-mix-platter");
    expect(platter?.options.map((o) => o.priceDelta)).toEqual([0, 2060, 5040]);
  });

  it("filters by search and category and sorts by price", async () => {
    const tikka = await getMenuItems({ search: "TIKKA" });
    expect(tikka.map((i) => i.slug)).toEqual(["grill-mix-platter", "tikka-rice-bowl", "charcoal-chicken-tikka"]);

    const bbqDesc = await getMenuItems({ category: "bbq", sort: "price-desc" });
    expect(bbqDesc.map((i) => i.basePrice)).toEqual([2290, 790, 650]);
  });

  it("returns null for an unknown slug", async () => {
    expect(await getMenuItem("does-not-exist")).toBeNull();
  });

  it("features the three chef's specials", async () => {
    const specials = await getFeaturedItems("chef-special");
    expect(specials.map((i) => i.slug).sort()).toEqual(["grand-combo", "grill-mix-platter", "loaded-fire-fries"]);
  });
});

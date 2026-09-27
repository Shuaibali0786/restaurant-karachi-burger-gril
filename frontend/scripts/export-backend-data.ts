/**
 * Exports the frontend's catalogue and pricing behaviour for the backend (ADR-0003).
 *
 *   npm run export:backend-data            writes the files below
 *   npm run export:backend-data -- --check fails if the committed files are out of date
 *
 * Writes (relative to the repository root):
 *   backend/app/seed/data/{menu,promos,areas,sample_testimonials}.json   seed data, so nothing is retyped
 *   backend/tests/fixtures/pricing_golden.json                          what the REAL frontend pricing code
 *                                                                        returns; backend tests must match it
 * Run it from `frontend/`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { categories } from "../src/lib/data/categories";
import { deliveryAreas } from "../src/lib/data/areas";
import { menuItems } from "../src/lib/data/menu-items";
import { promos } from "../src/lib/data/promos";
import { testimonials } from "../src/lib/data/testimonials";
import { toView } from "../src/lib/menu-view";
import {
  activePromoFor,
  cartTotals,
  DELIVERY_FEE,
  FREE_DELIVERY_THRESHOLD,
  promoDiscountPerUnit,
  resolveCart,
  unitPrice,
} from "../src/lib/pricing";
import type { CartLine, MenuItemView } from "../src/lib/types";

const repoRoot = resolve(process.cwd(), "..");
if (!existsSync(resolve(repoRoot, "backend"))) {
  console.error("Run this from the frontend/ folder (backend/ must be next to it).");
  process.exit(2);
}

/** A Wednesday and a Thursday, at noon Pakistan time. */
const DAYS = {
  wednesday: new Date("2026-09-30T12:00:00+05:00"),
  thursday: new Date("2026-10-01T12:00:00+05:00"),
} as const;

const views: MenuItemView[] = menuItems.map(toView);

// ------------------------------------------------------------------ seed data

const menuJson = {
  categories: categories.map((c) => ({
    id: c.id,
    name: c.name,
    image: c.image,
    imageAlt: c.imageAlt,
    order: c.order,
    optionGroupLabel: c.optionGroup.label,
    options: c.optionGroup.options.map((o, index) => ({
      key: o.id,
      label: o.label,
      priceDelta: o.priceDelta,
      includes: o.includes ?? null,
      sortOrder: index + 1,
    })),
    addons: c.addons.map((a, index) => ({ key: a.id, label: a.label, price: a.price, sortOrder: index + 1 })),
  })),
  items: menuItems.map((m) => ({
    slug: m.slug,
    name: m.name,
    category: m.category,
    basePrice: m.basePrice,
    image: m.image,
    imageAlt: m.imageAlt,
    description: m.description,
    tag: m.tag,
    rating: m.rating,
    popularity: m.popularity,
    featured: m.featured,
    optionOverrides: m.optionOverrides ?? {},
  })),
};

const promosJson = promos.map((p) =>
  p.kind === "price"
    ? { id: p.id, title: p.title, kind: p.kind, itemSlug: p.itemSlug, price: p.price, wasPrice: p.wasPrice, image: p.image }
    : { id: p.id, title: p.title, kind: p.kind, itemSlug: p.itemSlug, weekday: p.weekday, percent: p.percent, image: p.image },
);

const areasJson = deliveryAreas.map((a, index) => ({ id: a.id, name: a.name, fee: a.fee, order: index + 1, enabled: true }));

const sampleTestimonialsJson = testimonials.map((t) => ({
  id: t.id,
  name: t.name,
  area: t.area,
  quote: t.quote,
  rating: t.rating,
}));

// ------------------------------------------------------------------ pricing golden file

/** The add-on selections checked for every option: none, each one alone, and all of them. */
function addonSets(item: MenuItemView): string[][] {
  const ids = item.addons.map((a) => a.id);
  return [[], ...ids.map((id) => [id]), ...(ids.length > 1 ? [ids] : [])];
}

const unitPrices = views.flatMap((item) =>
  item.options.flatMap((option) =>
    addonSets(item).map((addons) => {
      const unit = unitPrice(item, option.id, addons);
      const discountPerUnit = Object.fromEntries(
        Object.entries(DAYS).map(([day, when]) => [day, promoDiscountPerUnit(unit, activePromoFor(item.slug, promos, when))]),
      );
      return { item: item.slug, option: option.id, addons, unitPrice: unit, discountPerUnit };
    }),
  ),
);

interface CartCase {
  name: string;
  day: keyof typeof DAYS;
  lines: { item: string; option: string; addons: string[]; quantity: number }[];
}

const firstOption = (item: MenuItemView) => item.options[0]!.id;
const bySlug = new Map(views.map((v) => [v.slug, v]));
const line = (slug: string, quantity = 1, optionId?: string, addons: string[] = []) => {
  const item = bySlug.get(slug);
  if (!item) throw new Error(`Unknown item "${slug}"`);
  return { item: slug, option: optionId ?? firstOption(item), addons, quantity };
};

const cartCases: CartCase[] = [];
const add = (name: string, day: keyof typeof DAYS, lines: CartCase["lines"]) => cartCases.push({ name, day, lines });

add("empty cart", "thursday", []);
add("one cheap item pays delivery", "thursday", [line(views.reduce((a, b) => (a.basePrice <= b.basePrice ? a : b)).slug)]);
for (const qty of [1, 2, 3]) add(`zinger x${qty}`, "thursday", [line("burns-road-zinger", qty)]);
for (const qty of [1, 2, 5]) add(`fire wings x${qty} on Wednesday`, "wednesday", [line("fire-wings", qty)]);
for (const qty of [1, 2, 5]) add(`fire wings x${qty} on Thursday`, "thursday", [line("fire-wings", qty)]);
add("wings and burger on Wednesday", "wednesday", [line("fire-wings", 2), line("burns-road-zinger", 1)]);
add("wings and burger on Thursday", "thursday", [line("fire-wings", 2), line("burns-road-zinger", 1)]);
add("grand combo", "thursday", [line("grand-combo")]);

/** Two single items whose (undiscounted) total is exactly `target`. */
function pairSummingTo(target: number): CartCase["lines"] | null {
  const singles = views.flatMap((item) => item.options.map((o) => ({ item, option: o.id, price: unitPrice(item, o.id, []) })));
  for (const a of singles) {
    for (const b of singles) {
      if (a.item.slug !== b.item.slug && a.price + b.price === target && a.item.slug !== "fire-wings" && b.item.slug !== "fire-wings") {
        return [line(a.item.slug, 1, a.option), line(b.item.slug, 1, b.option)];
      }
    }
  }
  return null;
}

// Every price is a multiple of Rs 10, so the nearest reachable neighbours of the threshold are +/- Rs 10.
for (const target of [FREE_DELIVERY_THRESHOLD - 10, FREE_DELIVERY_THRESHOLD, FREE_DELIVERY_THRESHOLD + 10]) {
  const lines = pairSummingTo(target);
  if (lines) add(`total exactly Rs ${target}`, "thursday", lines);
  else console.warn(`note: no two-item cart sums to Rs ${target}; scenario skipped`);
}

// A Wednesday cart that reaches Rs 1,500 before the wings discount but not after it.
{
  const wings = bySlug.get("fire-wings");
  if (wings) {
    outer: for (const option of wings.options) {
      for (let qty = 1; qty <= 20; qty++) {
        const unit = unitPrice(wings, option.id, []);
        const after = (unit - promoDiscountPerUnit(unit, activePromoFor("fire-wings", promos, DAYS.wednesday))) * qty;
        if (unit * qty >= FREE_DELIVERY_THRESHOLD && after < FREE_DELIVERY_THRESHOLD) {
          add(`wings discount drops the total below Rs ${FREE_DELIVERY_THRESHOLD}`, "wednesday", [line("fire-wings", qty, option.id)]);
          break outer;
        }
      }
    }
  }
}

add("with add-ons", "thursday", [line("burns-road-zinger", 1, "double", ["extra-cheese", "jalapenos"])]);
add("large order", "thursday", [line("burns-road-zinger", 20, "meal"), line("grand-combo", 5)]);

const carts = cartCases.map((c) => {
  const lines: CartLine[] = c.lines.map((l, i) => ({
    key: `case-${i}`,
    itemSlug: l.item,
    optionId: l.option,
    addonIds: l.addons,
    note: "",
    quantity: l.quantity,
    addedAt: DAYS[c.day].toISOString(),
  }));
  const resolved = resolveCart(lines, views, promos, DAYS[c.day]);
  if (resolved.invalidKeys.length > 0) throw new Error(`Cart case "${c.name}" has invalid lines`);
  const totals = cartTotals(resolved.lines);
  return {
    name: c.name,
    day: c.day,
    lines: c.lines,
    expected: { subtotal: totals.subtotal, discount: totals.discount, delivery: totals.delivery, total: totals.total },
  };
});

const goldenJson = {
  note: "Generated by frontend/scripts/export-backend-data.ts from the real frontend pricing code. Do not edit.",
  deliveryFee: DELIVERY_FEE,
  freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
  days: { wednesday: "2026-09-30T12:00:00+05:00", thursday: "2026-10-01T12:00:00+05:00" },
  unitPrices,
  carts,
};

// ------------------------------------------------------------------ write or check

const outputs: Record<string, unknown> = {
  "backend/app/seed/data/menu.json": menuJson,
  "backend/app/seed/data/promos.json": promosJson,
  "backend/app/seed/data/areas.json": areasJson,
  "backend/app/seed/data/sample_testimonials.json": sampleTestimonialsJson,
  "backend/tests/fixtures/pricing_golden.json": goldenJson,
};

const check = process.argv.includes("--check");
const stale: string[] = [];

for (const [relative, data] of Object.entries(outputs)) {
  const target = resolve(repoRoot, relative);
  const text = `${JSON.stringify(data, null, 2)}\n`;
  if (check) {
    const current = existsSync(target) ? readFileSync(target, "utf8").replace(/\r\n/g, "\n") : null;
    if (current !== text) stale.push(relative);
  } else {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, text, "utf8");
    console.log(`wrote ${relative}`);
  }
}

if (check) {
  if (stale.length > 0) {
    console.error(`Backend data is out of date. Run "npm run export:backend-data" and commit:\n  ${stale.join("\n  ")}`);
    process.exit(1);
  }
  console.log("Backend data is up to date.");
} else {
  console.log(`${menuJson.items.length} items, ${menuJson.categories.length} categories, ${areasJson.length} areas, ${unitPrices.length} unit-price cases, ${carts.length} cart cases.`);
}

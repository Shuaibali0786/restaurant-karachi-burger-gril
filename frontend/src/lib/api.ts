/**
 * The single data entry point for screens and components (Constitution IX).
 * Phase 1 reads mock data from `src/lib/data`; Phase 2 swaps these bodies for
 * calls to the FastAPI backend without changing any signature.
 * See specs/001-restaurant-frontend/contracts/frontend-api.md.
 */
import { deliveryAreas } from "@/lib/data/areas";
import { categories } from "@/lib/data/categories";
import { menuItems } from "@/lib/data/menu-items";
import { promos } from "@/lib/data/promos";
import { site } from "@/lib/data/site";
import { testimonials } from "@/lib/data/testimonials";
import { filterMenu } from "@/lib/menu";
import type {
  Category,
  CategorySlug,
  DeliveryAreaOption,
  FeaturedPlacement,
  MenuItem,
  MenuItemView,
  MenuQuery,
  Promo,
  SiteInfo,
  Testimonial,
} from "@/lib/types";

const categoryById = new Map(categories.map((category) => [category.id, category]));

const categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name])) as Record<CategorySlug, string>;

/** Resolves an item's options (with per-item overrides) and add-ons from its category. */
function toView({ optionOverrides, ...item }: MenuItem): MenuItemView {
  const category = categoryById.get(item.category);
  if (!category) throw new Error(`Unknown category "${item.category}" for "${item.slug}"`);

  return {
    ...item,
    options: category.optionGroup.options.map((option) => ({
      ...option,
      priceDelta: optionOverrides?.[option.id] ?? option.priceDelta,
    })),
    addons: category.addons,
  };
}

const views = menuItems.map(toView);

export async function getSiteInfo(): Promise<SiteInfo> {
  return site;
}

export async function getCategories(): Promise<Category[]> {
  return [...categories].sort((a, b) => a.order - b.order);
}

export async function getMenuItems(query: MenuQuery = {}): Promise<MenuItemView[]> {
  return filterMenu(views, query, categoryNames);
}

export async function getMenuItem(slug: string): Promise<MenuItemView | null> {
  return views.find((item) => item.slug === slug) ?? null;
}

export async function getMenuSlugs(): Promise<string[]> {
  return views.map((item) => item.slug);
}

export async function getFeaturedItems(placement: FeaturedPlacement): Promise<MenuItemView[]> {
  return filterMenu(
    views.filter((item) => item.featured.includes(placement)),
    { sort: "popular" },
  );
}

export async function getPromos(): Promise<Promo[]> {
  return promos;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return testimonials;
}

export async function getDeliveryAreas(): Promise<DeliveryAreaOption[]> {
  return deliveryAreas;
}

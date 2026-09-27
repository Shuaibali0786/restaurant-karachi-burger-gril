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
import { ApiError } from "@/lib/api-error";
import { lineKey } from "@/lib/cart";
import { loadOrder, loadOrders, saveOrder } from "@/lib/local-orders";
import { filterMenu, optionSummary } from "@/lib/menu";
import { generateOrderId } from "@/lib/orders";
import { cartTotals, resolveCart } from "@/lib/pricing";
import { normalizePkMobile } from "@/lib/phone";
import { toView } from "@/lib/menu-view";
import type {
  Category,
  CategorySlug,
  DeliveryAreaOption,
  FeaturedPlacement,
  MenuItemView,
  MenuQuery,
  Order,
  PlaceOrderInput,
  Promo,
  SiteInfo,
  Testimonial,
} from "@/lib/types";

const categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name])) as Record<CategorySlug, string>;

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

/** Short, realistic pause so the checkout button's loading state is visible (browser only). */
const MOCK_LATENCY_MS = 700;
const pause = () =>
  typeof window === "undefined" ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

/**
 * Places a Cash-on-Delivery order. Like the future backend, it trusts no prices
 * from the client: every line is re-priced from the menu and today's deals.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  if (input.lines.length === 0) throw new ApiError("EMPTY_CART", "Your cart is empty.");

  const phone = normalizePkMobile(input.customer.phone);
  const area = deliveryAreas.find((a) => a.id === input.delivery.area);
  if (!phone || !area || input.customer.name.trim().length < 2 || input.delivery.address.trim().length < 10) {
    throw new ApiError("VALIDATION_FAILED", "Please check your delivery details.");
  }

  const now = new Date();
  const cart = resolveCart(
    input.lines.map((line) => ({ ...line, key: lineKey(line) })),
    views,
    promos,
    now,
  );
  if (cart.invalidKeys.length > 0) {
    throw new ApiError("UNKNOWN_ITEM", "Some items in your cart are no longer on the menu. Please review your cart.");
  }

  const totals = cartTotals(cart.lines);
  const order: Order = {
    id: generateOrderId(new Set(loadOrders().map((o) => o.id))),
    customer: { name: input.customer.name.trim(), phone },
    delivery: { ...input.delivery, areaName: area.name },
    timing: input.timing,
    payment: "cod",
    lines: cart.lines.map((l) => ({
      itemSlug: l.item.slug,
      name: l.item.name,
      optionId: l.option.id,
      optionLabel: optionSummary(l.option),
      addonIds: l.addons.map((a) => a.id),
      addonLabels: l.addons.map((a) => a.label),
      note: l.line.note,
      quantity: l.line.quantity,
      unitPrice: l.unitPrice,
      discount: l.discountPerUnit * l.line.quantity,
      lineTotal: l.lineTotal,
    })),
    totals: { subtotal: totals.subtotal, discount: totals.discount, delivery: totals.delivery, total: totals.total },
    placedAt: now.toISOString(),
    status: "confirmed",
    statusHistory: [{ status: "confirmed", at: now.toISOString() }],
    viewer: "owner",
  };

  await pause();
  saveOrder(order);
  return order;
}

/** An order placed on this device, or null. */
export async function getOrder(id: string): Promise<Order | null> {
  return loadOrder(id);
}

/** Orders placed on this device, newest first (Track Order page). */
export async function getRecentOrders(): Promise<Order[]> {
  return loadOrders();
}

/*
 * Accounts, contact messages and the newsletter are UI-only in this phase
 * (Constitution IX): nothing is sent or stored. Phase 2 connects the backend.
 */
export async function login(_input: { identifier: string; password: string }): Promise<{ status: "coming-soon" }> {
  await pause();
  return { status: "coming-soon" };
}

export async function signup(_input: { name: string; email: string; phone: string; password: string }): Promise<{ status: "coming-soon" }> {
  await pause();
  return { status: "coming-soon" };
}

export async function sendContactMessage(_input: { name: string; phone: string; email: string; message: string }): Promise<{ status: "received" }> {
  await pause();
  return { status: "received" };
}

export async function subscribeNewsletter(_email: string): Promise<{ status: "subscribed" }> {
  await pause();
  return { status: "subscribed" };
}

/**
 * The single data entry point for screens and components (Constitution IX).
 * Menu, ordering and tracking (this file's `get*`/`placeOrder` functions) now call the FastAPI
 * backend through `lib/http.ts`; accounts and reviews still use mock data until their own phases
 * land. See specs/002-restaurant-backend/contracts/frontend-api.md.
 */
import { site } from "@/lib/data/site";
import { testimonials } from "@/lib/data/testimonials";
import { ApiError } from "@/lib/api-error";
import { request } from "@/lib/http";
import { loadOrder, loadOrders, saveOrder } from "@/lib/local-orders";
import type {
  Category,
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

export async function getSiteInfo(): Promise<SiteInfo> {
  return site;
}

export async function getCategories(): Promise<Category[]> {
  return request<Category[]>("/categories", { cacheable: true });
}

export async function getMenuItems(query: MenuQuery = {}): Promise<MenuItemView[]> {
  return request<MenuItemView[]>("/menu-items", {
    query: { category: query.category, search: query.search, sort: query.sort },
    cacheable: true,
  });
}

export async function getMenuItem(slug: string): Promise<MenuItemView | null> {
  try {
    return await request<MenuItemView>(`/menu-items/${encodeURIComponent(slug)}`, { cacheable: true });
  } catch (error) {
    if (error instanceof ApiError && error.code === "NOT_FOUND") return null;
    throw error;
  }
}

/** Every orderable slug, for `generateStaticParams`. Empty on a build-time API hiccup, never throws. */
export async function getMenuSlugs(): Promise<string[]> {
  try {
    return (await getMenuItems()).map((item) => item.slug);
  } catch {
    return [];
  }
}

export async function getFeaturedItems(placement: FeaturedPlacement): Promise<MenuItemView[]> {
  return request<MenuItemView[]>("/menu-items", { query: { featured: placement, sort: "popular" }, cacheable: true });
}

export async function getPromos(): Promise<Promo[]> {
  return request<Promo[]>("/promos", { cacheable: true });
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return testimonials;
}

export async function getDeliveryAreas(): Promise<DeliveryAreaOption[]> {
  return request<DeliveryAreaOption[]>("/delivery-areas", { cacheable: true });
}

/** Short, realistic pause so the loading state is visible (browser only). Login/signup/contact/newsletter are still UI-only mocks. */
const MOCK_LATENCY_MS = 700;
const pause = () =>
  typeof window === "undefined" ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

/**
 * Places a Cash-on-Delivery order. The server re-prices every line from the menu and today's
 * deals and enforces opening hours, delivery areas and sold-out items — it never trusts a price
 * from this request. `idempotencyKey` should be created once per checkout attempt (the caller
 * reuses the same key on a retry, e.g. after a network error) so a double submission never
 * creates two orders.
 */
export async function placeOrder(input: PlaceOrderInput, opts: { idempotencyKey?: string } = {}): Promise<Order> {
  const idempotencyKey = opts.idempotencyKey ?? crypto.randomUUID();
  const order = await request<Order>("/orders", {
    method: "POST",
    body: input,
    headers: { "Idempotency-Key": idempotencyKey },
  });
  // The device keeps its own copy so a guest (no account yet) can still see their own phone and
  // address on "My orders on this device" — the public API answer alone would mask them.
  saveOrder(order);
  return order;
}

/**
 * The order's live status from the server (research R12: masked for anyone who isn't the account
 * that placed it or an admin). For a guest's own order, this device's saved copy — written at
 * placement — fills back in the phone and address the public answer omits, while the status
 * itself always comes from the server. Falls back to the local copy on a network error, and to
 * `null` for an id this device has never heard of and the server doesn't know either.
 */
export async function getOrder(id: string): Promise<Order | null> {
  const local = loadOrder(id);
  let remote: Order;
  try {
    remote = await request<Order>(`/orders/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && error.code === "NOT_FOUND") return local; // a Phase 1-era, device-only order
    return local ?? Promise.reject(error);
  }

  const merged: Order =
    remote.viewer === "public" && local
      ? { ...remote, customer: local.customer, delivery: { ...remote.delivery, address: local.delivery.address, landmark: local.delivery.landmark } }
      : remote;
  saveOrder(merged); // keeps the locally cached status fresh for the "Orders on this device" list too
  return merged;
}

/** Up to 10 orders placed on this device, newest first, with their current status (Track Order page). */
export async function getRecentOrders(): Promise<Order[]> {
  const ids = loadOrders()
    .slice(0, 10)
    .map((order) => order.id);
  const orders = await Promise.all(ids.map((id) => getOrder(id)));
  return orders.filter((order): order is Order => order !== null);
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

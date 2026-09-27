/**
 * Domain types — the contract shared by the mock data layer (Phase 1) and the
 * FastAPI backend (Phase 2). See specs/001-restaurant-frontend/data-model.md.
 * All money values are integer rupees (PKR).
 */

export type CategorySlug =
  | "burgers"
  | "wraps"
  | "fried-chicken"
  | "sandwiches"
  | "bbq"
  | "bowls"
  | "sides-drinks"
  | "combos";

export interface Option {
  id: string;
  label: string;
  priceDelta: number;
  /** What the option adds, e.g. a Meal's "Masala Fries + Chilled Cola". */
  includes?: string;
}

export interface OptionGroup {
  label: string;
  required: true;
  options: Option[];
}

export interface Addon {
  id: string;
  label: string;
  price: number;
}

export interface Category {
  id: CategorySlug;
  name: string;
  image: string;
  imageAlt: string;
  order: number;
  optionGroup: OptionGroup;
  addons: Addon[];
}

export type ItemTag = "bestseller" | "chef-pick" | "hot" | "new" | "veg";

export type FeaturedPlacement = "most-loved" | "chef-special";

export interface MenuItem {
  slug: string;
  name: string;
  category: CategorySlug;
  basePrice: number;
  image: string;
  imageAlt: string;
  description: string;
  tag: ItemTag | null;
  rating: number;
  popularity: number;
  /** Per-item option price deltas (Fried Chicken and BBQ sizes). */
  optionOverrides?: Record<string, number>;
  featured: FeaturedPlacement[];
}

/** A menu item with its category's options (overrides applied) and add-ons resolved. */
export interface MenuItemView extends Omit<MenuItem, "optionOverrides"> {
  options: Option[];
  addons: Addon[];
  /** Shown on the menu but cannot be ordered (staff marked it sold out). */
  soldOut: boolean;
  /** false = hidden from menu lists; its own page shows "not available". */
  available: boolean;
}

export type MenuSort = "popular" | "price-asc" | "price-desc";

export interface MenuQuery {
  category?: CategorySlug;
  search?: string;
  sort?: MenuSort;
}

export type Promo =
  | {
      id: string;
      title: string;
      kind: "price";
      itemSlug: string;
      price: number;
      wasPrice: number;
      image: string;
    }
  | {
      id: string;
      title: string;
      kind: "weekday-percent";
      itemSlug: string;
      /** 0 = Sunday … 6 = Saturday, evaluated in Pakistan time. */
      weekday: number;
      percent: number;
      image: string;
    };

export interface Testimonial {
  id: string;
  name: string;
  area: string;
  quote: string;
  rating: number;
  /** "2026-09" for real reviews. */
  month?: string;
  /** true until at least 3 real reviews are approved; drives the "Sample reviews" label. */
  isSample: boolean;
}

/** An area slug such as "clifton". Staff can add areas, so this is no longer a fixed union. */
export type DeliveryArea = string;

export interface DeliveryAreaOption {
  id: DeliveryArea;
  name: string;
  /** Delivery fee in rupees for this area. */
  fee: number;
}

export interface CartLine {
  key: string;
  itemSlug: string;
  optionId: string;
  addonIds: string[];
  note: string;
  quantity: number;
  addedAt: string;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  delivery: number;
  total: number;
  freeDeliveryRemaining: number;
}

export type PaymentMethod = "cod" | "card";

export type OrderStatus = "confirmed" | "preparing" | "on-the-way" | "delivered" | "cancelled";

export interface OrderLine {
  itemSlug: string;
  name: string;
  optionId: string;
  optionLabel: string;
  addonIds: string[];
  addonLabels: string[];
  note: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

export type DeliveryTiming = { type: "asap" } | { type: "scheduled"; slot: string };

export interface PlaceOrderInput {
  customer: { name: string; phone: string };
  delivery: { area: DeliveryArea; address: string; landmark?: string; notes?: string };
  timing: DeliveryTiming;
  payment: "cod";
  lines: Array<Pick<CartLine, "itemSlug" | "optionId" | "addonIds" | "note" | "quantity" | "addedAt">>;
}

export type OrderViewer = "public" | "owner" | "admin";

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Order {
  /** KBG- followed by 5 digits, e.g. KBG-10234. */
  id: string;
  /** The phone is masked for the public viewer. */
  customer: { name: string; phone: string };
  /** address and landmark are omitted for the public viewer. */
  delivery: { area: DeliveryArea; areaName: string; address?: string; landmark?: string; notes?: string };
  timing: DeliveryTiming;
  payment: "cod";
  lines: OrderLine[];
  totals: Omit<CartTotals, "freeDeliveryRemaining">;
  placedAt: string;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; at: string }[];
  viewer: OrderViewer;
  /** Present for the owner once they have reviewed the order. */
  review?: { rating: number; status: ReviewStatus };
}

export type UserRole = "customer" | "admin";

export interface SessionUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
}

export interface AdminOrderSummary {
  id: string;
  customerName: string;
  areaName: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  timing: DeliveryTiming;
  placedAt: string;
}

export interface TodaySummary {
  /** YYYY-MM-DD business day (12 noon - 3 AM Pakistan time). */
  businessDate: string;
  /** Orders today, excluding cancelled. */
  orderCount: number;
  /** Sum of order totals in rupees, excluding cancelled. */
  salesTotal: number;
  byStatus: Partial<Record<OrderStatus, number>>;
}

export interface ContactMessage {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminReview {
  id: number;
  orderId: string;
  customerName: string;
  rating: number;
  comment?: string;
  status: ReviewStatus;
  createdAt: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface SocialLink {
  network: "instagram" | "facebook" | "tiktok" | "whatsapp";
  label: string;
  href: string;
}

export interface SiteInfo {
  name: string;
  tagline: string;
  announcement: string;
  address: string;
  hours: string;
  phone: string;
  email: string;
  story: string;
  nav: NavLink[];
  footer: {
    quickLinks: NavLink[];
    support: NavLink[];
  };
  socials: SocialLink[];
}

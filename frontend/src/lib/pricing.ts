import type { Addon, CartLine, CartTotals, MenuItemView, Option, Promo } from "@/lib/types";
import { pktParts } from "@/lib/time";

export const DELIVERY_FEE = 150;
export const FREE_DELIVERY_THRESHOLD = 1500;

/**
 * Unit price in integer rupees: base + chosen option + add-ons.
 * `optionId` may be null before the customer picks (shows the base price).
 * Throws for options/add-ons the item does not offer.
 */
export function unitPrice(item: MenuItemView, optionId: string | null, addonIds: readonly string[]): number {
  let price = item.basePrice;

  if (optionId !== null) {
    const option = item.options.find((o) => o.id === optionId);
    if (!option) throw new Error(`"${item.slug}" has no option "${optionId}"`);
    price += option.priceDelta;
  }

  for (const id of addonIds) {
    const addon = item.addons.find((a) => a.id === id);
    if (!addon) throw new Error(`"${item.slug}" has no add-on "${id}"`);
    price += addon.price;
  }

  return price;
}

export function lineTotal(unit: number, quantity: number): number {
  return unit * quantity;
}

type WeekdayPromo = Extract<Promo, { kind: "weekday-percent" }>;

/** The weekday promo (e.g. Wings Wednesday) running for this item right now, if any. */
export function activePromoFor(itemSlug: string, promos: readonly Promo[], now: Date): WeekdayPromo | null {
  const { weekday } = pktParts(now);
  return (
    promos.find((p): p is WeekdayPromo => p.kind === "weekday-percent" && p.itemSlug === itemSlug && p.weekday === weekday) ??
    null
  );
}

/** Discount per unit, rounded to the nearest rupee. */
export function promoDiscountPerUnit(unit: number, promo: WeekdayPromo | null): number {
  return promo ? Math.round((unit * promo.percent) / 100) : 0;
}

export interface ResolvedLine {
  line: CartLine;
  item: MenuItemView;
  option: Option;
  addons: Addon[];
  unitPrice: number;
  discountPerUnit: number;
  promo: WeekdayPromo | null;
  lineTotal: number;
}

export interface ResolvedCart {
  lines: ResolvedLine[];
  /** Saved lines that no longer match the menu (removed item/option/add-on). */
  invalidKeys: string[];
  /** A line was added while a weekday deal ran, but the deal is over now. */
  promoEnded: boolean;
}

/** Joins saved cart lines with the live menu and today's promos. Prices always come from the menu. */
export function resolveCart(lines: readonly CartLine[], items: readonly MenuItemView[], promos: readonly Promo[], now: Date): ResolvedCart {
  const bySlug = new Map(items.map((item) => [item.slug, item]));
  const resolved: ResolvedLine[] = [];
  const invalidKeys: string[] = [];
  let promoEnded = false;

  for (const line of lines) {
    const item = bySlug.get(line.itemSlug);
    const option = item?.options.find((o) => o.id === line.optionId);
    const addons = line.addonIds.map((id) => item?.addons.find((a) => a.id === id));
    if (!item || !option || addons.some((a) => a === undefined)) {
      invalidKeys.push(line.key);
      continue;
    }

    const unit = unitPrice(item, option.id, line.addonIds);
    const promo = activePromoFor(item.slug, promos, now);
    const discountPerUnit = promoDiscountPerUnit(unit, promo);
    if (!promo && activePromoFor(item.slug, promos, new Date(line.addedAt))) promoEnded = true;

    resolved.push({
      line,
      item,
      option,
      addons: addons as Addon[],
      unitPrice: unit,
      discountPerUnit,
      promo,
      lineTotal: lineTotal(unit - discountPerUnit, line.quantity),
    });
  }

  return { lines: resolved, invalidKeys, promoEnded };
}

/**
 * Subtotal before deals, deal discount, delivery (the chosen area's fee, Rs 150 by default, free
 * when the amount after discount is Rs 1,500 or more) and total.
 */
export function cartTotals(lines: readonly ResolvedLine[], deliveryFee: number = DELIVERY_FEE): CartTotals {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.line.quantity, 0);
  const discount = lines.reduce((sum, l) => sum + l.discountPerUnit * l.line.quantity, 0);
  const afterDiscount = subtotal - discount;
  const delivery = lines.length === 0 || afterDiscount >= FREE_DELIVERY_THRESHOLD ? 0 : deliveryFee;

  return {
    subtotal,
    discount,
    delivery,
    total: afterDiscount + delivery,
    freeDeliveryRemaining: Math.max(0, FREE_DELIVERY_THRESHOLD - afterDiscount),
  };
}

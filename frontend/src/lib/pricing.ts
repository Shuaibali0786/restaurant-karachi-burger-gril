import type { MenuItemView } from "@/lib/types";

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

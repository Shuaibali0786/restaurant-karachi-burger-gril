import type { CartLine } from "@/lib/types";

export const MAX_QUANTITY = 20;
export const MAX_NOTE_LENGTH = 500;

export type CartLineInput = Pick<CartLine, "itemSlug" | "optionId" | "addonIds" | "note" | "quantity">;

/** Identity of a cart line: same item, option, add-ons and note merge into one line. */
export function lineKey({ itemSlug, optionId, addonIds, note }: Omit<CartLineInput, "quantity">): string {
  return [itemSlug, optionId, [...addonIds].sort().join(","), note.trim()].join("|");
}

const clampQuantity = (n: number) => Math.min(MAX_QUANTITY, Math.max(1, Math.floor(n)));

/** Adds a configured item, merging with an identical line (quantity capped at MAX_QUANTITY). */
export function mergeLine(lines: CartLine[], input: CartLineInput, addedAt: string): CartLine[] {
  const note = input.note.trim().slice(0, MAX_NOTE_LENGTH);
  const addonIds = [...input.addonIds].sort();
  const key = lineKey({ ...input, addonIds, note });
  const existing = lines.find((line) => line.key === key);

  if (existing) {
    return lines.map((line) =>
      line.key === key ? { ...line, quantity: clampQuantity(line.quantity + input.quantity) } : line,
    );
  }

  return [...lines, { key, itemSlug: input.itemSlug, optionId: input.optionId, addonIds, note, quantity: clampQuantity(input.quantity), addedAt }];
}

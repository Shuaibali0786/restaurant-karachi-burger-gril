import { beforeEach, describe, expect, it } from "vitest";
import { MAX_QUANTITY } from "@/lib/cart";
import { selectCartCount, useCart } from "@/stores/cart";

const zinger = { itemSlug: "burns-road-zinger", optionId: "single", addonIds: [], note: "", quantity: 1 };

describe("cart store", () => {
  beforeEach(() => useCart.getState().clear());

  it("merges identical items and counts quantities", () => {
    const { add } = useCart.getState();
    add(zinger);
    add({ ...zinger, quantity: 2 });
    add({ ...zinger, note: "extra spicy" });
    const state = useCart.getState();
    expect(state.lines).toHaveLength(2);
    expect(selectCartCount(state)).toBe(4);
  });

  it("updates quantity, caps it, and removes a line when it drops below 1", () => {
    useCart.getState().add(zinger);
    const key = useCart.getState().lines[0]!.key;

    useCart.getState().setQuantity(key, 99);
    expect(useCart.getState().lines[0]?.quantity).toBe(MAX_QUANTITY);

    useCart.getState().setQuantity(key, 0);
    expect(useCart.getState().lines).toHaveLength(0);
  });

  it("removes single lines, several lines, or everything", () => {
    const { add } = useCart.getState();
    add(zinger);
    add({ ...zinger, optionId: "double" });
    add({ ...zinger, optionId: "meal" });
    const [a, b] = useCart.getState().lines.map((l) => l.key);

    useCart.getState().remove(a!);
    expect(useCart.getState().lines).toHaveLength(2);
    useCart.getState().removeMany([b!]);
    expect(useCart.getState().lines).toHaveLength(1);
    useCart.getState().clear();
    expect(useCart.getState().lines).toHaveLength(0);
  });
});

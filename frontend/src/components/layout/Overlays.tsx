"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ITEM_PARAM, useUi } from "@/stores/ui";

const loadItemModal = () => import("@/components/menu/ItemModal");
const loadCartDrawer = () => import("@/components/cart/CartDrawer");

// Code-split: none of this is needed to paint a page.
const ItemModal = dynamic(() => loadItemModal().then((m) => m.ItemModal), { ssr: false });
const CartDrawer = dynamic(() => loadCartDrawer().then((m) => m.CartDrawer), { ssr: false });
const FlyToCart = dynamic(() => import("@/components/cart/FlyToCart").then((m) => m.FlyToCart), { ssr: false });

/**
 * Site-wide overlays (item view, cart drawer, fly-to-cart). When the browser is
 * idle their code is downloaded in advance (no rendering), and each overlay
 * mounts the first time it's opened — then stays mounted for instant reuse.
 */
export function Overlays() {
  const itemOpen = useSearchParams().has(ITEM_PARAM);
  const cartOpen = useUi((state) => state.cartOpen);
  const flying = useUi((state) => state.flight !== null);
  const [usedItem, setUsedItem] = useState(itemOpen);
  const [usedCart, setUsedCart] = useState(cartOpen);

  // Remember once opened so closing animations/focus restore keep working.
  if (itemOpen && !usedItem) setUsedItem(true);
  if (cartOpen && !usedCart) setUsedCart(true);

  useEffect(() => {
    const warm = () => {
      void loadItemModal();
      void loadCartDrawer();
      void import("@/lib/api");
    };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(warm, { timeout: 5000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = globalThis.setTimeout(warm, 3000);
    return () => globalThis.clearTimeout(id);
  }, []);

  return (
    <>
      {usedItem && <ItemModal />}
      {usedCart && <CartDrawer />}
      {flying && <FlyToCart />}
    </>
  );
}

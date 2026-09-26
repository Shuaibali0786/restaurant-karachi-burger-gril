"use client";

import { useCallback } from "react";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/cn";
import { selectCartCount, useCart } from "@/stores/cart";
import { useHydrated } from "@/stores/hydration";
import { useUi } from "@/stores/ui";

/** Navbar bag: opens the cart drawer, is the fly-to-cart target, and bounces when food lands. */
export function CartButton({ className }: { className?: string }) {
  const hydrated = useHydrated();
  const storedCount = useCart(selectCartCount);
  const count = hydrated ? storedCount : 0;
  const openCart = useUi((state) => state.openCart);
  const setCartIcon = useUi((state) => state.setCartIcon);
  const bump = useUi((state) => state.cartBump);
  const iconRef = useCallback((element: HTMLSpanElement | null) => setCartIcon(element), [setCartIcon]);

  return (
    <button
      type="button"
      onClick={openCart}
      aria-haspopup="dialog"
      aria-label={count > 0 ? `Open cart, ${count} ${count === 1 ? "item" : "items"}` : "Open cart, empty"}
      className={cn(
        "relative flex size-11 items-center justify-center rounded-full text-cream-50 transition hover:bg-charcoal-800 hover:text-flame-400",
        className,
      )}
    >
      {/* Re-keyed on every landing so the bounce animation replays. */}
      <span key={bump} ref={iconRef} className={cn("flex", bump > 0 && "animate-badge-pop")}>
        <ShoppingBag aria-hidden="true" className="size-5" />
      </span>
      {count > 0 && (
        <span
          key={`badge-${bump}`}
          className={cn(
            "absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-ember-500 px-1 text-[0.7rem] leading-5 font-extrabold text-charcoal-950",
            bump > 0 && "animate-badge-pop",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

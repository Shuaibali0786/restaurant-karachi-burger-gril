"use client";

import type { ComponentPropsWithoutRef } from "react";
import { openItem } from "@/stores/ui";

type OpenItemButtonProps = { slug: string } & Omit<ComponentPropsWithoutRef<"button">, "onClick" | "type">;

/** Opens the item detail view for `slug` — never adds straight to the cart (Constitution III). */
export function OpenItemButton({ slug, children, ...rest }: OpenItemButtonProps) {
  return (
    <button type="button" onClick={() => openItem(slug)} {...rest}>
      {children}
    </button>
  );
}

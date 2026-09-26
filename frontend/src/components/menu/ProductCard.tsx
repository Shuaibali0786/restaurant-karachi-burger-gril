"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import type { MenuItemView } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useUi } from "@/stores/ui";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { FavouriteButton } from "@/components/menu/FavouriteButton";

interface ProductCardProps {
  item: MenuItemView;
  className?: string;
}

/**
 * Menu card. Selecting the card or "Add +" opens the item detail modal — it
 * never adds straight to the cart (Constitution III).
 */
export function ProductCard({ item, className }: ProductCardProps) {
  const openItem = useUi((state) => state.openItem);
  const open = () => openItem(item.slug);
  const hasPaidOptions = item.options.some((option) => option.priceDelta > 0);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-card bg-white shadow-card ring-1 ring-cream-200 transition duration-300",
        "hover:-translate-y-1.5 hover:shadow-glow hover:ring-ember-500/40 motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-100">
        <Image
          src={item.image}
          alt={item.imageAlt}
          fill
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 95vw"
          className="object-cover transition duration-500 group-hover:scale-110 motion-reduce:group-hover:scale-100"
        />
        {item.tag && <Badge tag={item.tag} className="absolute top-3 left-3 z-10" />}
        <FavouriteButton slug={item.slug} name={item.name} className="absolute top-2 right-2 z-10" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base leading-snug font-extrabold text-ink-900">
          {/* Stretched button: the whole card opens the item, heart and Add stay separately focusable. */}
          <button
            type="button"
            onClick={open}
            className="text-left after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-flame-400"
          >
            {item.name}
          </button>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-600">{item.description}</p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <Price amount={item.basePrice} from={hasPaidOptions} className="text-lg text-ink-900" />
          <button
            type="button"
            onClick={open}
            aria-label={`Add ${item.name}`}
            className="relative z-10 inline-flex min-h-11 items-center gap-1 rounded-full bg-flame-400 px-4 text-sm font-extrabold text-charcoal-950 transition hover:bg-ember-500"
          >
            Add
            <Plus aria-hidden="true" className="size-4" strokeWidth={3} />
          </button>
        </div>
      </div>
    </article>
  );
}

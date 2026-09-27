import Image from "next/image";
import { Plus } from "lucide-react";
import type { MenuItemView, Promo } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { DealPrice } from "@/components/menu/DealPrice";
import { FavouriteButton } from "@/components/menu/FavouriteButton";
import { OpenItemButton } from "@/components/menu/OpenItemButton";

type WeekdayPromo = Extract<Promo, { kind: "weekday-percent" }>;

interface ProductCardProps {
  item: MenuItemView;
  /** A weekday deal on this item (e.g. Wings Wednesday); its price island decides if it's live today. */
  deal?: WeekdayPromo | null;
  /** Load the photo eagerly (first cards above the fold). */
  eager?: boolean;
  className?: string;
}

/**
 * Menu card — rendered on the server. Only the heart, the two "open item"
 * buttons and (for deal items) the price are interactive islands, which keeps
 * hydration light. Selecting the card or "Add +" opens the item view; it never
 * adds straight to the cart (Constitution III).
 */
export function ProductCard({ item, deal, eager, className }: ProductCardProps) {
  const hasPaidOptions = item.options.some((option) => option.priceDelta > 0);
  const soldOut = item.soldOut;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-card bg-white shadow-card ring-1 ring-cream-200 transition duration-300",
        !soldOut && "hover:-translate-y-1.5 hover:shadow-glow hover:ring-ember-500/40 motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-100">
        <Image
          src={item.image}
          alt={item.imageAlt}
          fill
          loading={eager ? "eager" : "lazy"}
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 95vw"
          className={cn(
            "object-cover transition duration-500 group-hover:scale-110 motion-reduce:group-hover:scale-100",
            soldOut && "opacity-60 grayscale-[40%] group-hover:scale-100",
          )}
        />
        {soldOut ? (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-charcoal-950/90 px-2.5 py-1 text-xs font-bold tracking-wide text-cream-50 uppercase">
            Sold out
          </span>
        ) : (
          item.tag && <Badge tag={item.tag} className="absolute top-3 left-3 z-10" />
        )}
        <FavouriteButton slug={item.slug} name={item.name} className="absolute top-2 right-2 z-10" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base leading-snug font-extrabold text-ink-900">
          {/* Stretched button: the whole card opens the item; heart and Add stay separately focusable. */}
          <OpenItemButton
            slug={item.slug}
            className="text-left after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-flame-400"
          >
            {item.name}
          </OpenItemButton>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-600">{item.description}</p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          {deal && !soldOut ? (
            <DealPrice basePrice={item.basePrice} deal={deal} from={hasPaidOptions} />
          ) : (
            <Price amount={item.basePrice} from={hasPaidOptions} className={cn("text-lg text-ink-900", soldOut && "text-ink-600")} />
          )}
          {soldOut ? (
            <span
              role="status"
              aria-label={`${item.name} is sold out`}
              className="relative z-10 inline-flex min-h-11 items-center rounded-full bg-cream-200 px-4 text-sm font-extrabold text-ink-600 ring-1 ring-cream-200"
            >
              Sold out
            </span>
          ) : (
            <OpenItemButton
              slug={item.slug}
              aria-label={`Add ${item.name}`}
              className="relative z-10 inline-flex min-h-11 items-center gap-1 rounded-full bg-flame-400 px-4 text-sm font-extrabold text-charcoal-950 transition hover:bg-ember-500"
            >
              Add
              <Plus aria-hidden="true" className="size-4" strokeWidth={3} />
            </OpenItemButton>
          )}
        </div>
      </div>
    </article>
  );
}

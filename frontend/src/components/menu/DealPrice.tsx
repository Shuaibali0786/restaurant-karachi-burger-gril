"use client";

import type { Promo } from "@/lib/types";
import { promoDiscountPerUnit } from "@/lib/pricing";
import { pktParts } from "@/lib/time";
import { useNow } from "@/hooks/useNow";
import { Price } from "@/components/ui/Price";

type WeekdayPromo = Extract<Promo, { kind: "weekday-percent" }>;

/** Card price for an item with a weekday deal: shows the discount only on the deal day (Pakistan time). */
export function DealPrice({ basePrice, deal, from }: { basePrice: number; deal: WeekdayPromo; from: boolean }) {
  const now = useNow(30_000);
  const live = now !== null && pktParts(now).weekday === deal.weekday;

  return (
    <div>
      {live && (
        <span className="mb-1 inline-block rounded-full bg-ember-500/10 px-2 py-0.5 text-xs font-bold text-ember-700">
          {deal.title} −{deal.percent}%
        </span>
      )}
      <Price
        amount={live ? basePrice - promoDiscountPerUnit(basePrice, deal) : basePrice}
        wasAmount={live ? basePrice : undefined}
        from={from}
        className="text-lg text-ink-900"
      />
    </div>
  );
}

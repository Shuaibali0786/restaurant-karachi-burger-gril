"use client";

import Image from "next/image";
import Link from "next/link";
import { Flame } from "lucide-react";
import type { ResolvedLine } from "@/lib/pricing";
import { cn } from "@/lib/cn";
import { formatRs } from "@/lib/format";
import { optionSummary } from "@/lib/menu";
import { useCart } from "@/stores/cart";
import { QuantityStepper } from "@/components/ui/QuantityStepper";

interface CartLineProps {
  entry: ResolvedLine;
  /** Called before following the item link (e.g. to close the drawer). */
  onNavigate?: () => void;
  size?: "compact" | "roomy";
}

export function CartLine({ entry, onNavigate, size = "compact" }: CartLineProps) {
  const { line, item, option, addons, unitPrice, discountPerUnit, promo, lineTotal } = entry;
  const setQuantity = useCart((state) => state.setQuantity);
  const remove = useCart((state) => state.remove);
  const roomy = size === "roomy";

  return (
    <li className={cn("flex gap-3 py-4 sm:gap-4", roomy && "sm:py-5")}>
      <Link
        href={`/menu/${item.slug}`}
        onClick={onNavigate}
        className={cn("relative shrink-0 overflow-hidden rounded-2xl bg-cream-100", roomy ? "size-20 sm:size-28" : "size-20")}
      >
        <Image src={item.image} alt="" fill sizes={roomy ? "112px" : "80px"} className="object-cover" />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/menu/${item.slug}`} onClick={onNavigate} className="font-extrabold text-ink-900 hover:text-ember-700">
              {item.name}
            </Link>
            <p className="text-sm text-ink-600">
              {optionSummary(option)}
              {addons.length > 0 && <> · + {addons.map((a) => a.label).join(", ")}</>}
            </p>
            {line.note && (
              <p className="mt-0.5 truncate text-sm text-ink-600 italic" title={line.note}>
                “{line.note}”
              </p>
            )}
          </div>
          <p className="shrink-0 text-right font-extrabold text-ink-900 tabular-nums">{formatRs(lineTotal)}</p>
        </div>

        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs font-semibold text-ink-600">
          <span>
            {formatRs(unitPrice - discountPerUnit)} each
            {discountPerUnit > 0 && (
              <s className="ml-1.5 font-medium">
                <span className="sr-only">was </span>
                {formatRs(unitPrice)}
              </s>
            )}
          </span>
          {promo && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ember-500/10 px-2 py-0.5 text-ember-700">
              <Flame aria-hidden="true" className="size-3" />
              {promo.title} −{promo.percent}%
            </span>
          )}
        </p>

        <div className="mt-2 flex items-center justify-between gap-3">
          <QuantityStepper
            value={line.quantity}
            onChange={(q) => setQuantity(line.key, q)}
            onRemove={() => remove(line.key)}
            itemName={item.name}
          />
          <button
            type="button"
            onClick={() => remove(line.key)}
            aria-label={`Remove ${item.name} from cart`}
            className="min-h-11 px-2 text-sm font-bold text-ink-600 underline-offset-4 hover:text-ember-700 hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

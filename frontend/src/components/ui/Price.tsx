import { formatRs } from "@/lib/format";
import { cn } from "@/lib/cn";

interface PriceProps {
  amount: number;
  /** Original price, shown struck through when a promo applies. */
  wasAmount?: number;
  /** Show a small "from" label above the price (item has paid options). */
  from?: boolean;
  className?: string;
}

export function Price({ amount, wasAmount, from, className }: PriceProps) {
  return (
    <span className={cn("inline-flex flex-col leading-tight", className)}>
      {from && <span className="text-xs font-semibold text-ink-600">from</span>}
      <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
        <span className="font-extrabold">{formatRs(amount)}</span>
        {wasAmount !== undefined && wasAmount > amount && (
          <s className="text-sm font-medium text-ink-600">
            <span className="sr-only">was </span>
            {formatRs(wasAmount)}
          </s>
        )}
      </span>
    </span>
  );
}

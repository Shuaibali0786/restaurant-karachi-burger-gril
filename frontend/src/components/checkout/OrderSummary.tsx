import type { CartTotals } from "@/lib/types";
import { formatRs } from "@/lib/format";

export interface SummaryLine {
  key: string;
  name: string;
  optionLabel: string;
  addonLabels: string[];
  note: string;
  quantity: number;
  lineTotal: number;
}

interface OrderSummaryProps {
  lines: SummaryLine[];
  totals: Omit<CartTotals, "freeDeliveryRemaining">;
}

/** Compact line list and totals — used on checkout and on the confirmation page. */
export function OrderSummary({ lines, totals }: OrderSummaryProps) {
  return (
    <div>
      <ul className="divide-y divide-cream-200">
        {lines.map((line) => (
          <li key={line.key} className="flex justify-between gap-3 py-3 text-sm">
            <div className="min-w-0">
              <p className="font-bold text-ink-900">
                <span className="text-ember-700">{line.quantity} ×</span> {line.name}
              </p>
              <p className="text-ink-600">
                {line.optionLabel}
                {line.addonLabels.length > 0 && <> · + {line.addonLabels.join(", ")}</>}
              </p>
              {line.note && <p className="truncate text-ink-600 italic">“{line.note}”</p>}
            </div>
            <p className="shrink-0 font-bold text-ink-900 tabular-nums">{formatRs(line.lineTotal)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-3 space-y-2 border-t border-cream-200 pt-3 text-sm">
        <div className="flex justify-between text-ink-600">
          <dt>Subtotal</dt>
          <dd className="font-semibold text-ink-900 tabular-nums">{formatRs(totals.subtotal)}</dd>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-ember-700">
            <dt className="font-semibold">Wings Wednesday</dt>
            <dd className="font-bold tabular-nums">−{formatRs(totals.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between text-ink-600">
          <dt>Delivery</dt>
          <dd className="font-semibold text-ink-900 tabular-nums">
            {totals.delivery === 0 ? <span className="text-ember-700">Free</span> : formatRs(totals.delivery)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-cream-200 pt-3">
          <dt className="text-base font-extrabold text-ink-900">Total</dt>
          <dd className="text-2xl font-black text-ink-900 tabular-nums">{formatRs(totals.total)}</dd>
        </div>
      </dl>
    </div>
  );
}

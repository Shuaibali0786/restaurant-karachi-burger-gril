import { Receipt, Wallet } from "lucide-react";
import { formatRs } from "@/lib/format";
import type { TodaySummary } from "@/lib/types";

export function TodayStats({ summary }: { summary: TodaySummary | null }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <div className="flex items-center gap-3 rounded-card bg-white p-4 shadow-card ring-1 ring-cream-200 sm:p-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ember-500/10 text-ember-700">
          <Receipt aria-hidden="true" className="size-5" />
        </span>
        <div>
          <p className="text-xs font-bold tracking-wide text-ink-600 uppercase">Today&apos;s orders</p>
          <p className="font-display text-2xl font-black text-ink-900 tabular-nums">{summary ? summary.orderCount : "—"}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-card bg-white p-4 shadow-card ring-1 ring-cream-200 sm:p-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ember-500/10 text-ember-700">
          <Wallet aria-hidden="true" className="size-5" />
        </span>
        <div>
          <p className="text-xs font-bold tracking-wide text-ink-600 uppercase">Today&apos;s sales</p>
          <p className="font-display text-2xl font-black text-ink-900 tabular-nums">{summary ? formatRs(summary.salesTotal) : "—"}</p>
        </div>
      </div>
    </div>
  );
}

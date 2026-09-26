"use client";

import { Clock3 } from "lucide-react";
import { cn } from "@/lib/cn";
import { isOpenNow, pktParts } from "@/lib/time";
import { useNow } from "@/hooks/useNow";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Opening hours with today highlighted and a live Open/Closed pill (Pakistan time). */
export function OpeningHours({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  const now = useNow(60_000);
  // Before 3 AM we're still serving the previous day's late-night shift.
  const today = now ? (pktParts(now).weekday + (pktParts(now).hours < 3 ? 6 : 0)) % 7 : null;
  const open = now ? isOpenNow(now) : null;
  const dark = tone === "dark";

  return (
    <div className={cn("rounded-card p-5 sm:p-6", dark ? "bg-charcoal-900 text-cream-50 ring-1 ring-charcoal-700" : "bg-white shadow-card ring-1 ring-cream-200", className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className={cn("flex items-center gap-2 text-xl font-extrabold", dark ? "text-cream-50" : "text-ink-900")}>
          <Clock3 aria-hidden="true" className={cn("size-5", dark ? "text-flame-400" : "text-ember-700")} />
          Opening hours
        </h2>
        {open !== null && (
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-extrabold",
              open ? "bg-flame-400 text-charcoal-950" : dark ? "bg-charcoal-700 text-sand-300" : "bg-cream-100 text-ink-600 ring-1 ring-cream-200",
            )}
          >
            {open ? "Open now" : "Closed · opens 12 noon"}
          </span>
        )}
      </div>
      <table className="w-full text-sm">
        <caption className="sr-only">Opening hours, Pakistan time</caption>
        <tbody>
          {WEEK_ORDER.map((day) => {
            const isToday = day === today;
            return (
              <tr
                key={day}
                aria-current={isToday ? "date" : undefined}
                className={cn(isToday && (dark ? "bg-charcoal-800 font-bold text-flame-400" : "bg-cream-100 font-bold text-ink-900"))}
              >
                <th scope="row" className="rounded-l-lg px-3 py-2 text-left font-semibold">
                  {DAYS[day]}
                  {isToday && <span className="ml-2 text-xs font-bold">(today)</span>}
                </th>
                <td className="rounded-r-lg px-3 py-2 text-right tabular-nums">12:00 PM – 3:00 AM</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

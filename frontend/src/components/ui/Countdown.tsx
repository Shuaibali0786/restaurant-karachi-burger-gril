"use client";

import { splitDuration, wingsWednesdayCountdown } from "@/lib/time";
import { cn } from "@/lib/cn";
import { useNow } from "@/hooks/useNow";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Live Wings Wednesday countdown in Pakistan time: "Ends in" on Wednesdays,
 * otherwise "Starts in". Shows a stable placeholder until mounted.
 */
export function WingsCountdown({ className }: { className?: string }) {
  const now = useNow(1000);
  const countdown = now ? wingsWednesdayCountdown(now) : null;
  const parts = countdown ? splitDuration(countdown.ms) : null;

  const units = parts
    ? [
        ...(parts.days > 0 ? [{ label: "Days", value: String(parts.days) }] : []),
        { label: "Hrs", value: pad(parts.hours) },
        { label: "Min", value: pad(parts.minutes) },
        { label: "Sec", value: pad(parts.seconds) },
      ]
    : [
        { label: "Hrs", value: "--" },
        { label: "Min", value: "--" },
        { label: "Sec", value: "--" },
      ];

  const summary = parts
    ? `${countdown?.mode === "ends" ? "Ends in" : "Starts in"} ${parts.days ? `${parts.days} days ` : ""}${parts.hours} hours ${parts.minutes} minutes`
    : "Countdown loading";

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <p className="text-xs font-bold tracking-widest text-sand-300 uppercase">
        {countdown?.mode === "starts" ? "Starts in" : "Ends in"}
      </p>
      <div role="timer" aria-label={summary} className="flex gap-1.5">
        {units.map((unit) => (
          <span
            key={unit.label}
            aria-hidden="true"
            className="flex min-w-12 flex-col items-center rounded-lg bg-charcoal-950/80 px-2 py-1.5 ring-1 ring-charcoal-600"
          >
            <span className="font-display text-2xl leading-none font-black text-flame-400 tabular-nums">{unit.value}</span>
            <span className="text-[0.65rem] font-bold tracking-wider text-sand-300 uppercase">{unit.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

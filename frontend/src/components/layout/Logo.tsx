import Link from "next/link";
import { useId } from "react";
import { FLAME_INNER_PATH, FLAME_OUTER_PATH, FLAME_VIEWBOX } from "@/lib/brand";
import { cn } from "@/lib/cn";

/** Glowing flame rising from hot coals — the brand mark. */
export function FlameMark({ className }: { className?: string }) {
  const id = useId();
  const outer = `${id}-outer`;
  const inner = `${id}-inner`;
  const glow = `${id}-glow`;

  return (
    <svg viewBox={FLAME_VIEWBOX} aria-hidden="true" focusable="false" className={className}>
      <defs>
        <linearGradient id={outer} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--color-ember-600)" />
          <stop offset="55%" stopColor="var(--color-ember-500)" />
          <stop offset="100%" stopColor="var(--color-flame-400)" />
        </linearGradient>
        <linearGradient id={inner} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--color-flame-400)" />
          <stop offset="100%" stopColor="var(--color-cream-50)" />
        </linearGradient>
        <radialGradient id={glow} cx="50%" cy="85%" r="55%">
          <stop offset="0%" stopColor="var(--color-ember-500)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--color-ember-500)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* heat glow */}
      <ellipse cx="24" cy="46" rx="24" ry="12" fill={`url(#${glow})`} />
      {/* outer flame */}
      <path
        d={FLAME_OUTER_PATH}
        fill={`url(#${outer})`}
      />
      {/* inner flame */}
      <path
        d={FLAME_INNER_PATH}
        fill={`url(#${inner})`}
      />
      {/* coals */}
      <rect x="6" y="49" width="14" height="6" rx="3" fill="var(--color-charcoal-700)" />
      <rect x="17" y="50" width="14" height="6" rx="3" fill="var(--color-charcoal-600)" />
      <rect x="28" y="49" width="14" height="6" rx="3" fill="var(--color-charcoal-700)" />
      <rect x="10" y="50.5" width="6" height="1.6" rx=".8" fill="var(--color-ember-500)" />
      <rect x="21" y="51.5" width="6" height="1.6" rx=".8" fill="var(--color-flame-400)" />
      <rect x="32" y="50.5" width="6" height="1.6" rx=".8" fill="var(--color-ember-500)" />
    </svg>
  );
}

interface LogoProps {
  /** `light` = cream text for dark backgrounds; `dark` = ink text for light backgrounds. */
  tone?: "light" | "dark";
  className?: string;
  onClick?: () => void;
}

export function Logo({ tone = "light", className, onClick }: LogoProps) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="Karachi Burger & Grill — home"
      className={cn("group inline-flex min-h-11 items-center gap-2.5", className)}
    >
      <FlameMark className="h-11 w-auto shrink-0 drop-shadow-[0_0_10px_rgb(255_90_31/0.55)] transition group-hover:drop-shadow-[0_0_16px_rgb(255_176_32/0.75)]" />
      <span className="flex flex-col leading-none whitespace-nowrap">
        <span
          className={cn(
            "font-display text-[1.7rem] font-black tracking-wide",
            tone === "light" ? "text-cream-50" : "text-ink-900",
          )}
        >
          Karachi
        </span>
        <span
          className={cn(
            "font-display mt-0.5 text-[0.7rem] font-bold tracking-[0.28em]",
            tone === "light" ? "text-flame-400" : "text-ember-700",
          )}
        >
          Burger &amp; Grill
        </span>
      </span>
    </Link>
  );
}

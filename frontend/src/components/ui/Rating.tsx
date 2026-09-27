import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

// One star shape, repeated by CSS (a mask) — far lighter than ten inline SVGs per rating.
const STAR_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z'/%3E%3C/svg%3E\")";

const starsStyle = {
  maskImage: STAR_MASK,
  maskSize: "0.875rem 0.875rem",
  maskRepeat: "repeat-x",
  WebkitMaskImage: STAR_MASK,
  WebkitMaskSize: "0.875rem 0.875rem",
  WebkitMaskRepeat: "repeat-x",
} satisfies CSSProperties;

/** Five stars with a partial fill plus the value — never a review count (Constitution X). */
export function Rating({ value, className }: { value: number; className?: string }) {
  return (
    <span role="img" className={cn("inline-flex items-center gap-1.5", className)} aria-label={`Rated ${value} out of 5`}>
      <span aria-hidden="true" className="relative block h-3.5 w-[4.375rem] bg-cream-200" style={starsStyle}>
        <span className="absolute inset-y-0 left-0 bg-flame-400" style={{ width: `${(value / 5) * 100}%` }} />
      </span>
      <span aria-hidden="true" className="text-xs font-semibold text-ink-600">
        ({value.toFixed(1)})
      </span>
    </span>
  );
}

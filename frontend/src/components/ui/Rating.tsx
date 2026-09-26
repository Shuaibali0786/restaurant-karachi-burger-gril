import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

/** Five stars with a partial fill plus the value — never a review count (Constitution X). */
export function Rating({ value, className }: { value: number; className?: string }) {
  const percent = `${(value / 5) * 100}%`;
  const stars = Array.from({ length: 5 }, (_, i) => (
    <Star key={i} aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={0} fill="currentColor" />
  ));

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} aria-label={`Rated ${value} out of 5`}>
      <span className="relative inline-flex" aria-hidden="true">
        <span className="flex text-cream-200">{stars}</span>
        <span className="absolute inset-0 flex overflow-hidden text-flame-400" style={{ width: percent }}>
          {stars}
        </span>
      </span>
      <span aria-hidden="true" className="text-xs font-semibold text-ink-600">
        ({value.toFixed(1)})
      </span>
    </span>
  );
}

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface RevealProps {
  children: ReactNode;
  /** Delay in seconds. */
  delay?: number;
  className?: string;
}

/**
 * Page-load reveal (Constitution IV). Pure CSS so the content is in the server
 * HTML and visible without JavaScript; runs once on load (never on scroll) and
 * is disabled by the global prefers-reduced-motion rule.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const style = { animationDelay: `${delay}s` } satisfies CSSProperties;
  return (
    <div className={cn("animate-reveal-up", className)} style={style}>
      {children}
    </div>
  );
}

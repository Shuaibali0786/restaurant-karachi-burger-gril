"use client";

import { useEffect, useState, type ReactNode } from "react";

// Flips to true after the first page has hydrated (never on the server).
let hasHydrated = false;

/**
 * Re-mounts on every navigation, so each new page fades up into place — a
 * CSS-only page transition. The very first page load is not animated, so the
 * hero paints immediately (good LCP). Reduced motion turns it off in globals.css.
 */
export default function Template({ children }: { children: ReactNode }) {
  const [animate] = useState(() => hasHydrated);

  useEffect(() => {
    hasHydrated = true;
  }, []);

  return <div className={animate ? "animate-page-in" : undefined}>{children}</div>;
}

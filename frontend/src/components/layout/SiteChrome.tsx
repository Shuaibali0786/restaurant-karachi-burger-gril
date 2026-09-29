"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { SiteInfo } from "@/lib/types";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SkipLink } from "@/components/layout/SkipLink";
import { Overlays } from "@/components/layout/Overlays";

/**
 * The customer site's chrome (announcement bar, nav, footer, cart/item overlays) — everywhere
 * except `/admin/*`, which has its own shell (AdminShell) and no customer nav, cart or footer.
 * A single root layout keeps `<html>`/`<body>`/`Providers`/`Toaster` shared (see Next's "multiple
 * root layouts" pattern, which would need moving every existing route into a route group — far
 * more than this needs); this client-side check is the smallest change that keeps both correct.
 */
export function SiteChrome({ site, children }: { site: SiteInfo; children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return <>{children}</>;

  return (
    <>
      <SkipLink />
      <AnnouncementBar text={site.announcement} demoNotice={site.demoNotice} />
      <Navbar links={site.nav} hours={site.hours} />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer site={site} />
      {/* Item view, cart drawer and fly-to-cart load on demand; reads ?item=, so it sits in Suspense. */}
      <Suspense fallback={null}>
        <Overlays />
      </Suspense>
    </>
  );
}

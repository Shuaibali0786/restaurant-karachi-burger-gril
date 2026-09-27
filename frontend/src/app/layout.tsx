import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { fontVariables } from "./fonts";
import { Providers } from "./providers";
import { getPromos, getSiteInfo } from "@/lib/api";
import { siteUrl } from "@/lib/site-url";
import type { Promo } from "@/lib/types";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  // Absolute base for Open Graph image URLs; set NEXT_PUBLIC_SITE_URL when deploying.
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Karachi Burger & Grill · Karachi ka asli zaiqa",
    template: "%s · Karachi Burger & Grill",
  },
  description:
    "Charcoal-grilled burgers, crispy fried chicken and Burns Road BBQ. Order online from Karachi Burger & Grill — open daily 12 noon to 3 AM.",
  applicationName: "Karachi Burger & Grill",
  openGraph: {
    type: "website",
    siteName: "Karachi Burger & Grill",
    locale: "en_PK",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0d0a08",
  // Lets sticky bottom bars use env(safe-area-inset-bottom) on notched phones.
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  // Promos come from the backend; every page renders through this layout, so an unreachable API must
  // never take the whole site down (research R10) — the Wings Wednesday banner just stays off.
  const [site, promos]: [Awaited<ReturnType<typeof getSiteInfo>>, Promo[]] = await Promise.all([
    getSiteInfo(),
    getPromos().catch(() => []),
  ]);

  return (
    <html lang="en" className={fontVariables}>
      <body className="flex min-h-dvh flex-col">
        <Providers promos={promos}>
          <SiteChrome site={site}>{children}</SiteChrome>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Suspense, type ReactNode } from "react";
import "./globals.css";
import { fontVariables } from "./fonts";
import { Providers } from "./providers";
import { getMenuItems, getPromos, getSiteInfo } from "@/lib/api";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SkipLink } from "@/components/layout/SkipLink";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FlyToCart } from "@/components/cart/FlyToCart";
import { ItemModal } from "@/components/menu/ItemModal";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  // Absolute base for Open Graph image URLs; set NEXT_PUBLIC_SITE_URL when deploying.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Karachi Burger & Grill · Karachi ka asli zaiqa",
    template: "%s · Karachi Burger & Grill",
  },
  description:
    "Charcoal-grilled burgers, crispy fried chicken and Burns Road BBQ. Order online from Karachi Burger & Grill — open daily 12 noon to 3 AM.",
};

export const viewport: Viewport = {
  themeColor: "#0d0a08",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const [site, items, promos] = await Promise.all([getSiteInfo(), getMenuItems(), getPromos()]);

  return (
    <html lang="en" className={fontVariables}>
      <body className="flex min-h-dvh flex-col">
        <Providers promos={promos}>
          <SkipLink />
          <AnnouncementBar text={site.announcement} />
          <Navbar links={site.nav} hours={site.hours} />
          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <Footer site={site} />
          {/* Reads ?item= from the URL, so it must sit inside Suspense for static pages. */}
          <Suspense fallback={null}>
            <ItemModal items={items} />
          </Suspense>
          <CartDrawer items={items} />
          <FlyToCart />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

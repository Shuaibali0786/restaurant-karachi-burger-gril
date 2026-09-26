import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { fontVariables } from "./fonts";
import { Providers } from "./providers";
import { getSiteInfo } from "@/lib/api";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SkipLink } from "@/components/layout/SkipLink";

export const metadata: Metadata = {
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
  const site = await getSiteInfo();

  return (
    <html lang="en" className={fontVariables}>
      <body className="flex min-h-dvh flex-col">
        <Providers>
          <SkipLink />
          <AnnouncementBar text={site.announcement} />
          <Navbar links={site.nav} hours={site.hours} />
          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <Footer site={site} />
        </Providers>
      </body>
    </html>
  );
}

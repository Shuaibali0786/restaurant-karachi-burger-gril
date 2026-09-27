import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Personal, per-device pages carry no search value.
      disallow: ["/cart", "/checkout", "/order/", "/track", "/favourites", "/login", "/signup"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}

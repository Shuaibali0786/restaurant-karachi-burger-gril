import type { MetadataRoute } from "next";
import { getMenuSlugs } from "@/lib/api";
import { siteUrl } from "@/lib/site-url";

/** Public, indexable pages plus every menu item page. Cart, checkout, orders and accounts are excluded. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const pages: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
    { path: "", priority: 1, changeFrequency: "daily" },
    { path: "/menu", priority: 0.9, changeFrequency: "daily" },
    { path: "/combos", priority: 0.8, changeFrequency: "weekly" },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.5, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  ];
  const slugs = await getMenuSlugs();

  return [
    ...pages.map(({ path, priority, changeFrequency }) => ({ url: `${base}${path}`, priority, changeFrequency })),
    ...slugs.map((slug) => ({ url: `${base}/menu/${slug}`, priority: 0.7, changeFrequency: "weekly" as const })),
  ];
}

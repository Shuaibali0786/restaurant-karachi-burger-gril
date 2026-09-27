/** Public site origin for absolute URLs (share images, sitemap). Set NEXT_PUBLIC_SITE_URL when deploying. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

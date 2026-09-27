import type { NextConfig } from "next";

/** Where the FastAPI backend runs. Only used server-side, by the rewrite below and by Server Components. */
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // Required allowlist since Next.js 16.
    qualities: [75, 85],
    // Only our own photos in public/images may be optimised (Constitution I).
    localPatterns: [{ pathname: "/images/**" }],
  },
  /**
   * Same-origin API proxy (ADR-0002). The browser calls /api/v1/... on THIS site and Next.js forwards it
   * to the backend, so the httpOnly SameSite=Lax session cookie stays first-party. Calling a backend on
   * another site directly would make browsers drop the cookie.
   */
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;

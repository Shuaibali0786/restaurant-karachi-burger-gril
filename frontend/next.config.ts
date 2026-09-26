import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // Required allowlist since Next.js 16.
    qualities: [75, 85],
    // Only our own photos in public/images may be optimised (Constitution I).
    localPatterns: [{ pathname: "/images/**" }],
  },
};

export default nextConfig;

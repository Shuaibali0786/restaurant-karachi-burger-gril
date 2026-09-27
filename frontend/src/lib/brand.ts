/** Brand mark geometry (viewBox 0 0 48 56), shared by the Logo, share image and app icons. */
export const FLAME_VIEWBOX = "0 0 48 56";

export const FLAME_OUTER_PATH =
  "M24 2c2 7 9 11 11 19 1.6 6.4-.6 11 2.6 13.4.3-3.5 1.7-5.6 3.9-7.2C44 34 42 44 34 48.5 30.9 50.2 27.5 51 24 51s-6.9-.8-10-2.5C6 44 4 34 6.5 27.2c2.2 1.6 3.6 3.7 3.9 7.2C13.6 32 10.6 26 15 18 17.8 12.9 22.4 9.3 24 2Z";

export const FLAME_INNER_PATH =
  "M24 21c1.2 4.4 6.4 7.3 6.4 13.6 0 5-2.9 8.9-6.4 8.9s-6.4-3.9-6.4-8.9c0-3.5 1.8-5 3.2-7 .5 2.1 1.3 3.1 2.4 3.6-.3-3.8-.4-6.8.8-10.2Z";

/** Brand colours as literal values — only for generated images, which can't read CSS tokens. */
export const BRAND_HEX = {
  charcoal950: "#0d0a08",
  charcoal700: "#2e241d",
  ember600: "#e8480f",
  ember500: "#ff5a1f",
  flame400: "#ffb020",
  cream50: "#fbf5ec",
  sand300: "#d6c6b3",
} as const;

/** Self-contained flame SVG as a data URI (for next/og ImageResponse). */
export function flameSvgDataUri(): string {
  const { ember600, ember500, flame400, cream50, charcoal700 } = BRAND_HEX;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${FLAME_VIEWBOX}"><defs><linearGradient id="o" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${ember600}"/><stop offset=".55" stop-color="${ember500}"/><stop offset="1" stop-color="${flame400}"/></linearGradient><linearGradient id="i" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${flame400}"/><stop offset="1" stop-color="${cream50}"/></linearGradient></defs><path d="${FLAME_OUTER_PATH}" fill="url(#o)"/><path d="${FLAME_INNER_PATH}" fill="url(#i)"/><rect x="6" y="49" width="36" height="6" rx="3" fill="${charcoal700}"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

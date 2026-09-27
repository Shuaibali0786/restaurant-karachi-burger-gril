import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BRAND_HEX, flameSvgDataUri } from "@/lib/brand";

export const alt = "Karachi Burger & Grill — Karachi ka asli zaiqa. Charcoal-grilled burgers, fried chicken and Burns Road BBQ.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default share image for every page (item pages override it with their own photo). */
export default async function OpenGraphImage() {
  const photo = await readFile(join(process.cwd(), "public/images/grand-combo.jpg"));
  const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;
  const { charcoal950, ember500, flame400, cream50, sand300 } = BRAND_HEX;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: charcoal950, position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img only */}
        <img src={photoSrc} alt="" width={760} height={507} style={{ position: "absolute", right: -60, top: 80, width: 760, height: 507, objectFit: "cover" }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: `linear-gradient(90deg, ${charcoal950} 38%, rgba(13,10,8,0.6) 62%, rgba(13,10,8,0) 100%)`,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 72px", position: "relative", width: 700 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img only */}
            <img src={flameSvgDataUri()} alt="" width={84} height={98} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 76, fontWeight: 900, color: cream50, letterSpacing: 2, lineHeight: 1 }}>KARACHI</span>
              <span style={{ fontSize: 26, fontWeight: 700, color: flame400, letterSpacing: 10 }}>BURGER &amp; GRILL</span>
            </div>
          </div>
          <span style={{ marginTop: 36, fontSize: 44, fontWeight: 800, color: ember500 }}>Karachi ka asli zaiqa</span>
          <span style={{ marginTop: 12, fontSize: 28, color: sand300, lineHeight: 1.35 }}>
            Charcoal-grilled burgers, crispy fried chicken and Burns Road BBQ. Order online · open 12 noon – 3 AM.
          </span>
        </div>
      </div>
    ),
    size,
  );
}

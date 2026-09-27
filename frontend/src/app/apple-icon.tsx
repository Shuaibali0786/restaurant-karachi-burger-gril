import { ImageResponse } from "next/og";
import { BRAND_HEX, flameSvgDataUri } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the flame mark on charcoal. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: BRAND_HEX.charcoal950 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img only */}
        <img src={flameSvgDataUri()} alt="" width={108} height={126} />
      </div>
    ),
    size,
  );
}

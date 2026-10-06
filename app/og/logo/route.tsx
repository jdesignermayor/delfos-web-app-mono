import { ImageResponse } from "next/og";

import { BRAND_COLOR } from "@/lib/site";

/** 512 × 512 PNG logo for the Organization structured data (Google wants a raster logo ≥ 112 px). */
export function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>
        <svg width="400" height="400" viewBox="0 0 24 24" fill="none">
          <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" fill={`${BRAND_COLOR}26`} stroke={BRAND_COLOR} strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M8 14.5 11 9l2.5 4L16 10" stroke={BRAND_COLOR} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { width: 512, height: 512, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable" } },
  );
}

import { ImageResponse } from "next/og";

import { PROPERTIES_CACHE_TAG } from "@/lib/cache-tags";
import { BRAND_COLOR, SITE_NAME } from "@/lib/site";
import { createPublicClient } from "@/supabase/public";

const SIZE = { width: 1200, height: 630 };

/** Live numbers for the card; omitted when the database can't be reached. */
async function stats() {
  const { data } = await createPublicClient({ revalidate: 3600, tags: [PROPERTIES_CACHE_TAG] })
    .from("properties")
    .select("developer_id");
  if (!data?.length) return null;
  return { projects: data.length, developers: new Set(data.map((row) => row.developer_id).filter(Boolean)).size };
}

/**
 * The landing's share image (Facebook, WhatsApp, LinkedIn, X): brand, the
 * value proposition and live counts. A route rather than the `opengraph-image`
 * file convention, which would override every property page's own image.
 */
export async function GET() {
  const numbers = await stats();
  const chips = numbers
    ? [`${numbers.projects} proyectos`, `${numbers.developers} constructoras`, "Medellín y Valle de Aburrá"]
    : ["Proyectos sobre planos", "Medellín y Valle de Aburrá"];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #ffffff 0%, #eef6ff 55%, #d9ebff 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
            <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" fill={`${BRAND_COLOR}26`} stroke={BRAND_COLOR} strokeWidth="1.75" strokeLinejoin="round" />
            <path d="M8 14.5 11 9l2.5 4L16 10" stroke={BRAND_COLOR} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 44, fontWeight: 700, color: "#0f172a" }}>{SITE_NAME}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 68, fontWeight: 800, color: "#0f172a", lineHeight: 1.05, letterSpacing: -1.5 }}>
            Vivienda nueva en Medellín
          </span>
          <span style={{ fontSize: 32, color: "#475569", lineHeight: 1.3 }}>
            Compara proyectos, precios, tipologías y fechas de entrega.
          </span>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {chips.map((chip) => (
            <span
              key={chip}
              style={{
                display: "flex",
                padding: "12px 24px",
                borderRadius: 999,
                background: "#ffffff",
                border: `2px solid ${BRAND_COLOR}33`,
                color: "#0f172a",
                fontSize: 26,
                fontWeight: 600,
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    ),
    {
      ...SIZE,
      // Social crawlers fetch this often; let CDNs keep it for a day.
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400" },
    },
  );
}

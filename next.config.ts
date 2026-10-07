import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  // Render <title>, description, Open Graph, canonical, etc. inside <head> for
  // every visitor and crawler, instead of streaming them into <body> after the
  // page (Next's default for browsers and Googlebot). Metadata here comes from
  // cached queries, so the extra wait before the first byte is minimal.
  htmlLimitedBots: /.*/,
  images: {
    // 75 is Next's default (public pages); 40 is for dashboard previews,
    // which only need to be recognizable. Keep in sync with
    // `DASHBOARD_IMAGE_QUALITY`.
    qualities: [40, 75],
    // Uploaded photos get unique, never-reused names (`…-<uuid>.webp`), so an
    // optimized copy never goes stale: keep it 31 days instead of re-fetching
    // the original from Supabase and re-encoding it every few hours.
    minimumCacheTTL: 2_678_400,
    // Property photos are served from the public Supabase storage bucket.
    remotePatterns: supabaseUrl ? [new URL(`${supabaseUrl}/storage/v1/object/public/**`)] : [],
  },
  // Loads libheif's WASM at runtime; bundling it breaks the decoder.
  serverExternalPackages: ["heic-decode", "libheif-js"],
  experimental: {
    // Keep visited dynamic pages (the dashboard) in the client router cache for
    // 30 s, so going back and forth between sections is instant instead of a
    // server round trip each time. Every dashboard mutation calls
    // revalidatePath/revalidateTag/updateTag, which clears this cache.
    staleTimes: {
      dynamic: 30,
    },
    serverActions: {
      // Property photos are uploaded one per request (see `uploadPropertyImage`);
      // phone JPEG/HEIC originals regularly exceed the 1 MB default.
      bodySizeLimit: "21mb",
    },
  },
};

export default nextConfig;

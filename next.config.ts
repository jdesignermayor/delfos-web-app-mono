import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  // Render <title>, description, Open Graph, canonical, etc. inside <head> for
  // every visitor and crawler, instead of streaming them into <body> after the
  // page (Next's default for browsers and Googlebot). Metadata here comes from
  // cached queries, so the extra wait before the first byte is minimal.
  htmlLimitedBots: /.*/,
  images: {
    // Property photos are served from the public Supabase storage bucket.
    remotePatterns: supabaseUrl ? [new URL(`${supabaseUrl}/storage/v1/object/public/**`)] : [],
  },
  // Loads libheif's WASM at runtime; bundling it breaks the decoder.
  serverExternalPackages: ["heic-decode", "libheif-js"],
  experimental: {
    serverActions: {
      // Property photos are uploaded one per request (see `uploadPropertyImage`);
      // phone JPEG/HEIC originals regularly exceed the 1 MB default.
      bodySizeLimit: "21mb",
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
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

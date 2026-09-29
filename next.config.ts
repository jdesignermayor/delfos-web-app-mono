import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

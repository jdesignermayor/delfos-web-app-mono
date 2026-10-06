import type { MetadataRoute } from "next";

import { NOINDEX, SITE_URL } from "@/lib/site";

/** /robots.txt — crawl everything public, never the dashboard; points crawlers at the sitemap. */
export default function robots(): MetadataRoute.Robots {
  if (NOINDEX) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

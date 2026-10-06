import type { MetadataRoute } from "next";

import { PROPERTIES_CACHE_TAG } from "@/lib/cache-tags";
import { SITE_URL } from "@/lib/site";
import { createPublicClient } from "@/supabase/public";

/**
 * /sitemap.xml — the landing, search and every published property (at its SEO
 * slug when one is set, i.e. its canonical URL), with its photos so Google
 * Images can index them. Refreshed with the property cache.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = await createPublicClient({ revalidate: 3600, tags: [PROPERTIES_CACHE_TAG] })
    .from("properties")
    .select("uuid, updated_at, created_at, image, additional_images, seo")
    .order("created_at", { ascending: false });

  const newest = data?.[0]?.updated_at ?? data?.[0]?.created_at;
  const properties: MetadataRoute.Sitemap = (data ?? []).map((row) => {
    const seo = row.seo as { google?: { slug?: string } } | null;
    return {
      url: `${SITE_URL}/propiedades/${seo?.google?.slug?.trim() || row.uuid}`,
      lastModified: row.updated_at ?? row.created_at ?? undefined,
      changeFrequency: "weekly",
      priority: 0.8,
      images: [row.image, ...(row.additional_images ?? [])].filter(Boolean).slice(0, 10),
    };
  });

  return [
    { url: SITE_URL, lastModified: newest ?? undefined, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/search`, lastModified: newest ?? undefined, changeFrequency: "daily", priority: 0.9 },
    ...properties,
  ];
}

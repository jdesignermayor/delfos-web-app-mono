import type { Metadata } from "next";

import type { Property } from "@/components/marketing/properties";
import { NOINDEX, SITE_URL } from "@/lib/site";

/** "dQw4w9WgXcQ" from watch?v=, youtu.be/, /shorts/ or /embed/ URLs; null when it isn't YouTube. */
export function youtubeId(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return parsed.pathname.slice(1).split("/")[0] || null;
    if (host !== "youtube.com" && host !== "youtube-nocookie.com") return null;
    if (parsed.searchParams.get("v")) return parsed.searchParams.get("v");
    const match = parsed.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/** The page's own path: the SEO slug when one is set, so it becomes the canonical URL. */
export function propertyPath(property: Property) {
  return `/propiedades/${property.seo?.google.slug || property.slug}`;
}

/** Which share card to serve: links shared as `?utm_source=linkedin` get the LinkedIn fields. */
function sharePlatform(searchParams: Record<string, string | string[] | undefined>) {
  const source = [searchParams.utm_source].flat()[0]?.toLowerCase() ?? "";
  return source.includes("linkedin") ? "linkedin" : "meta";
}

const splitList = (value: string | undefined) =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

/**
 * Page metadata from the dashboard's SEO step, each field falling back to the
 * listing data: Google fields drive <title>/description/keywords/canonical;
 * Meta fields drive Open Graph (Facebook, Instagram, WhatsApp, X); LinkedIn
 * only reads Open Graph too, so its fields are served when the link carries
 * `utm_source=linkedin`.
 */
export function buildPropertyMetadata(
  property: Property,
  fallbackDescription: string,
  searchParams: Record<string, string | string[] | undefined>,
): Metadata {
  const seo = property.seo;
  const title = seo?.google.metaTitle || property.title;
  const description = seo?.google.metaDescription || fallbackDescription;
  const canonical = seo?.google.canonicalUrl || propertyPath(property);

  const linkedin = sharePlatform(searchParams) === "linkedin";
  const shareTitle = (linkedin ? seo?.linkedin.title : undefined) || seo?.meta.ogTitle || title;
  const shareDescription = (linkedin ? seo?.linkedin.description : undefined) || seo?.meta.ogDescription || description;
  const seoImage = (linkedin ? seo?.linkedin.image : undefined) || seo?.meta.ogImage;
  const shareImage = seoImage || property.image;

  const place = [property.neighborhood, property.city].filter(Boolean).join(", ");
  const hasGeo = property.lat != null && property.lng != null;

  return {
    // A title written in the SEO step is used as-is, without the " · Delfos" suffix.
    title: seo?.google.metaTitle ? { absolute: title } : title,
    description,
    keywords: splitList(seo?.google.keywords),
    applicationName: "Delfos",
    category: "Bienes raíces",
    alternates: { canonical },
    robots: NOINDEX
      ? { index: false, follow: false }
      : {
      index: true,
      follow: true,
      // Let Google show large photo previews and full snippets/video previews in results.
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    // Local-search hints: where the project is.
    other: {
      ...(place ? { "geo.placename": place } : {}),
      ...(hasGeo ? { "geo.position": `${property.lat};${property.lng}`, ICBM: `${property.lat}, ${property.lng}` } : {}),
    },
    openGraph: {
      type: "website",
      locale: "es_CO",
      siteName: "Delfos",
      url: canonical,
      title: shareTitle,
      description: shareDescription,
      // Size hints only for SEO-step images, which are requested at 1200 × 630; the listing photo can be any size.
      images: shareImage
        ? [seoImage ? { url: shareImage, width: 1200, height: 630, alt: shareTitle } : { url: shareImage, alt: shareTitle }]
        : undefined,
    },
    twitter: {
      card: shareImage ? "summary_large_image" : "summary",
      title: shareTitle,
      description: shareDescription,
      images: shareImage ? [shareImage] : undefined,
    },
  };
}

/**
 * schema.org data for search engines: the development as an ApartmentComplex
 * (name, address, geo, photos) plus its promo video when one is set.
 */
export function buildPropertyJsonLd(property: Property, description: string): Record<string, unknown> {
  const url = `${SITE_URL}${propertyPath(property)}`;
  const images = property.images?.length ? property.images : property.image ? [property.image] : [];
  const graph: Record<string, unknown>[] = [
    {
      "@type": "ApartmentComplex",
      "@id": `${url}#property`,
      name: property.title,
      description,
      url,
      image: images,
      address: {
        "@type": "PostalAddress",
        streetAddress: property.address,
        addressLocality: property.neighborhood || property.city || undefined,
        addressRegion: property.city || undefined,
        addressCountry: "CO",
      },
      geo:
        property.lat != null && property.lng != null
          ? { "@type": "GeoCoordinates", latitude: property.lat, longitude: property.lng }
          : undefined,
      amenityFeature: property.amenities?.map((name) => ({ "@type": "LocationFeatureSpecification", name, value: true })),
    },
  ];

  const videoId = youtubeId(property.seo?.youtube.videoUrl);
  if (videoId) {
    graph.push({
      "@type": "VideoObject",
      name: property.seo?.youtube.videoTitle || property.title,
      description: property.seo?.youtube.videoDescription || description,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
      contentUrl: property.seo?.youtube.videoUrl,
      keywords: property.seo?.youtube.tags,
      // YouTube doesn't expose the publish date here; the listing URL anchors it instead.
      isPartOf: { "@id": `${url}#property` },
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

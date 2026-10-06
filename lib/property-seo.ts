import type { Metadata } from "next";

import type { Property } from "@/components/marketing/properties";
import { NOINDEX, SITE_URL } from "@/lib/site";

const KIND: Record<string, [singular: string, plural: string]> = {
  apartamento: ["apartamento", "apartamentos"],
  casa: ["casa", "casas"],
  apartaestudio: ["apartaestudio", "apartaestudios"],
  proyecto: ["vivienda", "vivienda nueva"],
};
const monthYear = new Intl.DateTimeFormat("es-CO", { month: "short", year: "numeric", timeZone: "UTC" });
const millions = (price: number) => `$${Math.round(price / 1_000_000).toLocaleString("es-CO")}M`;
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "La Estrella" — the most specific place we know, for titles. */
const placeOf = (property: Property) => property.neighborhood || property.city || "Medellín";

/**
 * Default <title> when the SEO step leaves it empty, phrased the way people
 * (and ChatGPT's Bing queries) search: "Bantue: apartamentos en venta en La
 * Estrella desde $464M". Branding alone ("Bantue Apartamentos") matches no query.
 */
export function defaultPropertyTitle(property: Property) {
  const kind = KIND[property.type]?.[1] ?? "vivienda";
  const deal = property.operation === "arrendar" ? "en arriendo" : "en venta";
  const base = `${property.title}: ${kind} ${deal} en ${placeOf(property)}`;
  const withPrice = property.price > 0 ? `${base} desde ${millions(property.price)}` : base;
  // ~60 characters is what Google shows; drop the price before cutting words.
  return withPrice.length <= 65 ? withPrice : base;
}

/**
 * Default meta description: offer, place, price, size, delivery date and a
 * call to action — the concrete facts a search snippet is judged on.
 */
export function defaultPropertyDescription(property: Property) {
  const kind = KIND[property.type]?.[1] ?? "vivienda";
  const deal = property.operation === "arrendar" ? "en arriendo" : "nuevos en venta";
  const specs = [
    property.beds && `${property.beds.min === property.beds.max ? property.beds.min : `${property.beds.min}-${property.beds.max}`} hab.`,
    property.baths && `${property.baths.min === property.baths.max ? property.baths.min : `${property.baths.min}-${property.baths.max}`} baños`,
    property.area && `${property.area.min === property.area.max ? property.area.min : `${property.area.min}-${property.area.max}`} m²`,
  ].filter(Boolean);
  const delivery = property.details?.deliveryDate
    ? monthYear.format(new Date(`${property.details.deliveryDate.slice(0, 10)}T00:00:00Z`)).replace(".", "")
    : "";
  const sentences = [
    `${capitalize(kind)} ${deal} en ${placeOf(property)}${property.price > 0 ? ` desde ${millions(property.price)}` : ""}.`,
    specs.length > 0 && `${specs.join(", ")}.`,
    delivery && `Entrega ${delivery}.`,
    property.details?.developer?.name && `Por ${property.details.developer.name}.`,
    "Mira precios, tipologías y agenda tu visita.",
  ];
  let text = "";
  for (const sentence of sentences) {
    if (!sentence) continue;
    const next = text ? `${text} ${sentence}` : sentence;
    if (next.length <= 160) text = next;
  }
  return text;
}

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
  searchParams: Record<string, string | string[] | undefined>,
): Metadata {
  const seo = property.seo;
  const title = seo?.google.metaTitle || defaultPropertyTitle(property);
  const description = seo?.google.metaDescription || defaultPropertyDescription(property);
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
export function buildPropertyJsonLd(property: Property): Record<string, unknown> {
  const url = `${SITE_URL}${propertyPath(property)}`;
  const description = property.seo?.google.metaDescription || defaultPropertyDescription(property);
  const images = property.images?.length ? property.images : property.image ? [property.image] : [];
  const graph: Record<string, unknown>[] = [
    // The listing itself: what's offered, for how much, and when it was published/updated (freshness).
    {
      "@type": "RealEstateListing",
      "@id": `${url}#listing`,
      url,
      name: property.seo?.google.metaTitle || defaultPropertyTitle(property),
      description,
      image: images[0],
      datePosted: property.createdAt,
      dateModified: property.updatedAt,
      inLanguage: "es-CO",
      about: { "@id": `${url}#property` },
      offers:
        property.price > 0
          ? {
              "@type": "Offer",
              price: property.price,
              priceCurrency: "COP",
              availability: "https://schema.org/InStock",
              businessFunction: `https://purl.org/goodrelations/v1#${property.operation === "arrendar" ? "LeaseOut" : "Sell"}`,
              seller: property.details?.developer?.name
                ? { "@type": "Organization", name: property.details.developer.name }
                : undefined,
            }
          : undefined,
    },
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

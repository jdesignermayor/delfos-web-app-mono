import type { Metadata } from "next";

import type { Property } from "@/components/marketing/properties";
import type { LandingStats } from "@/lib/data/landing";
import { NOINDEX, SITE_DESCRIPTION, SITE_NAME, SITE_URL, currentYear } from "@/lib/site";

const SHARE_IMAGE = { url: "/og/landing", width: 1200, height: 630, alt: "Delfos — vivienda nueva en Medellín" };

const AREA_SERVED = ["Medellín", "Envigado", "Sabaneta", "Itagüí", "La Estrella", "Bello"];

const millions = (price: number) => `$${Math.round(price / 1_000_000).toLocaleString("es-CO")}M`;

/** "2027" when every delivery falls in one year, "2026–2028" otherwise. */
const yearRange = ([first, last]: [number, number]) => (first === last ? `${first}` : `${first}–${last}`);

/**
 * "Compara 6 proyectos de vivienda nueva en venta en Medellín… desde $429M. Entregas 2026–2028. Agenda tu visita."
 * Falls back to the static site description when there are no live numbers.
 */
export function buildLandingDescription(stats: LandingStats | null): string {
  if (!stats) return SITE_DESCRIPTION;

  const offer = `Compara ${stats.count} proyectos de vivienda nueva en venta en Medellín y el Valle de Aburrá`;
  const fromPrice = stats.minPrice ? ` desde ${millions(stats.minPrice)}` : "";
  const facts = stats.deliveryYears
    ? `Precios, tipologías y entregas ${yearRange(stats.deliveryYears)}. `
    : "Precios, tipologías y fechas de entrega. ";

  return `${offer}${fromPrice}. ${facts}Agenda tu visita.`;
}

function landingKeywords(year: string): string[] {
  return [
    `apartamentos nuevos en venta medellín ${year}`,
    "vivienda nueva medellín",
    "proyectos sobre planos medellín",
    "apartamentos en venta envigado",
    "apartamentos en venta sabaneta",
    "apartamentos en venta la estrella",
    "vivienda vis medellín",
    "constructoras medellín",
  ];
}

const LANDING_ROBOTS: Metadata["robots"] = NOINDEX
  ? { index: false, follow: false }
  : {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    };

export function buildLandingMetadata(stats: LandingStats | null): Metadata {
  const year = currentYear();
  const title = `Apartamentos nuevos en venta en Medellín ${year} | ${SITE_NAME}`;
  const description = buildLandingDescription(stats);

  return {
    title: { absolute: title },
    description,
    keywords: landingKeywords(year),
    applicationName: SITE_NAME,
    category: "Bienes raíces",
    alternates: { canonical: "/" },
    robots: LANDING_ROBOTS,
    openGraph: { type: "website", locale: "es_CO", siteName: SITE_NAME, url: "/", title, description, images: [SHARE_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [SHARE_IMAGE.url] },
  };
}

/** Who Delfos is and what the site is, for Google's knowledge panel and site name in results. */
export const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/og/logo`, width: 512, height: 512 },
      description: SITE_DESCRIPTION,
      areaServed: AREA_SERVED.map((name) => ({ "@type": "City", name })),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: "Delfos Vivienda",
      url: SITE_URL,
      inLanguage: "es-CO",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

/** Lists properties for search engines, linking the page to each detail page. */
export function buildPropertyListJsonLd(name: string, properties: Property[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: properties.map((property, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}/propiedades/${property.slug}`,
      name: property.title,
      image: property.image,
    })),
  };
}

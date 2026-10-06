import type { Metadata } from "next";

import { SiteNavbar } from "@/components/marketing/site-navbar";
import { getCurrentUser } from "@/supabase/roles";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SearchModeProvider } from "@/components/marketing/search-mode-context";
import { HeroSection } from "@/components/marketing/hero-section";
import { FeaturedCarouselSection } from "@/components/marketing/featured-carousel-section";
import { OptionsSection } from "@/components/marketing/options-section";
import { SuggestedPropertiesSection } from "@/components/marketing/suggested-properties-section";
import { PublishSection } from "@/components/marketing/publish-section";
import { StatsSection } from "@/components/marketing/stats-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { JsonLd } from "@/components/seo/json-ld";
import { PROPERTIES_CACHE_TAG } from "@/lib/cache-tags";
import { NOINDEX, SITE_DESCRIPTION, SITE_NAME, SITE_URL, currentYear } from "@/lib/site";
import { createPublicClient } from "@/supabase/public";

const SHARE_IMAGE = { url: "/og/landing", width: 1200, height: 630, alt: "Delfos — vivienda nueva en Medellín" };

/** Live numbers for the landing's description, from the same cached query as the listings. */
async function landingStats() {
  const { data } = await createPublicClient({ revalidate: 3600, tags: [PROPERTIES_CACHE_TAG] })
    .from("properties")
    .select("price, delivery_date");
  if (!data?.length) return null;
  const prices = data.map((row) => Number(row.price)).filter((price) => price > 0);
  const years = data.flatMap((row) => (row.delivery_date ? [Number(row.delivery_date.slice(0, 4))] : []));
  return {
    count: data.length,
    minPrice: prices.length ? Math.min(...prices) : 0,
    years: years.length ? [Math.min(...years), Math.max(...years)] : null,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const stats = await landingStats();
  const year = currentYear();
  const title = `Apartamentos nuevos en venta en Medellín ${year} | ${SITE_NAME}`;
  // "Compara 6 proyectos de vivienda nueva en venta en Medellín… desde $429M. Entregas 2026–2028. Agenda tu visita."
  const description = stats
    ? [
        `Compara ${stats.count} proyectos de vivienda nueva en venta en Medellín y el Valle de Aburrá`,
        stats.minPrice ? ` desde $${Math.round(stats.minPrice / 1_000_000).toLocaleString("es-CO")}M` : "",
        ". ",
        stats.years
          ? `Precios, tipologías y entregas ${stats.years[0] === stats.years[1] ? stats.years[0] : `${stats.years[0]}–${stats.years[1]}`}. `
          : "Precios, tipologías y fechas de entrega. ",
        "Agenda tu visita.",
      ].join("")
    : SITE_DESCRIPTION;

  return {
    title: { absolute: title },
    description,
    keywords: [
      `apartamentos nuevos en venta medellín ${year}`,
      "vivienda nueva medellín",
      "proyectos sobre planos medellín",
      "apartamentos en venta envigado",
      "apartamentos en venta sabaneta",
      "apartamentos en venta la estrella",
      "vivienda vis medellín",
      "constructoras medellín",
    ],
    applicationName: SITE_NAME,
    category: "Bienes raíces",
    alternates: { canonical: "/" },
    robots: NOINDEX
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
        },
    openGraph: { type: "website", locale: "es_CO", siteName: SITE_NAME, url: "/", title, description, images: [SHARE_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [SHARE_IMAGE.url] },
  };
}

/** Who Delfos is and what the site is, for Google's knowledge panel and site name in results. */
const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/og/logo`, width: 512, height: 512 },
      description: SITE_DESCRIPTION,
      areaServed: ["Medellín", "Envigado", "Sabaneta", "Itagüí", "La Estrella", "Bello"].map((name) => ({
        "@type": "City",
        name,
      })),
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

export default function LandingPage() {
  return (
    <div
      className="light flex min-h-full flex-col bg-background text-foreground"
      style={{ colorScheme: "light" }}
    >
      <JsonLd data={SITE_JSON_LD} />
      <SearchModeProvider>
        <SiteNavbar userPromise={getCurrentUser()} />

        <main className="flex-1">
          <HeroSection />
          <FeaturedCarouselSection />
          <OptionsSection />
          <SuggestedPropertiesSection />
          <PublishSection />
          <StatsSection />
          <CtaSection />
        </main>
      </SearchModeProvider>

      <SiteFooter />
      <GoogleAnalytics />
    </div>
  );
}

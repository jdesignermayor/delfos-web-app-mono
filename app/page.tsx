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
import { NOINDEX, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

const SHARE_IMAGE = { url: "/og/landing", width: 1200, height: 630, alt: "Delfos — vivienda nueva en Medellín" };

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  keywords: [
    "vivienda nueva medellín",
    "apartamentos nuevos medellín",
    "proyectos sobre planos",
    "apartamentos en envigado",
    "apartamentos en sabaneta",
    "apartamentos en la estrella",
    "vivienda vis medellín",
    "constructoras medellín",
    "comprar apartamento medellín",
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
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: SITE_NAME,
    url: "/",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SHARE_IMAGE.url],
  },
};

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

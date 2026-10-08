import type { Metadata } from "next";

import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { CtaSection } from "@/components/marketing/cta-section";
import { FeaturedCarouselSection } from "@/components/marketing/featured-carousel-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { OptionsSection } from "@/components/marketing/options-section";
import { PublishSection } from "@/components/marketing/publish-section";
import { SearchModeProvider } from "@/components/marketing/search-mode-context";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNavbar } from "@/components/marketing/site-navbar";
import { StatsSection } from "@/components/marketing/stats-section";
import { SuggestedPropertiesSection } from "@/components/marketing/suggested-properties-section";
import { JsonLd } from "@/components/seo/json-ld";
import { getLandingStats } from "@/lib/data/landing";
import { SITE_JSON_LD, buildLandingMetadata } from "@/lib/landing-seo";
import { getCurrentUser } from "@/supabase/roles";

export async function generateMetadata(): Promise<Metadata> {
  return buildLandingMetadata(await getLandingStats());
}

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

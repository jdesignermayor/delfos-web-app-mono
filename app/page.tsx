import type { Metadata } from "next";
import { Suspense } from "react";

import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { CtaSection } from "@/components/marketing/cta-section";
import { FeaturedCarouselSection } from "@/components/marketing/featured-carousel-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { OptionsSection } from "@/components/marketing/options-section";
import { PublishSection } from "@/components/marketing/publish-section";
import { ScrollFx, ScrollMarquee } from "@/components/marketing/scroll-fx";
import { ColorTakeover } from "@/components/marketing/color-takeover";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { SearchModeProvider } from "@/components/marketing/search-mode-context";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNavbar } from "@/components/marketing/site-navbar";
import { StatsSection, StatsSectionSkeleton } from "@/components/marketing/stats-section";
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
      className="light flex min-h-full flex-col text-ink pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0"
      style={{ colorScheme: "light" }}
    >
      {/* The page theme's color: a fixed, screen-sized layer behind everything (cheap to blend). */}
      <div aria-hidden="true" className="theme-surface pointer-events-none fixed inset-0 -z-10" />
      <JsonLd data={SITE_JSON_LD} />
      <SearchModeProvider>
        <SiteNavbar userPromise={getCurrentUser()} tone="landing" />

        <main className="flex-1">
          {/* Each block names its page theme (`data-theme`): as it reaches the middle of the screen the
              whole page — background, navbar, progress bar — blends into its color (see ScrollFx). */}
          <div data-theme="blue">
            <HeroSection />
          </div>
          <div data-theme="paper">
            <FeaturedCarouselSection />
            <ScrollMarquee />
          </div>
          {/* Proof right after the listings, before the "how" sections. */}
          <div data-theme="ink">
            <Suspense fallback={<StatsSectionSkeleton />}>
              <StatsSection />
            </Suspense>
          </div>
          {/* Scroll-driven three.js city: busca, compara, separa, estrena — each step colors the screen. */}
          <HowItWorksSection />
          <div data-theme="pink">
            <OptionsSection />
          </div>
          {/* Full-screen color takeovers lead into the yellow and the ink sections. */}
          <ColorTakeover tone="yellow" lines={["Publica", "sin", "planillas"]} />
          <div data-theme="yellow">
            <PublishSection />
          </div>
          <ColorTakeover tone="ink" lines={["¿Listo", "para", "estrenar?"]} />
          <div data-theme="ink">
            <CtaSection />
          </div>
        </main>
      </SearchModeProvider>

      <div data-theme="paper" className="bg-paper">
        <SiteFooter />
      </div>
      <ScrollFx />
      <GoogleAnalytics />
    </div>
  );
}

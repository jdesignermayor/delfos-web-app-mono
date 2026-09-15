import { SiteNavbar } from "@/components/marketing/site-navbar";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SearchModeProvider } from "@/components/marketing/search-mode-context";
import { HeroSection } from "@/components/marketing/hero-section";
import { FeaturedCarouselSection } from "@/components/marketing/featured-carousel-section";
import { OptionsSection } from "@/components/marketing/options-section";
import { SuggestedPropertiesSection } from "@/components/marketing/suggested-properties-section";
import { PublishSection } from "@/components/marketing/publish-section";
import { StatsSection } from "@/components/marketing/stats-section";
import { CtaSection } from "@/components/marketing/cta-section";

export default function LandingPage() {
  return (
    <div
      className="light flex min-h-full flex-col bg-background text-foreground"
      style={{ colorScheme: "light" }}
    >
      <SearchModeProvider>
        <SiteNavbar />

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
    </div>
  );
}

"use client";

import { PropertySearch } from "@/components/marketing/property-search";
import { useSearchMode } from "@/components/marketing/search-mode-context";

export function HeroSection() {
  const { heroSearchRef } = useSearchMode();
  return (
    // The hero (heading + big search) is a desktop-only block, but the page's single <h1> must stay in the
    // DOM on phones too: Google indexes the mobile page. Below md it's screen-reader-only and takes no space.
    <section id="inicio" className="md:border-b md:border-separator md:bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center text-center md:px-6 md:py-8">
        <h1 className="sr-only font-display font-semibold tracking-tight text-foreground md:not-sr-only md:text-2xl">
          Encuentra el hogar donde quieres vivir
        </h1>

        <div ref={heroSearchRef} className="mt-5 hidden w-full md:block">
          <PropertySearch />
        </div>
      </div>
    </section>
  );
}

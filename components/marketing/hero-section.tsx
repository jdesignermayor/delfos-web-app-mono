"use client";

import { PropertySearch } from "@/components/marketing/property-search";
import { useSearchMode } from "@/components/marketing/search-mode-context";

export function HeroSection() {
  const { heroSearchRef } = useSearchMode();
  return (
    <section id="inicio" className="hidden border-b border-separator md:block">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-6 text-center sm:px-6 sm:py-8">
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Encuentra el hogar donde quieres vivir
        </h1>

        <div ref={heroSearchRef} className="mt-5 w-full">
          <PropertySearch />
        </div>
      </div>
    </section>
  );
}

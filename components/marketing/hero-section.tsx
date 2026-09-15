import { PropertySearch } from "@/components/marketing/property-search";

export function HeroSection() {
  return (
    <section id="inicio" className="border-b border-separator">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-6 text-center sm:px-6 sm:py-8">
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Encuentra el hogar donde quieres vivir
        </h1>

        <div className="mt-5 w-full">
          <PropertySearch />
        </div>
      </div>
    </section>
  );
}

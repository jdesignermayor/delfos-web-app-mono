import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BathIcon, BedIcon, CarIcon, CheckIcon, MapPinIcon, RulerIcon } from "@/components/icons";
import { SiteNavbar } from "@/components/marketing/site-navbar";
import { SearchModeProvider } from "@/components/marketing/search-mode-context";
import {
  OPERATION_LABELS,
  PROPERTIES,
  formatPrice,
  getPropertyBySlug,
} from "@/components/marketing/properties";
import { AffordabilityCalculator } from "@/components/property-detail/affordability-calculator";
import { FavoriteShareBar } from "@/components/property-detail/favorite-share-bar";
import { GallerySection } from "@/components/property-detail/gallery-section";
import { PhotoCollage } from "@/components/property-detail/photo-collage";

const DEFAULT_AMENITIES = [
  "Portería 24 horas",
  "Parqueadero de visitantes",
  "Zona BBQ",
  "Gimnasio",
  "Salón social",
  "Ascensor",
];

export function generateStaticParams() {
  return PROPERTIES.map((property) => ({ slug: property.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/propiedades/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const property = getPropertyBySlug(slug);
  if (!property) return { title: "Propiedad no encontrada" };

  const description = `${property.title} en ${property.neighborhood}, ${property.city}. ${property.beds} habitaciones, ${property.baths} baños, ${property.area} m². ${formatPrice(property)}.`;

  return {
    title: property.title,
    description,
    openGraph: {
      title: property.title,
      description,
      images: property.image ? [property.image] : undefined,
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: PageProps<"/propiedades/[slug]">) {
  const { slug } = await params;
  const property = getPropertyBySlug(slug);
  if (!property) notFound();

  const amenities = property.amenities ?? DEFAULT_AMENITIES;
  const description =
    property.description ??
    `${property.title} es una propiedad ${OPERATION_LABELS[property.operation].toLowerCase()} en ${property.neighborhood}, ${property.city}. Cuenta con ${property.beds} habitaciones, ${property.baths} baños y ${property.area} m² construidos, ideal para quienes buscan calidad de vida cerca de los principales servicios de la zona.`;

  return (
    <SearchModeProvider>
      <SiteNavbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <FavoriteShareBar title={property.title} />

        <div className="mt-4">
          <GallerySection>
            <PhotoCollage property={property} />
          </GallerySection>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-4">
            <div className="rounded-2xl border border-separator bg-surface p-5">
              <p className="text-sm text-muted">{OPERATION_LABELS[property.operation]}</p>
              <p className="mt-1 font-display text-2xl font-semibold text-foreground">
                {formatPrice(property)}
              </p>
            </div>
            <AffordabilityCalculator property={property} />
          </aside>

          <div className="flex flex-col gap-10">
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                {property.title}
              </h2>
              <p className="mt-1 text-muted">
                {property.neighborhood}, {property.city}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-separator py-4 text-sm text-foreground">
                <span className="flex items-center gap-2">
                  <BedIcon className="size-4 text-muted" />
                  {property.beds} habitaciones
                </span>
                <span className="flex items-center gap-2">
                  <BathIcon className="size-4 text-muted" />
                  {property.baths} baños
                </span>
                <span className="flex items-center gap-2">
                  <RulerIcon className="size-4 text-muted" />
                  {property.area} m²
                </span>
                <span className="flex items-center gap-2">
                  <CarIcon className="size-4 text-muted" />
                  {property.parking} parqueaderos
                </span>
              </div>

              <p className="mt-5 leading-relaxed text-foreground/90">{description}</p>
            </div>

            <section id="servicios" className="scroll-mt-24">
              <h3 className="text-lg font-semibold text-foreground">Servicios</h3>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                {amenities.map((amenity) => (
                  <li key={amenity} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckIcon className="size-4 shrink-0 text-accent" />
                    {amenity}
                  </li>
                ))}
              </ul>
            </section>

            <section id="ubicacion" className="scroll-mt-24">
              <h3 className="text-lg font-semibold text-foreground">Ubicación</h3>
              <p className="mt-2 text-sm text-muted">
                {property.neighborhood}, {property.city}
              </p>
              <div className="mt-4 flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-separator bg-surface-secondary">
                <MapPinIcon className="size-10 text-muted" />
              </div>
            </section>
          </div>
        </div>
      </main>
    </SearchModeProvider>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BathIcon, BedIcon, CarIcon, RulerIcon } from "@/components/icons";
import { SiteNavbar } from "@/components/marketing/site-navbar";
import { SearchModeProvider } from "@/components/marketing/search-mode-context";
import { getDbPropertyByUuid } from "@/components/marketing/property-adapter";
import {
  OPERATION_LABELS,
  PROPERTIES,
  formatPrice,
  getPropertyBySlug,
  type Property,
} from "@/components/marketing/properties";
import { AffordabilityCalculator } from "@/components/property-detail/affordability-calculator";
import { FavoriteShareBar } from "@/components/property-detail/favorite-share-bar";
import { GallerySection } from "@/components/property-detail/gallery-section";
import { LocationMap } from "@/components/property-detail/location-map";
import { PhotoCollage } from "@/components/property-detail/photo-collage";
import { TalkToAgentButton } from "@/components/property-detail/talk-to-agent-button";
import { AmenityItem } from "@/components/property-detail/amenity-item";
import { SiteFooter } from "@/components/marketing/site-footer";

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Mock listings first (no DB round-trip); real DB properties are keyed by their public UUID. */
async function resolveProperty(slug: string): Promise<Property | null> {
  const mock = getPropertyBySlug(slug);
  if (mock) return mock;

  if (!UUID_RE.test(slug)) return null;
  return getDbPropertyByUuid(slug);
}

export async function generateMetadata({
  params,
}: PageProps<"/propiedades/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const property = await resolveProperty(slug);
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
  const property = await resolveProperty(slug);
  if (!property) notFound();

  const amenities = property.amenities ?? DEFAULT_AMENITIES;
  const description =
    property.description ??
    `${property.title} es una propiedad ${OPERATION_LABELS[property.operation].toLowerCase()} en ${property.neighborhood}, ${property.city}. Cuenta con ${property.beds} habitaciones, ${property.baths} baños y ${property.area} m² construidos, ideal para quienes buscan calidad de vida cerca de los principales servicios de la zona.`;

  return (
    <SearchModeProvider>
      <SiteNavbar alwaysShowSearch />

      <main className="w-full bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
          <FavoriteShareBar title={property.title} />

          <div className="mt-4">
            <GallerySection>
              <PhotoCollage property={property} />
            </GallerySection>
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="flex flex-col gap-10">
              <div>
                <h2 className="font-display text-sm font-semibold text-foreground">
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

                <div className="mt-5 flex items-center gap-4 rounded-lg border border-separator bg-surface p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-sm font-semibold text-white">
                    JP
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Asesor personalizado: Juan Pérez</p>
                    <p className="text-sm text-muted">5 años de experiencia</p>
                  </div>
                </div>

                <p className="mt-5 leading-relaxed text-foreground/90">{description}</p>
              </div>

              <section id="servicios" className="scroll-mt-24">
                <h3 className="font-display text-2xl font-semibold text-foreground">Lo que este lugar ofrece</h3>
                <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-2">
                  {amenities.map((amenity) => (
                    <AmenityItem key={amenity} label={amenity} />
                  ))}
                </ul>
              </section>

              <section id="ubicacion" className="scroll-mt-24">
                <h3 className="font-display text-2xl font-semibold text-foreground">Ubicación</h3>
                <p className="mt-2 text-sm text-muted">
                  {property.neighborhood}, {property.city}
                </p>
                {property.address && (
                  <p className="mt-3 text-sm text-foreground">
                    {property.address}
                  </p>
                )}
              </section>
            </div>

            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <div className="flex flex-col gap-4 rounded-2xl border border-separator bg-surface p-5">
                <div>
                  <p className="text-sm text-muted">{OPERATION_LABELS[property.operation]}</p>
                  <p className="mt-1 font-display text-2xl font-semibold text-foreground">
                    {formatPrice(property)}
                  </p>
                </div>

                <div className="h-px bg-separator" />

                <AffordabilityCalculator property={property} />

                <TalkToAgentButton propertyTitle={property.title} />
              </div>
            </aside>
          </div>

          <LocationMap property={property} />
        </div>
      </main>

      <SiteFooter />
    </SearchModeProvider>
  );
}

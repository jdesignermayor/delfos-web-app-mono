import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BathIcon, BedIcon, CarIcon, RulerIcon } from "@/components/icons";
import { SiteNavbar } from "@/components/marketing/site-navbar";
import { getCurrentUser } from "@/supabase/roles";
import { SearchModeProvider } from "@/components/marketing/search-mode-context";
import { getDbPropertyBySlug } from "@/components/marketing/property-adapter";
import {
  OPERATION_LABELS,
  PROPERTIES,
  formatPrice,
  getPropertyBySlug,
  type Property,
} from "@/components/marketing/properties";
import { AffordabilityCalculator } from "@/components/property-detail/affordability-calculator";
import {
  FavoriteShareBar,
  PropertyActionsProvider,
} from "@/components/property-detail/favorite-share-bar";
import { GallerySection } from "@/components/property-detail/gallery-section";
import { LocationMap } from "@/components/property-detail/location-map";
import { PropertyGallery } from "@/components/property-detail/property-gallery";
import { TalkToAgentButton } from "@/components/property-detail/talk-to-agent-button";
import {
  FinancingSummary,
  ProjectDetailsSection,
  SalesRoomSection,
  TowersSection,
} from "@/components/property-detail/project-details";
import { AmenityItem } from "@/components/property-detail/amenity-item";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PropertyVideo } from "@/components/property-detail/property-video";
import { JsonLd } from "@/components/seo/json-ld";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { TrackPropertyView } from "@/components/analytics/track-property-view";
import { buildPropertyJsonLd, buildPropertyMetadata, youtubeId } from "@/lib/property-seo";
import { formatRange } from "@/lib/typology-ranges";

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

/** "2–3 habitaciones, 2 baños y 54–98 m² construidos" — only the parts that are known. */
function specs(property: Property) {
  const parts = [
    property.beds && `${formatRange(property.beds)} habitaciones`,
    property.baths && `${formatRange(property.baths)} baños`,
    property.area && `${formatRange(property.area)} m² construidos`,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} y ${parts.at(-1)}` : (parts[0] ?? "");
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Mock listings first (no DB round-trip); real DB properties are found by
 * their public UUID or by the SEO slug set in the dashboard.
 */
async function resolveProperty(slug: string): Promise<Property | null> {
  const mock = getPropertyBySlug(slug);
  if (mock) return mock;

  return getDbPropertyBySlug(decodeURIComponent(slug), UUID_RE.test(slug) ? "uuid" : "seo-slug");
}

/** Default description when the SEO step leaves it empty: place, specs and price. */
function summary(property: Property) {
  const place = [property.neighborhood, property.city].filter(Boolean).join(", ");
  return [
    `${property.title}${place ? ` en ${place}` : ""}.`,
    specs(property) && `${specs(property)}.`,
    `${formatPrice(property)}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/propiedades/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const property = await resolveProperty(slug);
  if (!property) return { title: "Propiedad no encontrada" };

  return buildPropertyMetadata(property, summary(property), await searchParams);
}

export default async function PropertyDetailPage({
  params,
}: PageProps<"/propiedades/[slug]">) {
  const { slug } = await params;
  const property = await resolveProperty(slug);
  if (!property) notFound();

  const amenities = property.amenities ?? DEFAULT_AMENITIES;
  const details = property.details;
  const description =
    property.description ??
    `${property.title} es una propiedad ${OPERATION_LABELS[property.operation].toLowerCase()} en ${property.neighborhood}, ${property.city}. ${specs(property) ? `Cuenta con ${specs(property)}, ideal` : "Ideal"} para quienes buscan calidad de vida cerca de los principales servicios de la zona.`;
  const videoId = youtubeId(property.seo?.youtube.videoUrl);

  return (
    <SearchModeProvider>
      <JsonLd data={buildPropertyJsonLd(property, summary(property))} />
      <GoogleAnalytics />
      <TrackPropertyView
        property={{
          slug: property.slug,
          title: property.title,
          price: property.price,
          type: property.type,
          city: property.city,
          neighborhood: property.neighborhood,
        }}
      />
      <SiteNavbar alwaysShowSearch userPromise={getCurrentUser()} />

      <main className="w-full bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
          <PropertyActionsProvider title={property.title}>
            <FavoriteShareBar />

            <div className="mt-4">
              <GallerySection>
                <PropertyGallery property={property} />
              </GallerySection>
            </div>
          </PropertyActionsProvider>

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
                  {property.beds ? (
                    <span className="flex items-center gap-2">
                      <BedIcon className="size-4 text-muted" />
                      {formatRange(property.beds)} habitaciones
                    </span>
                  ) : null}
                  {property.baths ? (
                    <span className="flex items-center gap-2">
                      <BathIcon className="size-4 text-muted" />
                      {formatRange(property.baths)} baños
                    </span>
                  ) : null}
                  {property.area ? (
                    <span className="flex items-center gap-2">
                      <RulerIcon className="size-4 text-muted" />
                      {formatRange(property.area)} m²
                    </span>
                  ) : null}
                  {property.parking != null ? (
                    <span className="flex items-center gap-2">
                      <CarIcon className="size-4 text-muted" />
                      {property.parking} parqueaderos
                    </span>
                  ) : null}
                </div>

                <p className="mt-5 whitespace-pre-line leading-relaxed text-foreground/90">{description}</p>
              </div>

              {details ? <ProjectDetailsSection property={property} details={details} /> : null}
              {details ? <TowersSection towers={details.towers} /> : null}

              {videoId ? (
                <section id="video" className="scroll-mt-24">
                  <h3 className="font-display text-2xl font-semibold text-foreground">Video del proyecto</h3>
                  {property.seo?.youtube.videoTitle ? (
                    <p className="mt-1 text-sm text-muted">{property.seo.youtube.videoTitle}</p>
                  ) : null}
                  <div className="mt-4">
                    <PropertyVideo videoId={videoId} title={property.seo?.youtube.videoTitle || property.title} />
                  </div>
                </section>
              ) : null}

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

              {details ? <SalesRoomSection salesRoom={details.salesRoom} /> : null}
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

                {details ? <FinancingSummary financing={details.financing} /> : null}

                <AffordabilityCalculator property={property} />

                <TalkToAgentButton
                  propertyTitle={property.title}
                  phone={details?.developer?.phone ?? details?.salesRoom.phone}
                />
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

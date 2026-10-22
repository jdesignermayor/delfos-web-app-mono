"use client";

import {
  EmptyList,
  FAVORITES_CARD_SIZES,
  FAVORITES_GRID,
  FavoritesGridSkeleton,
  FavoritesLoadError,
  FavoritesSignedOut,
} from "@/components/favorites/favorites-states";
import { FavoritesHeader } from "@/components/favorites/favorites-header";
import { useFavoritesPageData } from "@/components/favorites/use-favorites-page-data";
import { PropertyCard } from "@/components/marketing/property-card";

/** `/favoritos/vistos-recientemente`: every recently opened property, most recent first. */
export function RecentViewsView() {
  const state = useFavoritesPageData();

  return (
    <>
      <FavoritesHeader fallbackHref="/favoritos" />

      <main className="mx-auto w-full max-w-6xl flex-1 bg-white px-4 py-6 sm:px-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">Vistos recientemente</h1>

        <div className="mt-6">
          {state.status === "signed-out" ? <FavoritesSignedOut /> : null}
          {state.status === "loading" ? <FavoritesGridSkeleton /> : null}
          {state.status === "error" ? <FavoritesLoadError /> : null}
          {state.status === "ready" ? (
            state.data.recent.length > 0 ? (
              <div className={FAVORITES_GRID}>
                {state.data.recent.map((property, index) => (
                  <PropertyCard key={property.slug} property={property} eager={index < 4} sizes={FAVORITES_CARD_SIZES} />
                ))}
              </div>
            ) : (
              <EmptyList
                title="Aún no hay vistos recientemente"
                description="Las propiedades que abras aparecerán aquí para que vuelvas a ellas fácilmente."
              />
            )
          ) : null}
        </div>
      </main>
    </>
  );
}

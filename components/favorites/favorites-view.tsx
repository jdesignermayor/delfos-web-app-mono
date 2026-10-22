"use client";

import { useState } from "react";

import {
  EmptyList,
  FAVORITES_CARD_SIZES,
  FAVORITES_GRID,
  FavoritesGridSkeleton,
  FavoritesLoadError,
  FavoritesSignedOut,
} from "@/components/favorites/favorites-states";
import { FavoritesHeader, HeaderActionButton } from "@/components/favorites/favorites-header";
import { RecentViewsCollage } from "@/components/favorites/recent-views-collage";
import { useFavoritesPageData } from "@/components/favorites/use-favorites-page-data";
import { useFavorites } from "@/components/marketing/favorites-provider";
import { PropertyCard } from "@/components/marketing/property-card";

/**
 * `/favoritos`: the "Vistos recientemente" collage first, then every saved property as its own
 * card. "Editar" swaps each heart for an X that removes the property from favorites.
 */
export function FavoritesView() {
  const state = useFavoritesPageData();
  const favorites = useFavorites();
  const [isEditing, setIsEditing] = useState(false);

  // The shared favorites state is the source of truth: a property un-saved here or anywhere
  // else leaves the grid right away.
  const saved =
    state.status === "ready"
      ? state.data.favorites.filter((property) => property.uuid && favorites?.isFavorite(property.uuid))
      : [];
  const editing = isEditing && saved.length > 0;

  return (
    <>
      <FavoritesHeader
        fallbackHref="/"
        action={
          state.status === "ready" ? (
            <HeaderActionButton
              onClick={() => setIsEditing((current) => !current)}
              isActive={editing}
              isDisabled={saved.length === 0}
            >
              {editing ? "Listo" : "Editar"}
            </HeaderActionButton>
          ) : null
        }
      />

      <main className="mx-auto w-full max-w-6xl flex-1 bg-white px-4 py-6 sm:px-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">Favoritos</h1>

        <div className="mt-6">
          {state.status === "signed-out" ? <FavoritesSignedOut /> : null}
          {state.status === "loading" ? <FavoritesGridSkeleton /> : null}
          {state.status === "error" ? <FavoritesLoadError /> : null}
          {state.status === "ready" ? (
            <div className="flex flex-col gap-8">
              <div className={FAVORITES_GRID}>
                <RecentViewsCollage properties={state.data.recent} />
                {saved.map((property, index) => (
                  <PropertyCard
                    key={property.slug}
                    property={property}
                    eager={index < 3}
                    sizes={FAVORITES_CARD_SIZES}
                    onRemove={
                      editing && property.uuid
                        ? () => void favorites?.setFavorite(property.uuid!, false)
                        : undefined
                    }
                  />
                ))}
              </div>
              {saved.length === 0 ? (
                <EmptyList
                  title="Aún no tienes propiedades favoritas"
                  description="Toca el corazón en cualquier propiedad para guardarla y encontrarla aquí."
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}

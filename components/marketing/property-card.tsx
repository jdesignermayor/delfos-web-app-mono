"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, type MouseEvent } from "react";
import { HeartIcon } from "lucide-animated";
import { useOverlayState } from "@heroui/react";

import { BuildingIcon } from "@/components/icons";
import { CardSlideshow } from "@/components/marketing/card-slideshow";
import { FavoritesLoginPrompt } from "@/components/marketing/favorites-login-prompt";
import { formatPrice, type Property } from "@/components/marketing/properties";
import { useFavoriteToggle } from "@/hooks/use-favorite-toggle";
import { propertyItem, trackEvent } from "@/lib/analytics";

/**
 * The sign-in modal is only needed after a signed-out visitor taps the heart,
 * so it's code-split and mounted on demand instead of once per card.
 */
const AuthModal = dynamic(() => import("@/components/marketing/auth-modal").then((mod) => mod.AuthModal), {
  ssr: false,
});

type AnalyticsList = { id: string; name: string };

/** Tinted gradient shown behind cards without a photo. */
function placeholderBackground(hue: number) {
  return { background: `linear-gradient(135deg, oklch(0.93 0.05 ${hue}), oklch(0.82 0.09 ${hue}))` };
}

function FavoriteButton({ isFavorite, onToggle }: { isFavorite: boolean; onToggle: () => void }) {
  function handleClick(event: MouseEvent) {
    // The button sits inside the card's link: don't navigate.
    event.preventDefault();
    event.stopPropagation();
    onToggle();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full backdrop-blur-sm bg-white/20 text-white transition-all hover:bg-white/30"
      aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
      aria-pressed={isFavorite}
    >
      <HeartIcon size={20} className={`transition-colors ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
    </button>
  );
}

function trackSelectItem(property: Property, list: AnalyticsList, index: number | undefined) {
  trackEvent("select_item", {
    item_list_id: list.id,
    item_list_name: list.name,
    items: [propertyItem(property, index)],
  });
}

export function PropertyCard({
  property,
  active = false,
  onActivate,
  onDeactivate,
  onLoginRequired,
  eager = false,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  analyticsList,
  index,
}: {
  property: Property;
  /** Skip lazy loading for cards visible on first paint. */
  eager?: boolean;
  /** Rendered width hint for next/image, so it serves a resized photo. */
  sizes?: string;
  /** The landing list this card belongs to; clicks are reported to GA4 as `select_item` from it. */
  analyticsList?: AnalyticsList;
  /** Position in that list (0-based), reported with the click. */
  index?: number;
  active?: boolean;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onLoginRequired?: () => void;
}) {
  const { isFavorite, canFavorite, toggleFavorite, loginPrompt, closeLoginPrompt } = useFavoriteToggle({
    propertyUuid: property.uuid,
    onLoginRequired,
  });
  const authModal = useOverlayState();
  const images = property.images?.length ? property.images : property.image ? [property.image] : [];
  const [authMounted, setAuthMounted] = useState(false);

  function continueToLogin() {
    closeLoginPrompt();
    setAuthMounted(true);
    authModal.open();
  }

  return (
    <>
      <Link
        href={`/propiedades/${property.slug}`}
        onMouseEnter={onActivate}
        onMouseLeave={onDeactivate}
        onFocus={onActivate}
        onBlur={onDeactivate}
        onClick={analyticsList ? () => trackSelectItem(property, analyticsList, index) : undefined}
        className="group flex flex-col"
      >
        <div
          className={`relative aspect-square w-full overflow-hidden rounded-2xl transition-shadow ${
            active ? "ring-2 ring-accent" : ""
          }`}
          style={images.length > 0 ? undefined : placeholderBackground(property.hue)}
        >
          {images.length > 0 ? (
            <CardSlideshow images={images} alt={property.title} sizes={sizes} eager={eager} />
          ) : (
            <BuildingIcon className="absolute -bottom-6 -right-4 size-40 text-white/25" />
          )}
          {canFavorite ? <FavoriteButton isFavorite={isFavorite} onToggle={toggleFavorite} /> : null}
        </div>

        <div className="mt-3">
          <h3 className="truncate font-bold text-foreground">{property.title}</h3>
          <p className="mt-0.5 text-sm font-semibold text-muted">Desde {formatPrice(property)}</p>
        </div>
      </Link>

      {loginPrompt ? (
        <FavoritesLoginPrompt
          lastEmail={loginPrompt.lastEmail}
          onCancel={closeLoginPrompt}
          onContinue={continueToLogin}
        />
      ) : null}

      {authMounted ? <AuthModal state={authModal} stayOnPage /> : null}
    </>
  );
}

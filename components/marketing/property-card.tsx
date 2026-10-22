"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRef, useState, type MouseEvent, type ReactNode, type RefObject } from "react";
import { HeartIcon, TrendingUpIcon, type HeartIconHandle, type TrendingUpIconHandle } from "lucide-animated";
import { X } from "lucide-react";
import { useOverlayState } from "@heroui/react";

import { BathIcon, BedIcon, BuildingIcon, MapPinIcon, RulerIcon } from "@/components/icons";
import { CardSlideshow } from "@/components/marketing/card-slideshow";
import { FavoritesLoginPrompt } from "@/components/marketing/favorites-login-prompt";
import { HighlightedCardMedia } from "@/components/marketing/highlighted-card-media";
import { ReelMedia, type ReelMode } from "@/components/marketing/reel-media";
import { formatPrice, type Property } from "@/components/marketing/properties";
import { formatRange } from "@/lib/typology-ranges";
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
  const iconRef = useRef<HeartIconHandle>(null);

  function handleClick(event: MouseEvent) {
    // The button sits inside the card's link: don't navigate.
    event.preventDefault();
    event.stopPropagation();
    // A little beat when saving, not when removing.
    if (!isFavorite) iconRef.current?.startAnimation();
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
      {/* The fill goes on the <svg> itself: it has `fill="none"`, which beats a colour inherited from this wrapper. */}
      <HeartIcon
        ref={iconRef}
        size={20}
        className={`transition-colors ${isFavorite ? "text-accent [&_svg]:fill-current" : ""}`}
      />
    </button>
  );
}

function RemoveButton({ onRemove }: { onRemove: () => void }) {
  function handleClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    onRemove();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-foreground text-white shadow-md transition-[filter] hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      aria-label="Quitar de favoritos"
    >
      <X className="size-5" strokeWidth={2.5} />
    </button>
  );
}

/** "Éxito en ventas": the project has a tower whose status is flagged as a sales success. */
function SalesSuccessBadge({ iconRef }: { iconRef: RefObject<TrendingUpIconHandle | null> }) {
  return (
    <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border-2 border-accent bg-white py-1 pl-2 pr-3 text-xs font-bold text-accent shadow-md">
      <TrendingUpIcon ref={iconRef} size={16} />
      Éxito en ventas
    </span>
  );
}

/** "El Poblado, Medellín", skipping whichever part is missing. */
function placeLabel(property: Property) {
  return [property.neighborhood, property.city].filter((part, i, parts) => part && parts.indexOf(part) === i).join(", ");
}

/** Bedrooms, bathrooms and area ranges across the project's typologies, when known. */
function ListingSpecs({ property, className }: { property: Property; className: string }) {
  const specs = [
    property.beds && { icon: BedIcon, label: `${formatRange(property.beds)} hab.` },
    property.baths && { icon: BathIcon, label: `${formatRange(property.baths)} ${property.baths.max === 1 ? "baño" : "baños"}` },
    property.area && { icon: RulerIcon, label: `${formatRange(property.area)} m²` },
  ].filter((spec) => Boolean(spec)) as { icon: typeof BedIcon; label: string }[];
  if (!specs.length) return null;

  return (
    <p className={`mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}>
      {specs.map(({ icon: Icon, label }) => (
        <span key={label} className="inline-flex items-center gap-1">
          <Icon className="size-3.5 shrink-0" />
          {label}
        </span>
      ))}
    </p>
  );
}

/**
 * Title, place, typology ranges and price. `overlay` is the white version laid over the photo
 * (the "Propiedades destacadas" cards); otherwise it sits below the photo.
 */
function CardDetails({ property, overlay = false }: { property: Property; overlay?: boolean }) {
  const place = placeLabel(property);
  return (
    <>
      <h3 className={`truncate font-bold ${overlay ? "text-xl text-white sm:text-2xl" : "text-foreground"}`}>
        {property.title}
      </h3>
      {place ? (
        <p className={`mt-0.5 flex items-center gap-1 text-sm ${overlay ? "text-white/85" : "text-muted"}`}>
          <MapPinIcon className="size-3.5 shrink-0" />
          <span className="truncate">{place}</span>
        </p>
      ) : null}
      <ListingSpecs property={property} className={overlay ? "text-sm text-white/85" : "text-xs text-muted"} />
      <p className={`mt-1.5 flex flex-wrap items-center gap-x-2 ${overlay ? "mt-3 text-base" : "text-sm"}`}>
        <span className={`font-semibold ${overlay ? "text-lg font-bold text-white" : "text-foreground"}`}>
          Desde {formatPrice(property)}
        </span>
        <span className={`text-xs ${overlay ? "text-white/75" : "text-muted"}`}>· {property.status}</span>
        {property.affordable ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              overlay ? "bg-white/20 text-white backdrop-blur-sm" : "bg-accent-soft text-accent"
            }`}
          >
            VIS
          </span>
        ) : null}
      </p>
    </>
  );
}

/** The photo (or tinted placeholder) with the card's badge and action button on top. */
function CardPhoto({
  property,
  images,
  sizes,
  eager,
  className,
  salesIconRef,
  action,
  media,
  fitLandscape = false,
  pinned = false,
  children,
}: {
  property: Property;
  /** The card's photos; empty shows the tinted placeholder. */
  images: string[];
  sizes: string;
  eager: boolean;
  className: string;
  salesIconRef: RefObject<TrendingUpIconHandle | null>;
  /** The heart, or the X in edit mode. */
  action: ReactNode;
  /** Replaces the photo slideshow (e.g. the highlighted card's photos + video). */
  media?: ReactNode;
  /** Tall frames: landscape photos are shown whole over a blurred copy (see `FittedPhoto`). */
  fitLandscape?: boolean;
  /** Keeps the slideshow's turn (see `CardSlideshow`), e.g. while the card is hovered. */
  pinned?: boolean;
  /** Laid over the photo, e.g. the details of a highlighted card. */
  children?: ReactNode;
}) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl bg-surface-secondary transition-shadow ${className}`}
      style={images.length > 0 ? undefined : placeholderBackground(property.hue)}
    >
      {images.length > 0 ? (
        (media ?? (
          <CardSlideshow
            images={images}
            alt={property.title}
            sizes={sizes}
            eager={eager}
            fitLandscape={fitLandscape}
            pinned={pinned}
          />
        ))
      ) : (
        <BuildingIcon className="absolute -bottom-6 -right-4 size-40 text-white/25" />
      )}
      {children}
      {property.salesSuccess ? <SalesSuccessBadge iconRef={salesIconRef} /> : null}
      {action}
    </div>
  );
}

type CardVariant = "default" | "highlighted" | "reel";

const OVERLAY_PHOTO_CLASS: Record<Exclude<CardVariant, "default">, string> = {
  // The card starts ~23rem down the landing (navbar, search, section title), so it takes the rest
  // of the viewport — whole on first load, without scrolling — with the width following 3:4.
  highlighted: "aspect-[3/4] h-[clamp(18rem,calc(100svh-24rem),44rem)] w-auto",
  reel: "h-full",
};

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
  onRemove,
  variant = "default",
  reelMode = "idle",
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
  /** Edit mode (e.g. on /favoritos): an X that removes the card replaces the heart. */
  onRemove?: () => void;
  /**
   * "default": details below the photo. "highlighted" ("Propiedades destacadas" on larger screens):
   * a taller card with the details laid over the photo. "reel": the same, filling its parent's
   * height (the phone's TikTok-style feed).
   */
  variant?: CardVariant;
  /** "reel" only: whether it plays (on screen), preloads its video (next) or stands still. */
  reelMode?: ReelMode;
}) {
  const { isFavorite, canFavorite, toggleFavorite, loginPrompt, closeLoginPrompt } = useFavoriteToggle({
    propertyUuid: property.uuid,
    onLoginRequired,
  });
  const authModal = useOverlayState();
  const [authMounted, setAuthMounted] = useState(false);
  // The badge icon animates while the whole card is hovered, not just the icon.
  const salesIconRef = useRef<TrendingUpIconHandle>(null);
  // "highlighted": while hovered the card alone plays (photos and video) and shows a ring.
  const [hovered, setHovered] = useState(false);

  function handleMouseEnter() {
    salesIconRef.current?.startAnimation();
    setHovered(true);
    onActivate?.();
  }

  function handleMouseLeave() {
    salesIconRef.current?.stopAnimation();
    setHovered(false);
    onDeactivate?.();
  }

  const images = property.images?.length ? property.images : property.image ? [property.image] : [];
  const action = onRemove ? (
    <RemoveButton onRemove={onRemove} />
  ) : canFavorite ? (
    <FavoriteButton isFavorite={isFavorite} onToggle={toggleFavorite} />
  ) : null;

  function continueToLogin() {
    closeLoginPrompt();
    setAuthMounted(true);
    authModal.open();
  }

  return (
    <>
      <Link
        href={`/propiedades/${property.slug}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={onActivate}
        onBlur={onDeactivate}
        onClick={analyticsList ? () => trackSelectItem(property, analyticsList, index) : undefined}
        className={`group flex flex-col ${variant === "reel" ? "h-full" : ""}`}
      >
        {variant !== "default" ? (
          <CardPhoto
            property={property}
            images={images}
            sizes={sizes}
            eager={eager}
            className={`${OVERLAY_PHOTO_CLASS[variant]} ${
              variant === "highlighted" && hovered ? "ring-4 ring-accent ring-offset-2" : ""
            }`}
            fitLandscape
            pinned={variant === "highlighted" && hovered}
            salesIconRef={salesIconRef}
            action={action}
            media={
              variant === "reel" ? (
                <ReelMedia
                  images={images}
                  videoId={property.videoId}
                  title={property.title}
                  sizes={sizes}
                  eager={eager}
                  mode={reelMode}
                />
              ) : property.videoId ? (
                <HighlightedCardMedia
                  images={images}
                  videoId={property.videoId}
                  title={property.title}
                  sizes={sizes}
                  eager={eager}
                  hovered={hovered}
                />
              ) : undefined
            }
          >
            {/* Dark fade at the bottom so the white details read on any photo. */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-5 pb-5 pt-28">
              <CardDetails property={property} overlay />
            </div>
          </CardPhoto>
        ) : (
          <>
            <CardPhoto
              property={property}
              images={images}
              sizes={sizes}
              eager={eager}
              className={`aspect-square ${active ? "ring-2 ring-accent" : ""}`}
              salesIconRef={salesIconRef}
              action={action}
            />
            <div className="mt-3">
              <CardDetails property={property} />
            </div>
          </>
        )}
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

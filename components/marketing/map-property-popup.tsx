import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Heart, X } from "lucide-react";

import { formatPrice, TYPE_LABELS, type Property } from "@/components/marketing/properties";

/** Max pagination dots shown under the photo, like the listing cards on Airbnb. */
const MAX_DOTS = 5;

const circleButton =
  "flex size-8 items-center justify-center rounded-full bg-white/95 text-black shadow-sm transition-transform hover:scale-105";

/**
 * Listing card shared by the map popup and the /search results list: photo
 * carousel, favorite (+ close in the popup) and the property summary. The
 * list variant is compact and adds a few extra details.
 */
export function PropertyListingCard({
  property,
  variant,
  active = false,
  onClose,
  onActivate,
  onDeactivate,
}: {
  property: Property;
  variant: "popup" | "list";
  active?: boolean;
  onClose?: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
}) {
  const images = property.images?.length
    ? property.images
    : property.image
      ? [property.image]
      : [];
  const [index, setIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const name = property.projectName || property.title;
  const href = `/propiedades/${property.slug}`;
  const isPopup = variant === "popup";

  const go = (delta: number) => (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIndex((current) => (current + delta + images.length) % images.length);
  };

  // Slide the visible window of dots so the active one stays in view.
  const dotStart = Math.min(
    Math.max(0, index - Math.floor(MAX_DOTS / 2)),
    Math.max(0, images.length - MAX_DOTS),
  );
  const dots = images.slice(dotStart, dotStart + MAX_DOTS).map((_, i) => dotStart + i);

  const details = [
    `${property.beds} hab`,
    `${property.baths} baños`,
    `${property.area} m²`,
    ...(isPopup ? [] : [`${property.parking} parq.`]),
  ].join(" · ");

  return (
    <div
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      className={
        isPopup
          ? "group w-[327px] overflow-hidden rounded-2xl bg-white text-left shadow-[0_6px_24px_rgba(0,0,0,0.22)]"
          : "group flex flex-col text-left"
      }
    >
      <div
        className={
          isPopup
            ? "relative h-[212px] w-full bg-[#eef2f6]"
            : `relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#eef2f6] transition-shadow ${
                active ? "ring-2 ring-[#222222]" : ""
              }`
        }
      >
        {images.length > 0 ? (
          <Link href={href} className="block size-full overflow-hidden">
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {images.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src + i}
                  src={src}
                  alt={name}
                  loading={i === 0 ? "eager" : "lazy"}
                  draggable={false}
                  className="h-full w-full flex-none object-cover"
                />
              ))}
            </div>
          </Link>
        ) : (
          <Link
            href={href}
            className="block size-full"
            style={{
              background: `linear-gradient(135deg, oklch(0.93 0.05 ${property.hue}), oklch(0.82 0.09 ${property.hue}))`,
            }}
          />
        )}

        <div className="absolute right-2.5 top-2.5 flex gap-2">
          <button
            type="button"
            onClick={() => setIsFavorite((value) => !value)}
            aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
            className={circleButton}
          >
            <Heart
              className={`size-4 ${isFavorite ? "fill-[#ff385c] text-[#ff385c]" : ""}`}
              strokeWidth={2.25}
            />
          </button>
          {onClose ? (
            <button type="button" onClick={onClose} aria-label="Cerrar" className={circleButton}>
              <X className="size-4" strokeWidth={2.25} />
            </button>
          ) : null}
        </div>

        {isPopup ? null : (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-[#222222] shadow-sm">
            {property.status}
          </span>
        )}

        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={go(-1)}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-black opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
            >
              <ChevronLeft className="size-4" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={go(1)}
              aria-label="Foto siguiente"
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-black opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
            >
              <ChevronRight className="size-4" strokeWidth={2.5} />
            </button>
            <div className="pointer-events-none absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
              {dots.map((i) => (
                <span
                  key={i}
                  className={`rounded-full bg-white transition-all ${
                    i === index ? "size-[7px] opacity-100" : "size-1.5 opacity-60"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <Link
        href={href}
        className={
          isPopup
            ? "block px-4 pb-4 pt-3 text-[15px]"
            : "mt-2 block text-sm"
        }
      >
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate font-semibold text-[#222222]">{name}</h3>
          <span className="shrink-0 text-[0.87em] text-[#222222]">
            {TYPE_LABELS[property.type]}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[#6a6a6a]">
          {[property.neighborhood, property.city].filter(Boolean).join(", ")}
        </p>
        {!isPopup && property.address ? (
          <p className="truncate text-[0.87em] text-[#6a6a6a]">{property.address}</p>
        ) : null}
        <p className="mt-0.5 text-[#6a6a6a]">{details}</p>
        {!isPopup && property.stratum ? (
          <p className="text-[0.87em] text-[#6a6a6a]">Estrato {property.stratum}</p>
        ) : null}
        <p className="mt-1 text-[#222222]">
          <span className="font-semibold">{formatPrice(property)} COP</span>
          {property.type === "proyecto" ? <span className="text-[#6a6a6a]"> desde</span> : null}
        </p>
        {isPopup ? (
          <span className="mt-2 inline-block rounded-md bg-[#f2f2f2] px-2 py-0.5 text-xs font-medium text-[#484848]">
            {property.status}
          </span>
        ) : null}
      </Link>
    </div>
  );
}

/** Floating property card shown above a map pin. */
export function MapPropertyPopup({
  property,
  onClose,
}: {
  property: Property;
  onClose: () => void;
}) {
  return <PropertyListingCard property={property} variant="popup" onClose={onClose} />;
}

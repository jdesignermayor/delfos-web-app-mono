"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import ReactDOM from "react-dom";
import { HeartIcon } from "lucide-animated";
import { useOverlayState } from "@heroui/react";

import { BuildingIcon } from "@/components/icons";
import { formatPrice, type Property } from "@/components/marketing/properties";
import { propertyItem, trackEvent } from "@/lib/analytics";

/**
 * The sign-in modal is only needed after a signed-out visitor taps the heart,
 * so it's code-split and mounted on demand instead of once per card.
 */
const AuthModal = dynamic(() => import("@/components/marketing/auth-modal").then((mod) => mod.AuthModal), {
  ssr: false,
});

/** Photo with a pulsing placeholder underneath; the photo fades in once decoded. */
function CardPhoto({ src, alt, sizes, eager }: { src: string; alt: string; sizes: string; eager: boolean }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {loaded ? null : <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-surface-secondary" />}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        // An image that finished before hydration never fires onLoad, so check `complete` too.
        ref={(img) => {
          if (img?.complete && img.naturalWidth > 0) setLoaded(true);
        }}
        onLoad={() => setLoaded(true)}
        className={`object-cover transition-[opacity,transform] duration-300 group-hover:scale-105 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
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
  analyticsList?: { id: string; name: string };
  /** Position in that list (0-based), reported with the click. */
  index?: number;
  active?: boolean;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onLoginRequired?: () => void;
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [lastEmail, setLastEmail] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const authModal = useOverlayState();
  const [authMounted, setAuthMounted] = useState(false);

  const maskEmail = (email: string) => {
    if (!email || email.length < 5) return email;
    const [localPart, domain] = email.split("@");
    const maskedLocal = localPart.charAt(0) + "*".repeat(Math.max(0, localPart.length - 2)) + (localPart.length > 1 ? localPart.charAt(localPart.length - 1) : "");
    return `${maskedLocal}@${domain}`;
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("auth_token");

    if (!isLoggedIn) {
      const storedEmail = typeof window !== "undefined" ? localStorage.getItem("last_email") : null;
      setLastEmail(storedEmail);
      setShowLoginPrompt(true);
      onLoginRequired?.();
      return;
    }

    setIsFavorite(!isFavorite);
  };

  return (
    <>
      <Link
        href={`/propiedades/${property.slug}`}
        onMouseEnter={onActivate}
        onMouseLeave={onDeactivate}
        onFocus={onActivate}
        onBlur={onDeactivate}
        onClick={() => {
          if (!analyticsList) return;
          trackEvent("select_item", {
            item_list_id: analyticsList.id,
            item_list_name: analyticsList.name,
            items: [propertyItem(property, index)],
          });
        }}
        className="group flex flex-col"
      >
        <div
          className={`relative aspect-square w-full overflow-hidden rounded-2xl transition-shadow ${
            active ? "ring-2 ring-accent" : ""
          }`}
          style={
            property.image
              ? undefined
              : {
                  background: `linear-gradient(135deg, oklch(0.93 0.05 ${property.hue}), oklch(0.82 0.09 ${property.hue}))`,
                }
          }
        >
          {property.image ? (
            <CardPhoto src={property.image} alt={property.title} sizes={sizes} eager={eager} />
          ) : (
            <BuildingIcon className="absolute -bottom-6 -right-4 size-40 text-white/25" />
          )}

          <button
            type="button"
            onClick={handleFavoriteClick}
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full backdrop-blur-sm bg-white/20 text-white transition-all hover:bg-white/30"
            aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <HeartIcon
              size={20}
              className={`transition-colors ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
            />
          </button>
        </div>

        <div className="mt-3">
          <h3 className="truncate font-medium text-foreground">{property.title}</h3>
          <p className="mt-0.5 text-sm text-muted">Desde {formatPrice(property)}</p>
        </div>
      </Link>

      {/* Login Prompt Modal - Using Portals */}
      {showLoginPrompt && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/25">
          <div className="light w-full max-w-sm rounded-lg border border-separator bg-white shadow-lg" style={{ colorScheme: "light" }}>
            <div className="border-b border-separator px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">Guardar favoritos</h2>
            </div>

            <div className="flex flex-col items-center gap-4 px-6 py-6 text-center">
              {lastEmail ? (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-2xl font-bold text-white">
                    {lastEmail.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{maskEmail(lastEmail)}</p>
                    <p className="text-sm text-muted">Continúa con esta cuenta</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-foreground">Inicia sesión para guardar favoritos</p>
              )}
            </div>

            <div className="flex gap-2 border-t border-separator px-6 py-4">
              <button
                type="button"
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 rounded px-4 py-2 font-medium text-foreground transition-colors hover:bg-surface"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLoginPrompt(false);
                  setAuthMounted(true);
                  authModal.open();
                }}
                className="flex-1 rounded bg-accent px-4 py-2 font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {authMounted ? <AuthModal state={authModal} /> : null}
    </>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import ReactDOM from "react-dom";
import { HeartIcon } from "lucide-animated";
import { useOverlayState } from "@heroui/react";

import { BuildingIcon } from "@/components/icons";
import { formatPrice, type Property } from "@/components/marketing/properties";
import { AuthModal } from "@/components/marketing/auth-modal";

export function PropertyCard({
  property,
  active = false,
  onActivate,
  onDeactivate,
  onLoginRequired,
}: {
  property: Property;
  active?: boolean;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onLoginRequired?: () => void;
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [lastEmail, setLastEmail] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const authModal = useOverlayState();

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
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={property.image}
              alt={property.title}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
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

      <AuthModal state={authModal} />
    </>
  );
}

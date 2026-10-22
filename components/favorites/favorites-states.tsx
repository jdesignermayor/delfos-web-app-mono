"use client";

import Link from "next/link";
import { useOverlayState } from "@heroui/react";

import { AuthModal } from "@/components/marketing/auth-modal";

export const FAVORITES_GRID = "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4";

/** Card width per breakpoint, matching `FAVORITES_GRID`, for next/image. */
export const FAVORITES_CARD_SIZES = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";

export function FavoritesGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div aria-hidden className={FAVORITES_GRID}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          <div className="aspect-square w-full animate-pulse rounded-2xl bg-surface-secondary" />
          <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-surface-secondary" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-surface-secondary" />
        </div>
      ))}
    </div>
  );
}

/** Signed-out visitors: favorites and recent views belong to an account. */
export function FavoritesSignedOut() {
  const authModal = useOverlayState();

  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-separator px-6 py-16 text-center">
      <p className="font-semibold text-foreground">Inicia sesión para ver tus favoritos</p>
      <p className="mt-1 max-w-sm text-sm text-muted">
        Guarda propiedades con el corazón y encuentra aquí las que viste recientemente.
      </p>
      <button
        type="button"
        onClick={authModal.open}
        className="mt-5 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-white transition-[filter] hover:brightness-125"
      >
        Iniciar sesión
      </button>
      {/* Stays here after signing in: the shared favorites state reloads and the lists appear. */}
      <AuthModal state={authModal} stayOnPage />
    </div>
  );
}

export function FavoritesLoadError() {
  return (
    <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
      No pudimos cargar tus favoritos. Intenta de nuevo.
    </p>
  );
}

export function EmptyList({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-separator px-6 py-12 text-center">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      <Link href="/search" className="mt-5 text-sm font-semibold text-accent hover:underline">
        Explorar propiedades
      </Link>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/** Goes back in history when the visitor came from this site, or to `fallbackHref` otherwise. */
function useBack(fallbackHref: string) {
  const router = useRouter();
  return () => {
    const cameFromSite = document.referrer.startsWith(window.location.origin);
    if (cameFromSite && window.history.length > 1) router.back();
    else router.push(fallbackHref);
  };
}

/** Top bar of the favorites pages, like the photo tour's: "Volver" on the left, an action on the right. */
export function FavoritesHeader({ fallbackHref, action }: { fallbackHref: string; action?: ReactNode }) {
  const back = useBack(fallbackHref);

  return (
    <header className="sticky top-0 z-40 border-b border-separator bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={back}
          aria-label="Volver"
          className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-foreground pl-2.5 pr-4 text-sm font-semibold text-white shadow-md transition-[filter] hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent max-sm:w-10 max-sm:px-0"
        >
          <ChevronLeft className="size-5" />
          <span className="max-sm:sr-only">Volver</span>
        </button>
        {action}
      </div>
    </header>
  );
}

/** Rounded text button for the header's right side ("Editar" / "Listo"). */
export function HeaderActionButton({
  children,
  onClick,
  isActive = false,
  isDisabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-pressed={isActive}
      className={`flex h-10 items-center rounded-full border px-4 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40 ${
        isActive
          ? "border-foreground bg-foreground text-white"
          : "border-separator text-foreground hover:bg-surface-secondary"
      }`}
    >
      {children}
    </button>
  );
}

"use client";

import { useId } from "react";
import { createPortal } from "react-dom";

import { maskEmail } from "@/lib/mask-email";

function AccountHint({ lastEmail }: { lastEmail: string | null }) {
  if (!lastEmail) {
    return <p className="text-sm text-foreground">Inicia sesión para guardar favoritos</p>;
  }
  return (
    <>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-2xl font-bold text-white">
        {lastEmail.charAt(0).toUpperCase()}
      </div>
      <div>
        <p className="font-medium text-foreground">{maskEmail(lastEmail)}</p>
        <p className="text-sm text-muted">Continúa con esta cuenta</p>
      </div>
    </>
  );
}

/** Asks a signed-out visitor to sign in before saving a favorite. Rendered in a portal over the page. */
export function FavoritesLoginPrompt({
  lastEmail,
  onCancel,
  onContinue,
}: {
  lastEmail: string | null;
  onCancel: () => void;
  onContinue: () => void;
}) {
  const titleId = useId();
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/25">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="light w-full max-w-sm rounded-lg border border-separator bg-white shadow-lg"
        style={{ colorScheme: "light" }}
      >
        <div className="border-b border-separator px-6 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-foreground">
            Guardar favoritos
          </h2>
        </div>

        <div className="flex flex-col items-center gap-4 px-6 py-6 text-center">
          <AccountHint lastEmail={lastEmail} />
        </div>

        <div className="flex gap-2 border-t border-separator px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded px-4 py-2 font-medium text-foreground transition-colors hover:bg-surface"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="flex-1 rounded bg-accent px-4 py-2 font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

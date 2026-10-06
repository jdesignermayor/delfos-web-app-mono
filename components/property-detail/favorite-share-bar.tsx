"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import ReactDOM from "react-dom";
import { useOverlayState } from "@heroui/react";

import { HeartIcon } from "@/components/icons/animated/heart";
import { SendIcon } from "@/components/icons/animated/send";
import { AuthModal } from "@/components/marketing/auth-modal";

type PropertyActionsValue = {
  title: string;
  saved: boolean;
  toggleSaved: () => void;
};

const PropertyActionsContext = createContext<PropertyActionsValue | null>(null);

function usePropertyActions() {
  const value = useContext(PropertyActionsContext);
  if (!value) throw new Error("PropertyActions must be rendered inside <PropertyActionsProvider>");
  return value;
}

const maskEmail = (email: string) => {
  if (!email || email.length < 5) return email;
  const [localPart, domain] = email.split("@");
  const maskedLocal = localPart.charAt(0) + "*".repeat(Math.max(0, localPart.length - 2)) + (localPart.length > 1 ? localPart.charAt(localPart.length - 1) : "");
  return `${maskedLocal}@${domain}`;
};

/**
 * Owns the "saved" flag, the login prompt and the auth modal once per page, so
 * every PropertyActions (the top bar and the photo tour header) stays in sync
 * without mounting its own copy of the modals.
 */
export function PropertyActionsProvider({ title, children }: { title: string; children: ReactNode }) {
  const [saved, setSaved] = useState(false);
  const [lastEmail, setLastEmail] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const authModal = useOverlayState();

  const toggleSaved = () => {
    const isLoggedIn = !!localStorage.getItem("auth_token");

    if (!isLoggedIn) {
      setLastEmail(localStorage.getItem("last_email"));
      setShowLoginPrompt(true);
      return;
    }

    setSaved((value) => !value);
  };

  return (
    <PropertyActionsContext.Provider value={{ title, saved, toggleSaved }}>
      {children}

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
    </PropertyActionsContext.Provider>
  );
}

/** Top action row: the listing name on the left, share + save on the right. */
export function FavoriteShareBar() {
  const { title } = usePropertyActions();
  return (
    <div className="flex items-center justify-between gap-4">
      <h1 className="truncate font-display text-lg font-semibold text-foreground sm:text-xl">
        {title}
      </h1>
      <PropertyActions />
    </div>
  );
}

/**
 * Share + save buttons. `compact` hides the labels below `sm`, for tight
 * headers like the photo tour.
 */
export function PropertyActions({ compact = false }: { compact?: boolean }) {
  const { title, saved, toggleSaved } = usePropertyActions();

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: window.location.href });
      } catch {
        // User dismissed the share sheet
      }
      return;
    }
    await navigator.clipboard?.writeText(window.location.href);
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={handleShare}
        className="flex items-center gap-1.5 rounded-full border border-separator px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary"
      >
        <SendIcon size={18} />
        <span className={compact ? "sr-only sm:not-sr-only" : undefined}>Compartir</span>
      </button>

      <button
        type="button"
        onClick={toggleSaved}
        aria-pressed={saved}
        className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
          saved
            ? "border-danger text-danger"
            : "border-separator text-foreground hover:bg-surface-secondary"
        }`}
      >
        <HeartIcon size={18} filled={saved} />
        <span className={compact ? "sr-only sm:not-sr-only" : undefined}>
          {saved ? "Guardado" : "Guardar"}
        </span>
      </button>
    </div>
  );
}

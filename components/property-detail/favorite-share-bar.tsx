"use client";

import { useState } from "react";
import ReactDOM from "react-dom";
import { useOverlayState } from "@heroui/react";

import { HeartIcon } from "@/components/icons/animated/heart";
import { SendIcon } from "@/components/icons/animated/send";
import { AuthModal } from "@/components/marketing/auth-modal";

/** Top action row: the listing name on the left, share + save on the right. */
export function FavoriteShareBar({ title }: { title: string }) {
  const [saved, setSaved] = useState(false);
  const [lastEmail, setLastEmail] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const authModal = useOverlayState();

  const maskEmail = (email: string) => {
    if (!email || email.length < 5) return email;
    const [localPart, domain] = email.split("@");
    const maskedLocal = localPart.charAt(0) + "*".repeat(Math.max(0, localPart.length - 2)) + (localPart.length > 1 ? localPart.charAt(localPart.length - 1) : "");
    return `${maskedLocal}@${domain}`;
  };

  async function handleShare() {
    if (typeof navigator === "undefined") return;
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

  const handleSaveClick = () => {
    const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("auth_token");

    if (!isLoggedIn) {
      const storedEmail = typeof window !== "undefined" ? localStorage.getItem("last_email") : null;
      setLastEmail(storedEmail);
      setShowLoginPrompt(true);
      return;
    }

    setSaved((value) => !value);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="truncate font-display text-lg font-semibold text-foreground sm:text-xl">
          {title}
        </h1>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-full border border-separator px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary"
          >
            <SendIcon size={18} />
            Compartir
          </button>

          <button
            type="button"
            onClick={handleSaveClick}
            aria-pressed={saved}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
              saved
                ? "border-danger text-danger"
                : "border-separator text-foreground hover:bg-surface-secondary"
            }`}
          >
            <HeartIcon size={18} filled={saved} />
            {saved ? "Guardado" : "Guardar"}
          </button>
        </div>
      </div>

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

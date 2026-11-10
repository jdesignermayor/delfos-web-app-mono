"use client";

import { useEffect, useRef, useState } from "react";
import { Headset } from "lucide-react";

/**
 * "Hablar con un agente" in the quote card, plus — on phones only — a floating copy of the same link
 * that stays in reach while the card is still further down the page. The floating one hides as soon
 * as the real button scrolls into view (and stays hidden once the reader has scrolled past it), so
 * there are never two on screen. It renders inside `BrandTheme`, so its ring takes the project's
 * colors (`--brand-*`), falling back to Delfos' accent.
 */
export function AgentCta({ href }: { href: string }) {
  const inlineRef = useRef<HTMLAnchorElement>(null);
  // Hidden until the first observation, so it never flashes in on a page opened at the card.
  const [showFloating, setShowFloating] = useState(false);

  useEffect(() => {
    const target = inlineRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      // Only while the real button is still *below* the viewport.
      setShowFloating(!entry.isIntersecting && entry.boundingClientRect.top > 0);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <a
        ref={inlineRef}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="brand-cta flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-hover px-4 py-3.5 text-base font-semibold text-accent-foreground shadow-sm transition-[filter] hover:brightness-110"
      >
        <Headset className="size-5" aria-hidden />
        Hablar con un agente
      </a>

      <div
        inert={!showFloating}
        className={`agent-fab fixed right-4 z-40 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none md:hidden ${
          showFloating ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
        // Sits just above the mobile tab bar (4rem + the home-indicator inset).
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Habla con tu asesor por WhatsApp (se abre en una nueva pestaña)"
          className="agent-fab-ring relative flex rounded-full p-[3px] shadow-[0_10px_30px_-8px_rgba(15,23,42,0.45)] outline-none transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          <span className="relative flex items-center gap-2.5 rounded-full bg-white py-2 pl-2 pr-4">
            <span className="brand-cta flex size-10 items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent-hover text-accent-foreground">
              <Headset className="agent-fab-icon size-5" aria-hidden />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-foreground">Habla con tu asesor</span>
              <span className="text-xs text-muted">Respuesta por WhatsApp</span>
            </span>
          </span>
        </a>
      </div>
    </>
  );
}

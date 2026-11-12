import type { CSSProperties } from "react";
import Link from "next/link";

import { BTN_PRIMARY, BTN_SECONDARY, SECTION } from "@/components/marketing/landing-tokens";
import { LIVE_ICON_TRIGGER, LiveIcon } from "@/components/marketing/live-icon";

/**
 * The closing ask, full-bleed ink (it follows the ink color takeover, so the screen stays covered)
 * with a faint visible grid. Huge white headline; the yellow primary action is the brightest thing on it.
 */
export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div aria-hidden="true" className="brut-grid pointer-events-none absolute inset-0 text-white" />
      <div className={`relative md:text-center ${SECTION}`}>
        <div>
          <h2 data-reveal="up" className="mx-auto max-w-4xl font-display text-5xl font-bold uppercase leading-[0.9] tracking-tighter text-balance sm:text-7xl">
            Tu próximo hogar te está esperando
          </h2>
          <p data-reveal="up" style={{ "--i": 1 } as CSSProperties} className="mx-auto mt-5 max-w-xl text-base text-white/80 sm:text-lg">
            Empieza tu búsqueda o publica tu primer proyecto en minutos.
          </p>
          <div data-reveal="stamp" style={{ "--i": 2 } as CSSProperties} className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            {/* On ink, an ink hard shadow would vanish: recolor it (shadow-<color> sets --tw-shadow-color). */}
            <Link {...LIVE_ICON_TRIGGER} href="/search?operacion=comprar" className={`${BTN_PRIMARY} shadow-white`}>
              Buscar propiedades
              <LiveIcon name="arrow" size={20} />
            </Link>
            <Link href="/dashboard" className={`${BTN_SECONDARY} shadow-brut-yellow`}>
              Publicar propiedad
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

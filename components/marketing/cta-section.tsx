import Link from "next/link";

import { BTN_PRIMARY, BTN_SECONDARY, SECTION } from "@/components/marketing/landing-tokens";
import { LIVE_ICON_TRIGGER, LiveIcon } from "@/components/marketing/live-icon";

/**
 * The closing ask: an ink block with a hard brand-blue offset shadow and a faint visible grid. Huge
 * uppercase white headline; the yellow primary action is the brightest thing on it.
 */
export function CtaSection() {
  return (
    <section className={SECTION}>
      <div className="relative overflow-hidden border-[1.5px] border-ink bg-ink px-5 py-14 text-white shadow-[5px_5px_0_0_var(--color-brut-blue)] sm:px-12 sm:py-20 md:text-center">
        <div aria-hidden="true" className="brut-grid pointer-events-none absolute inset-0 text-white" />
        <div className="relative">
          <h2 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-[1] tracking-tight text-balance sm:text-6xl">
            Tu próximo hogar te está esperando
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/80 sm:text-lg">
            Empieza tu búsqueda o publica tu primer proyecto en minutos.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
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

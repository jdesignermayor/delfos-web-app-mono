import type { CSSProperties } from "react";
import Link from "next/link";

import { CheckIcon } from "@/components/icons";
import { BLOCK, BORDER, BOX, BTN_INK, BTN_SECONDARY, type Block } from "@/components/marketing/landing-tokens";
import { LIVE_ICON_TRIGGER, LiveIcon, type LiveIconName } from "@/components/marketing/live-icon";
import { SectionHeading } from "@/components/marketing/section-heading";

type Feature = { icon: LiveIconName; title: string; body: string; block: Block };

const PUBLISH_POINTS = [
  "Publica proyectos de vivienda nueva por unidades o por torre completa.",
  "Administra disponibilidad, precios y separaciones desde un solo panel.",
  "Recibe solicitudes de compra y arriendo con los datos del interesado listos.",
];

const INVENTORY_FEATURES: Feature[] = [
  { icon: "layers", block: "blue", title: "Inventario por torre", body: "Unidades, pisos y tipologías organizados." },
  { icon: "sliders", block: "pink", title: "Precios y disponibilidad", body: "Actualiza en tiempo real y sin recargar." },
  { icon: "coins", block: "mint", title: "Separaciones en línea", body: "Con soporte de pago y seguimiento." },
  { icon: "clipboard", block: "yellow", title: "Solicitudes de arriendo", body: "Con estudio del interesado incluido." },
];

/** A capability tile. Hover (desktop) or scrolling it into view (phones) plays its icon. */
function FeatureTile({ feature }: { feature: Feature }) {
  const { icon, title, body, block } = feature;
  return (
    <div {...LIVE_ICON_TRIGGER} className={`flex flex-col p-4 sm:p-5 ${BOX}`}>
      <div className={`flex size-11 items-center justify-center shadow-brut-sm ${BLOCK[block]} ${BORDER}`}>
        <LiveIcon name={icon} size={22} />
      </div>
      <p className="mt-4 font-display text-sm font-semibold leading-tight tracking-tight sm:text-base">{title}</p>
      <p className="mt-1.5 text-sm leading-snug text-ink/80">{body}</p>
    </div>
  );
}

/**
 * The B2B chapter: a full-width yellow band (the page's loudest surface) so builders and owners
 * recognise "this part is for me". On yellow the primary action flips to an ink block.
 * Feature tiles go two-up even on phones: short tiles, half the scroll.
 */
export function PublishSection() {
  return (
    <section id="publicar" className="border-b-[3px] border-ink bg-brut-yellow text-ink">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading
            index="02"
            eyebrow="Para constructoras y propietarios"
            title="Publica y administra tus propiedades sin planillas"
          >
            Delfos está pensado para proyectos de vivienda nueva: carga el inventario una vez y controla ventas,
            arriendos y separaciones desde el mismo panel.
          </SectionHeading>
          <ul className="mt-8 flex flex-col gap-3">
            {PUBLISH_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-[0.95rem] font-medium">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center bg-ink text-brut-yellow">
                  <CheckIcon className="size-3.5" strokeWidth={3} />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link {...LIVE_ICON_TRIGGER} href="/dashboard" className={BTN_INK}>
              Publicar propiedad
              <LiveIcon name="arrow" size={20} />
            </Link>
            <Link href="/dashboard" className={BTN_SECONDARY}>
              Ver el panel
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          {INVENTORY_FEATURES.map((feature, index) => (
            <div key={feature.title} data-reveal="up" style={{ "--i": index } as CSSProperties}>
              <FeatureTile feature={feature} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

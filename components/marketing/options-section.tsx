import type { CSSProperties } from "react";
import Link from "next/link";

import { BLOCK, BORDER, PRESSABLE, SECTION, type Block } from "@/components/marketing/landing-tokens";
import { LIVE_ICON_TRIGGER, LiveIcon, type LiveIconName } from "@/components/marketing/live-icon";
import { SectionHeading } from "@/components/marketing/section-heading";

type Option = {
  icon: LiveIconName;
  title: string;
  body: string;
  cta: string;
  href: string;
  /** Each path is its own flat color, so the three read as distinct choices at a glance. */
  block: Block;
};

const OPTIONS: Option[] = [
  {
    icon: "home",
    title: "Compra tu hogar",
    body: "Apartamentos y casas nuevas listas para estrenar o sobre planos, con simulación de crédito y acompañamiento en toda la compra.",
    cta: "Ver en venta",
    href: "/search?operacion=comprar",
    block: "yellow",
  },
  {
    icon: "key",
    title: "Arrienda tu hogar",
    body: "Arriendos verificados con contrato digital, estudio en línea y entrega del inmueble sin trámites eternos.",
    cta: "Ver en arriendo",
    href: "/search?operacion=arrendar",
    block: "blue",
  },
  {
    icon: "percent",
    title: "Vivienda asequible",
    body: "Filtra proyectos de interés social y prioritario (VIS y VIP), cuota inicial baja y los subsidios a los que puedes aplicar.",
    cta: "Ver asequibles",
    href: "/search?asequible=si",
    block: "mint",
  },
];

/**
 * One flat color block per path. The whole block is the link (it's the thing to tap on a phone),
 * presses into its shadow like a physical button, and plays its icons while hovered or focused.
 */
function OptionCard({ option, index }: { option: Option; index: number }) {
  const { icon, title, body, cta, href, block } = option;
  return (
    <Link
      {...LIVE_ICON_TRIGGER}
      href={href}
      className={`group flex h-full flex-col p-5 text-ink outline-none sm:p-7 ${BLOCK[block]} ${BORDER} shadow-brut ${PRESSABLE} focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Icon in a white tile with its own small hard shadow. */}
        <div className={`flex size-14 items-center justify-center bg-white shadow-brut-sm ${BORDER}`}>
          <LiveIcon name={icon} size={28} />
        </div>
        <span aria-hidden="true" className="border border-ink bg-white px-1.5 font-mono text-sm font-bold">
          0{index + 1}
        </span>
      </div>
      <h3 className="mt-5 font-display text-2xl font-bold leading-tight tracking-tight">{title}</h3>
      <p className="mt-3 flex-1 text-[0.95rem] leading-relaxed text-ink/85">{body}</p>
      {/* Reads as the action; an ink bar spanning the card so it's an obvious, thumb-sized target on phones. */}
      <span className="mt-6 flex min-h-12 items-center justify-between gap-2 bg-ink px-4 font-mono text-xs font-medium uppercase tracking-[0.16em] text-white">
        {cta}
        <LiveIcon name="arrow" size={20} />
      </span>
    </Link>
  );
}

export function OptionsSection() {
  return (
    <section id="opciones" className={SECTION}>
      <SectionHeading
        className="max-w-3xl"
        index="01"
        eyebrow="Cómo quieres vivir"
        title="Un mismo lugar para comprar, arrendar o encontrar vivienda asequible"
      >
        Elige el camino que necesitas hoy. Puedes cambiar de opción cuando quieras y guardar tus búsquedas.
      </SectionHeading>

      <div className="mt-10 grid gap-5 sm:mt-14 md:grid-cols-3 md:gap-6">
        {OPTIONS.map((option, index) => (
          <div key={option.title} data-reveal="stamp" style={{ "--i": index } as CSSProperties}>
            <OptionCard option={option} index={index} />
          </div>
        ))}
      </div>
    </section>
  );
}

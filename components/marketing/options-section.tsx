import Link from "next/link";
import type { ComponentType } from "react";
import { Card } from "@heroui/react";

import { ArrowRightIcon, HomeIcon, KeyIcon, TagIcon } from "@/components/icons";
import { SectionHeading } from "@/components/marketing/section-heading";

type Option = {
  icon: ComponentType;
  title: string;
  body: string;
  cta: string;
  href: string;
};

const OPTIONS: Option[] = [
  {
    icon: HomeIcon,
    title: "Compra tu hogar",
    body: "Apartamentos y casas nuevas listas para estrenar o sobre planos, con simulación de crédito y acompañamiento en toda la compra.",
    cta: "Ver en venta",
    href: "/search?operacion=comprar",
  },
  {
    icon: KeyIcon,
    title: "Arrienda tu hogar",
    body: "Arriendos verificados con contrato digital, estudio en línea y entrega del inmueble sin trámites eternos.",
    cta: "Ver en arriendo",
    href: "/search?operacion=arrendar",
  },
  {
    icon: TagIcon,
    title: "Vivienda asequible",
    body: "Filtra proyectos de interés social y prioritario (VIS y VIP), cuota inicial baja y los subsidios a los que puedes aplicar.",
    cta: "Ver asequibles",
    href: "/search?asequible=si",
  },
];

function OptionCard({ option }: { option: Option }) {
  const { icon: Icon, title, body, cta, href } = option;
  return (
    // The whole card is the hit target (stretched link), with the CTA text as its accessible name.
    <Card className="group relative flex h-full cursor-pointer flex-col border border-transparent p-6 transition-[box-shadow,border-color,transform] duration-200 ease-out hover:border-accent/30 hover:shadow-lg focus-within:border-accent/40 motion-safe:hover:-translate-y-0.5">
      <div className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent transition-colors duration-200 group-hover:bg-accent group-hover:text-accent-foreground">
        <Icon />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{body}</p>
      <Link
        href={href}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent outline-none after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:ring-2 focus-visible:after:ring-focus"
      >
        {cta}
        <ArrowRightIcon className="size-4 transition-transform duration-200 motion-safe:group-hover:translate-x-1" />
      </Link>
    </Card>
  );
}

export function OptionsSection() {
  return (
    <section id="opciones" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <SectionHeading
        className="max-w-2xl"
        eyebrow="Cómo quieres vivir"
        title="Un mismo lugar para comprar, arrendar o encontrar vivienda asequible"
      >
        Elige el camino que necesitas hoy. Puedes cambiar de opción cuando quieras y guardar tus búsquedas.
      </SectionHeading>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {OPTIONS.map((option) => (
          <OptionCard key={option.title} option={option} />
        ))}
      </div>
    </section>
  );
}

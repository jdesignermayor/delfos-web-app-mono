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
    <Card className="flex h-full flex-col p-6">
      <div className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
        <Icon />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 flex-1 text-sm text-muted">{body}</p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
      >
        {cta}
        <ArrowRightIcon className="size-4" />
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

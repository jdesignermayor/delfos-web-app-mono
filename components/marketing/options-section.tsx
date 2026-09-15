import Link from "next/link";
import { Card } from "@heroui/react";

import { ArrowRightIcon, HomeIcon, KeyIcon, TagIcon } from "@/components/icons";

const OPTIONS = [
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

export function OptionsSection() {
  return (
    <section id="opciones" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="max-w-2xl">
        <span className="text-sm font-medium text-accent">Cómo quieres vivir</span>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Un mismo lugar para comprar, arrendar o encontrar vivienda asequible
        </h2>
        <p className="mt-4 text-lg text-muted">
          Elige el camino que necesitas hoy. Puedes cambiar de opción cuando
          quieras y guardar tus búsquedas.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {OPTIONS.map((option) => (
          <Card key={option.title} className="flex h-full flex-col p-6">
            <div className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <option.icon />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{option.title}</h3>
            <p className="mt-2 flex-1 text-sm text-muted">{option.body}</p>
            <Link
              href={option.href}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
            >
              {option.cta}
              <ArrowRightIcon className="size-4" />
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}

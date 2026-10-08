import Link from "next/link";
import type { ComponentType } from "react";
import { Card, buttonVariants } from "@heroui/react";

import {
  ArrowRightIcon,
  BuildingIcon,
  CheckIcon,
  HomeIcon,
  KeyIcon,
  SlidersIcon,
} from "@/components/icons";
import { SectionHeading } from "@/components/marketing/section-heading";

type Feature = { icon: ComponentType<{ className?: string }>; title: string; body: string };

const PUBLISH_POINTS = [
  "Publica proyectos de vivienda nueva por unidades o por torre completa.",
  "Administra disponibilidad, precios y separaciones desde un solo panel.",
  "Recibe solicitudes de compra y arriendo con los datos del interesado listos.",
];

const INVENTORY_FEATURES: Feature[] = [
  { icon: BuildingIcon, title: "Inventario por torre", body: "Unidades, pisos y tipologías organizados." },
  { icon: SlidersIcon, title: "Precios y disponibilidad", body: "Actualiza en tiempo real y sin recargar." },
  { icon: KeyIcon, title: "Separaciones en línea", body: "Con soporte de pago y seguimiento." },
  { icon: HomeIcon, title: "Solicitudes de arriendo", body: "Con estudio del interesado incluido." },
];

function FeatureTile({ feature }: { feature: Feature }) {
  const { icon: Icon, title, body } = feature;
  return (
    <div className="rounded-xl border border-separator bg-surface p-4">
      <div className="flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
        <Icon className="size-[18px]" />
      </div>
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted">{body}</p>
    </div>
  );
}

export function PublishSection() {
  return (
    <section id="publicar" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="Para constructoras y propietarios"
            title="Publica y administra tus propiedades sin planillas"
          >
            Delfos está pensado para proyectos de vivienda nueva: carga el inventario una vez y controla ventas,
            arriendos y separaciones desde el mismo panel.
          </SectionHeading>
          <ul className="mt-6 flex flex-col gap-3">
            {PUBLISH_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-accent" />
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className={buttonVariants({ variant: "primary", size: "lg" })}>
              Publicar propiedad
              <ArrowRightIcon />
            </Link>
            <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Ver el panel
            </Link>
          </div>
        </div>

        <Card className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {INVENTORY_FEATURES.map((feature) => (
              <FeatureTile key={feature.title} feature={feature} />
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

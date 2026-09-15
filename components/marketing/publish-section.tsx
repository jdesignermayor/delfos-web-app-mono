import Link from "next/link";
import { Card, buttonVariants } from "@heroui/react";

import {
  ArrowRightIcon,
  BuildingIcon,
  CheckIcon,
  HomeIcon,
  KeyIcon,
  SlidersIcon,
} from "@/components/icons";

const PUBLISH_POINTS = [
  "Publica proyectos de vivienda nueva por unidades o por torre completa.",
  "Administra disponibilidad, precios y separaciones desde un solo panel.",
  "Recibe solicitudes de compra y arriendo con los datos del interesado listos.",
];

const INVENTORY_FEATURES = [
  { icon: BuildingIcon, title: "Inventario por torre", body: "Unidades, pisos y tipologías organizados." },
  { icon: SlidersIcon, title: "Precios y disponibilidad", body: "Actualiza en tiempo real y sin recargar." },
  { icon: KeyIcon, title: "Separaciones en línea", body: "Con soporte de pago y seguimiento." },
  { icon: HomeIcon, title: "Solicitudes de arriendo", body: "Con estudio del interesado incluido." },
];

export function PublishSection() {
  return (
    <section id="publicar" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <span className="text-sm font-medium text-accent">Para constructoras y propietarios</span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Publica y administra tus propiedades sin planillas
          </h2>
          <p className="mt-4 text-lg text-muted">
            Delfos está pensado para proyectos de vivienda nueva: carga el
            inventario una vez y controla ventas, arriendos y separaciones
            desde el mismo panel.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {PUBLISH_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-accent" />
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              Publicar propiedad
              <ArrowRightIcon />
            </Link>
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Ver el panel
            </Link>
          </div>
        </div>

        <Card className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {INVENTORY_FEATURES.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-separator bg-surface p-4"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <item.icon className="size-[18px]" />
                </div>
                <p className="mt-3 text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

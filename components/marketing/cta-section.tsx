import Link from "next/link";
import { buttonVariants } from "@heroui/react";

import { ArrowRightIcon } from "@/components/icons";

export function CtaSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="relative overflow-hidden rounded-3xl border border-separator bg-surface px-6 py-16 text-center shadow-[0_24px_70px_-32px_rgba(15,23,42,0.35)]">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_80%_at_50%_0%,var(--color-accent-soft),transparent_70%)]" />
        <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Tu próximo hogar te está esperando
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          Empieza tu búsqueda o publica tu primer proyecto en minutos.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/search?operacion=comprar"
            className={buttonVariants({ variant: "primary", size: "lg" })}
          >
            Buscar propiedades
            <ArrowRightIcon />
          </Link>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Publicar propiedad
          </Link>
        </div>
      </div>
    </section>
  );
}

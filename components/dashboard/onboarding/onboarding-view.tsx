import Link from "next/link";
import { Avatar } from "@heroui/react";
import { ArrowRight, Building2, ShieldCheck, UserRound } from "lucide-react";

import { ConfirmFiduciasButton } from "@/components/dashboard/onboarding/confirm-fiducias-button";
import {
  OnboardingStep,
  PRIMARY_ACTION,
  SECONDARY_ACTION,
  StepCheck,
  type StepState,
} from "@/components/dashboard/onboarding/onboarding-step";
import { initials } from "@/lib/initials";
import type { OnboardingStatus } from "@/lib/onboarding";

const TOTAL_STEPS = 3;

/** "Buenos días" / "Buenas tardes" / "Buenas noches", in Colombian time. */
function greeting(date = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "America/Bogota" }).format(date),
  );
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

/** Greeting, progress and the three onboarding steps, drawn from `status`. */
export function OnboardingView({
  status,
  email,
  developerName,
}: {
  status: OnboardingStatus;
  email: string | null;
  developerName: string;
}) {
  const steps = [status.profile.done, status.fiducias.done, status.properties.done];
  const currentIndex = steps.findIndex((done) => !done);
  const stateOf = (index: number): StepState =>
    steps[index] ? "done" : index === currentIndex ? "current" : "upcoming";
  /** Only the current step's main action is filled; everything else stays quiet. */
  const actionClass = (index: number) => (stateOf(index) === "current" ? PRIMARY_ACTION : SECONDARY_ACTION);

  const name = status.profile.name;
  const firstName = name?.split(/\s+/)[0] ?? "";
  const progress = Math.round((status.completedSteps / TOTAL_STEPS) * 100);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 pb-12">
      {/* Greeting */}
      <section className="pt-2">
        <div className="flex items-center gap-4">
          <Avatar className="size-12 shrink-0">
            {status.profile.avatarUrl ? <Avatar.Image src={status.profile.avatarUrl} alt={name ?? "Tu foto"} /> : null}
            <Avatar.Fallback className="bg-surface-secondary text-foreground">{initials(name, email)}</Avatar.Fallback>
          </Avatar>
          <p className="text-sm text-muted">
            {greeting()} · {developerName}
          </p>
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">
          Hola{firstName ? `, ${firstName}` : ""}. Te damos la bienvenida a Delfos.
        </h1>
        <p className="mt-2 max-w-xl leading-relaxed text-muted">
          Completa estos {TOTAL_STEPS} pasos y tus proyectos estarán listos para llegar a los compradores.
        </p>

        <div className="mt-8 flex items-center gap-4">
          <div
            className="h-1 flex-1 overflow-hidden rounded-full bg-separator"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={TOTAL_STEPS}
            aria-valuenow={status.completedSteps}
            aria-label="Progreso de la configuración"
          >
            <div className="h-full rounded-full bg-[#4a7c59] transition-[width] duration-700 dark:bg-[#5e8f6c]" style={{ width: `${progress}%` }} />
          </div>
          <p className="shrink-0 text-xs tabular-nums text-muted">
            {status.completedSteps} de {TOTAL_STEPS}
          </p>
        </div>
      </section>

      {/* Steps */}
      <ol>
        <OnboardingStep
          number={1}
          icon={UserRound}
          title="Completa tu perfil"
          description="Agrega tu foto, nombre y teléfono para que tu equipo y los compradores sepan quién está detrás de cada proyecto."
          state={stateOf(0)}
          action={
            <Link href="/dashboard/profile" className={actionClass(0)}>
              Ir a mi perfil
              <ArrowRight className="size-4" strokeWidth={1.75} />
            </Link>
          }
        >
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <StepCheck ok={Boolean(status.profile.name)}>Nombre</StepCheck>
            <StepCheck ok={Boolean(status.profile.phone)}>Teléfono</StepCheck>
            <StepCheck ok={Boolean(status.profile.avatarUrl)}>Foto de perfil (opcional)</StepCheck>
          </ul>
        </OnboardingStep>

        <OnboardingStep
          number={2}
          icon={ShieldCheck}
          title="Verifica tus fiducias"
          description="Revisa que la fiducia de tus proyectos esté en la lista. Si no aparece, puedes agregarla en segundos."
          state={stateOf(1)}
          action={
            <>
              <Link href="/dashboard/fiducias" className={actionClass(1)}>
                Ver fiducias
                <ArrowRight className="size-4" strokeWidth={1.75} />
              </Link>
              <ConfirmFiduciasButton />
            </>
          }
        >
          <p className="text-sm text-foreground">
            {status.fiducias.total === 0
              ? "Aún no hay fiducias disponibles."
              : `${status.fiducias.total} ${status.fiducias.total === 1 ? "fiducia disponible" : "fiducias disponibles"}${
                  status.fiducias.own ? ` · ${status.fiducias.own} creada${status.fiducias.own === 1 ? "" : "s"} por ti` : ""
                }`}
          </p>
        </OnboardingStep>

        <OnboardingStep
          number={3}
          icon={Building2}
          title="Crea tu primera propiedad"
          description="Sube fotos, tipologías, precios y la ubicación de tu proyecto. Lo publicaremos para que los compradores lo encuentren."
          state={stateOf(2)}
          isLast
          action={
            <Link href="/dashboard/properties/new" className={actionClass(2)}>
              Crear propiedad
              <ArrowRight className="size-4" strokeWidth={1.75} />
            </Link>
          }
        />
      </ol>

      <p className="text-center text-sm text-muted">
        Al publicar tu primera propiedad, esta guía da paso a los indicadores de tus proyectos.
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { updateDeveloperAction } from "@/app/actions/developers";
import { ArrowRightIcon } from "@/components/icons";
import { DeveloperForm } from "@/components/dashboard/constructoras/developer-form";
import { requireSuperadmin } from "@/lib/auth/dal";
import { getDeveloper, parseDeveloperId, type DeveloperRow } from "@/lib/developers/developers";
import { toCompanyFormValues } from "@/lib/validation/company";
import type { DeveloperFormValues } from "@/lib/validation/developer";

export const metadata: Metadata = { title: "Editar constructora" };

function toFormValues(developer: DeveloperRow): DeveloperFormValues {
  return { ...toCompanyFormValues(developer), isEnabled: developer.isEnabled };
}

export default async function EditConstructoraPage({ params }: PageProps<"/dashboard/constructoras/[id]">) {
  await requireSuperadmin();
  const developerId = parseDeveloperId((await params).id);
  if (developerId === null) notFound();

  const developer = await getDeveloper(developerId);
  if (!developer) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href="/dashboard/constructoras"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowRightIcon className="size-4 rotate-180" />
        Volver a constructoras
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Editar constructora</h1>
        <p className="mt-1 text-sm text-muted">{developer.name}</p>
      </div>

      <DeveloperForm
        // Remount with fresh values if the row changes after a save elsewhere.
        key={developer.updatedAt ?? developer.id}
        developerId={developer.id}
        saveAction={updateDeveloperAction.bind(null, developer.id)}
        initialValues={toFormValues(developer)}
      />
    </div>
  );
}

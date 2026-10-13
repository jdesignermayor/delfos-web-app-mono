import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { updateCommonAreaAction } from "@/app/actions/common-areas";
import { ArrowRightIcon } from "@/components/icons";
import { CommonAreaForm } from "@/components/dashboard/zonas-comunes/common-area-form";
import { requireSuperadmin } from "@/lib/auth/dal";
import { getCommonArea, parseCommonAreaId } from "@/lib/common-areas/common-areas";
import { toContactFormValues } from "@/lib/validation/company";

export const metadata: Metadata = { title: "Editar zona común" };

export default async function EditZonaComunPage({ params }: PageProps<"/dashboard/zonas-comunes/[id]">) {
  await requireSuperadmin();
  const commonAreaId = parseCommonAreaId((await params).id);
  if (commonAreaId === null) notFound();

  const commonArea = await getCommonArea(commonAreaId);
  if (!commonArea) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href="/dashboard/zonas-comunes"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowRightIcon className="size-4 rotate-180" />
        Volver a zonas comunes
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Editar zona común</h1>
        <p className="mt-1 text-sm text-muted">{commonArea.name}</p>
      </div>

      <CommonAreaForm
        // Remount with fresh values if the row changes after a save elsewhere.
        key={commonArea.updatedAt ?? commonArea.id}
        commonAreaId={commonArea.id}
        saveAction={updateCommonAreaAction.bind(null, commonArea.id)}
        initialValues={toContactFormValues(commonArea)}
      />
    </div>
  );
}

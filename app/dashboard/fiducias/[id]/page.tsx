import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { updateTrustCompanyAction } from "@/app/actions/trust-companies";
import { ArrowRightIcon } from "@/components/icons";
import { TrustCompanyForm } from "@/components/dashboard/fiducias/trust-company-form";
import { requireDashboardUser } from "@/lib/auth/dal";
import { canAccessEntity } from "@/lib/auth/permissions";
import { getTrustCompany, parseTrustCompanyId } from "@/lib/trust-companies/trust-companies";
import { toCompanyFormValues } from "@/lib/validation/company";

export const metadata: Metadata = { title: "Editar fiducia" };

export default async function EditFiduciaPage({ params }: PageProps<"/dashboard/fiducias/[id]">) {
  // Constructora admins can list fiducias but only superadmins edit them.
  const user = await requireDashboardUser();
  if (!canAccessEntity(user, "trust_companies", "modify")) redirect("/dashboard/fiducias");

  const trustCompanyId = parseTrustCompanyId((await params).id);
  if (trustCompanyId === null) notFound();

  const trustCompany = await getTrustCompany(trustCompanyId);
  if (!trustCompany) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href="/dashboard/fiducias"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowRightIcon className="size-4 rotate-180" />
        Volver a fiducias
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Editar fiducia</h1>
        <p className="mt-1 text-sm text-muted">{trustCompany.name}</p>
      </div>

      <TrustCompanyForm
        // Remount with fresh values if the row changes after a save elsewhere.
        key={trustCompany.updatedAt ?? trustCompany.id}
        trustCompanyId={trustCompany.id}
        saveAction={updateTrustCompanyAction.bind(null, trustCompany.id)}
        initialValues={toCompanyFormValues(trustCompany)}
      />
    </div>
  );
}

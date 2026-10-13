import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { updateBankAction } from "@/app/actions/banks";
import { ArrowRightIcon } from "@/components/icons";
import { BankForm } from "@/components/dashboard/bancos/bank-form";
import { DeleteBankButton } from "@/components/dashboard/bancos/delete-bank-button";
import { requireSuperadmin } from "@/lib/auth/dal";
import { getBank, parseBankId } from "@/lib/banks/banks";
import { toCompanyFormValues } from "@/lib/validation/company";

export const metadata: Metadata = { title: "Editar banco" };

export default async function EditBancoPage({ params }: PageProps<"/dashboard/bancos/[id]">) {
  await requireSuperadmin();
  const bankId = parseBankId((await params).id);
  if (bankId === null) notFound();

  const bank = await getBank(bankId);
  if (!bank) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href="/dashboard/bancos"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowRightIcon className="size-4 rotate-180" />
        Volver a bancos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Editar banco</h1>
          <p className="mt-1 text-sm text-muted">{bank.name}</p>
        </div>
        <DeleteBankButton bankId={bank.id} name={bank.name} redirectTo="/dashboard/bancos" placement="page" />
      </div>

      <BankForm
        // Remount with fresh values if the row changes after a save elsewhere.
        key={bank.updatedAt ?? bank.id}
        bankId={bank.id}
        saveAction={updateBankAction.bind(null, bank.id)}
        initialValues={toCompanyFormValues(bank)}
      />
    </div>
  );
}

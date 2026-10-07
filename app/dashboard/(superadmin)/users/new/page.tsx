import type { Metadata } from "next";

import { createAdminUserAction } from "@/app/actions/users";
import { AdminUserForm } from "@/components/dashboard/users/admin-user-form";
import { requireSuperadmin } from "@/lib/auth/dal";
import { getDeveloperOptions } from "@/lib/data/developer-options";

export const metadata: Metadata = { title: "Nuevo usuario" };

export default async function NewUserPage() {
  await requireSuperadmin();
  const developers = await getDeveloperOptions();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo usuario</h1>
        <p className="mt-1 text-sm text-muted">
          Crea la cuenta de una constructora. Podrá ingresar al dashboard para crear y editar sus
          propiedades, y crear fiducias, mientras la constructora esté habilitada.
        </p>
      </div>

      <AdminUserForm mode="create" saveAction={createAdminUserAction} developers={developers} />
    </div>
  );
}

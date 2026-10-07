import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { updateAdminUserAction } from "@/app/actions/users";
import { ArrowRightIcon } from "@/components/icons";
import { AdminUserForm } from "@/components/dashboard/users/admin-user-form";
import { requireSuperadmin } from "@/lib/auth/dal";
import { getDeveloperOptions } from "@/lib/data/developer-options";
import { getAdminUser, type AdminUserRow } from "@/lib/users/admin-users";
import type { AdminUserFormValues } from "@/lib/validation/admin-user";

export const metadata: Metadata = { title: "Editar usuario" };

function toFormValues(user: AdminUserRow): AdminUserFormValues {
  return {
    name: user.name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    password: "",
    developerId: user.developer ? String(user.developer.id) : "",
    isActive: user.isActive,
  };
}

export default async function EditUserPage({ params }: PageProps<"/dashboard/users/[id]">) {
  await requireSuperadmin();
  const { id } = await params;
  const [user, developers] = await Promise.all([getAdminUser(id), getDeveloperOptions()]);
  if (!user) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href="/dashboard/users"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowRightIcon className="size-4 rotate-180" />
        Volver a usuarios
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Editar usuario</h1>
        <p className="mt-1 text-sm text-muted">
          {user.name || user.email} · {user.developer?.name ?? "Sin constructora"}
        </p>
      </div>

      <AdminUserForm
        mode="update"
        saveAction={updateAdminUserAction.bind(null, user.id)}
        developers={developers}
        initialValues={toFormValues(user)}
      />
    </div>
  );
}

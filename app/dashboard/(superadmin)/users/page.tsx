import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants, Card } from "@heroui/react";
import { Plus } from "lucide-react";

import { AdminUsersTable } from "@/components/dashboard/users/admin-users-table";
import { requireSuperadmin } from "@/lib/auth/dal";
import { listAdminUsers } from "@/lib/users/admin-users";

export const metadata: Metadata = { title: "Usuarios" };

export default async function UsersPage() {
  await requireSuperadmin();
  const { data: users, error } = await listAdminUsers();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
          <p className="mt-1 text-sm text-muted">
            Cuentas de las constructoras: gestionan sus propias propiedades y fiducias.
          </p>
        </div>
        <Link href="/dashboard/users/new" className={buttonVariants({ variant: "primary", size: "sm" })}>
          <Plus className="size-4" />
          Nuevo usuario
        </Link>
      </div>

      <Card className="p-0">
        {error ? (
          <p className="p-5 text-sm text-danger">No se pudieron cargar los usuarios: {error}</p>
        ) : (
          <AdminUsersTable users={users} />
        )}
      </Card>
    </div>
  );
}

import Link from "next/link";
import { buttonVariants, Chip } from "@heroui/react";

import type { AdminUserRow } from "@/lib/users/admin-users";

const dateFormat = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "America/Bogota" });

/** Whether the user can sign in right now, and why not. */
function accessStatus(user: AdminUserRow): { label: string; color: "success" | "warning" | "danger" } {
  if (!user.isActive) return { label: "Usuario deshabilitado", color: "danger" };
  if (!user.developer) return { label: "Sin constructora", color: "danger" };
  if (!user.developer.isEnabled) return { label: "Constructora deshabilitada", color: "warning" };
  return { label: "Activo", color: "success" };
}

function AdminUserTableRow({ user }: { user: AdminUserRow }) {
  const status = accessStatus(user);

  return (
    <tr className="hover:bg-surface-secondary/60">
      <td className="px-5 py-3 font-medium">{user.name || "—"}</td>
      <td className="px-5 py-3 text-muted">{user.email || "—"}</td>
      <td className="px-5 py-3 text-muted">{user.phone || "—"}</td>
      <td className="px-5 py-3 text-muted">{user.developer?.name ?? "—"}</td>
      <td className="px-5 py-3">
        <Chip size="sm" variant="soft" color={status.color}>
          {status.label}
        </Chip>
      </td>
      <td className="px-5 py-3 text-muted">
        {user.createdAt ? dateFormat.format(new Date(user.createdAt)) : "—"}
      </td>
      <td className="px-5 py-3 text-right">
        <Link href={`/dashboard/users/${user.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Editar
        </Link>
      </td>
    </tr>
  );
}

export function AdminUsersTable({ users }: { users: AdminUserRow[] }) {
  if (users.length === 0) {
    return (
      <p className="p-5 text-sm text-muted">
        Aún no hay usuarios de constructoras. Crea el primero con &ldquo;Nuevo usuario&rdquo;.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] text-sm">
        <thead>
          <tr className="border-b border-separator text-left text-xs uppercase tracking-wider text-muted">
            <th className="px-5 py-3 font-medium">Nombre</th>
            <th className="px-5 py-3 font-medium">Email</th>
            <th className="px-5 py-3 font-medium">Teléfono</th>
            <th className="px-5 py-3 font-medium">Constructora</th>
            <th className="px-5 py-3 font-medium">Estado</th>
            <th className="px-5 py-3 font-medium">Creado</th>
            <th className="px-5 py-3 text-right font-medium">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-separator">
          {users.map((user) => (
            <AdminUserTableRow key={user.id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

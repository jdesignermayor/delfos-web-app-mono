import Link from "next/link";
import type { Metadata } from "next";
import { Card, buttonVariants } from "@heroui/react";

import { ArrowRightIcon } from "@/components/icons";
import { getEntities } from "@/app/actions/entities";

export const metadata: Metadata = { title: "Fiducias" };

export default async function FidiciasPage() {
  const result = await getEntities("fiducias");
  const fiducias = result.success ? (result.data as any[]) : [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fiducias</h1>
          <p className="mt-1 text-sm text-muted">Gestiona las fiducias del sistema</p>
        </div>
        <Link href="/dashboard/fiducias/new" className={buttonVariants({ variant: "primary", size: "sm" })}>
          Nueva fiducia
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>

      <Card className="p-5">
        {fiducias.length === 0 ? (
          <p className="text-center text-muted">No hay fiducias registradas</p>
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-separator text-left text-xs uppercase tracking-wider text-muted">
                  <th className="py-2 pr-4 font-medium">Nombre</th>
                  <th className="py-2 pr-4 font-medium">NIT</th>
                  <th className="py-2 pr-4 font-medium">Teléfono</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pl-4 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator">
                {fiducias.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-secondary/60">
                    <td className="py-3 pr-4 font-medium">{item.name}</td>
                    <td className="py-3 pr-4 text-muted">{item.nit || "-"}</td>
                    <td className="py-3 pr-4 text-muted">{item.phone || "-"}</td>
                    <td className="py-3 pr-4 text-muted">{item.email || "-"}</td>
                    <td className="py-3 pl-4 text-right">
                      <Link href={`/dashboard/fiducias/${item.id}`} className="text-sm text-accent hover:underline">
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

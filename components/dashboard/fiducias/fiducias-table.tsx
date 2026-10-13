"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { QueryListState } from "@/components/dashboard/query-list-state";
import { trustCompanyQueries } from "@/lib/trust-companies/trust-company-queries";

/**
 * Fiducias list. Reads from the TanStack Query cache, which the page
 * prefetches on the server, so the first render already has the rows.
 */
export function FiduciasTable({ canEdit }: { canEdit: boolean }) {
  const query = useQuery(trustCompanyQueries.list());

  return (
    <QueryListState query={query} loadingMessage="Cargando fiducias…" emptyMessage="No hay fiducias registradas">
      {(fiducias) => (
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
                    {canEdit ? (
                      <Link href={`/dashboard/fiducias/${item.id}`} className="text-sm text-accent hover:underline">
                        Editar
                      </Link>
                    ) : (
                      <span className="text-xs text-muted">Solo lectura</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </QueryListState>
  );
}

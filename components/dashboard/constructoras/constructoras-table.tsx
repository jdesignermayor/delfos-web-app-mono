"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { QueryListState } from "@/components/dashboard/query-list-state";
import { DeleteDeveloperButton } from "@/components/dashboard/constructoras/delete-developer-button";
import { DeveloperEnabledSwitch } from "@/components/dashboard/constructoras/developer-enabled-switch";
import { developerQueries } from "@/lib/developers/developer-queries";

/**
 * Constructoras list. Reads from the TanStack Query cache, which the page
 * prefetches on the server, so the first render already has the rows.
 */
export function ConstructorasTable() {
  const query = useQuery(developerQueries.list());

  return (
    <QueryListState query={query} loadingMessage="Cargando constructoras…" emptyMessage="No hay constructoras registradas">
      {(constructoras) => (
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-separator text-left text-xs uppercase tracking-wider text-muted">
                <th className="py-2 pr-4 font-medium">Nombre</th>
                <th className="py-2 pr-4 font-medium">NIT</th>
                <th className="py-2 pr-4 font-medium">Teléfono</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Estado</th>
                <th className="py-2 pl-4 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator">
              {constructoras.map((item) => (
                <tr key={item.id} className="hover:bg-surface-secondary/60">
                  <td className="py-3 pr-4 font-medium">{item.name}</td>
                  <td className="py-3 pr-4 text-muted">{item.nit || "-"}</td>
                  <td className="py-3 pr-4 text-muted">{item.phone || "-"}</td>
                  <td className="py-3 pr-4 text-muted">{item.email || "-"}</td>
                  <td className="py-3 pr-4">
                    <DeveloperEnabledSwitch developerId={item.id} developerName={item.name} isEnabled={item.isEnabled} />
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/dashboard/constructoras/${item.id}`} className="text-sm text-accent hover:underline">
                        Editar
                      </Link>
                      <DeleteDeveloperButton developerId={item.id} name={item.name} />
                    </div>
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

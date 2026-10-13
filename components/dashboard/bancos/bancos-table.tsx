"use client";

import { useQuery } from "@tanstack/react-query";

import { DeleteBankButton } from "@/components/dashboard/bancos/delete-bank-button";
import { QueryListState } from "@/components/dashboard/query-list-state";
import { EditIconLink, RowActions } from "@/components/dashboard/row-actions";
import { bankQueries } from "@/lib/banks/bank-queries";
import { BANK_CODE_LABEL } from "@/lib/validation/bank";

/**
 * Bancos list. Reads from the TanStack Query cache, which the page
 * prefetches on the server, so the first render already has the rows.
 */
export function BancosTable() {
  const query = useQuery(bankQueries.list());

  return (
    <QueryListState query={query} loadingMessage="Cargando bancos…" emptyMessage="No hay bancos registrados">
      {(bancos) => (
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-separator text-left text-xs uppercase tracking-wider text-muted">
                <th className="py-2 pr-4 font-medium">Nombre</th>
                <th className="py-2 pr-4 font-medium">{BANK_CODE_LABEL}</th>
                <th className="py-2 pr-4 font-medium">Teléfono</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pl-4 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator">
              {bancos.map((item) => (
                <tr key={item.id} className="hover:bg-surface-secondary/60">
                  <td className="py-3 pr-4 font-medium">{item.name}</td>
                  <td className="py-3 pr-4 text-muted">{item.nit || "-"}</td>
                  <td className="py-3 pr-4 text-muted">{item.phone || "-"}</td>
                  <td className="py-3 pr-4 text-muted">{item.email || "-"}</td>
                  <td className="py-3 pl-4 text-right">
                    <RowActions>
                      <EditIconLink href={`/dashboard/bancos/${item.id}`} itemName={item.name} />
                      <DeleteBankButton bankId={item.id} name={item.name} />
                    </RowActions>
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

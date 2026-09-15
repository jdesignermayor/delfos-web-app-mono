"use client";

import { useMemo, useState } from "react";

import type { Property } from "@/components/marketing/properties";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/**
 * Rough, clearly-labeled rule of thumb — not financial advice: a rental
 * shouldn't exceed ~30% of monthly income, and a purchase price shouldn't
 * exceed ~4x annual income.
 */
export function AffordabilityCalculator({ property }: { property: Property }) {
  const [incomeInput, setIncomeInput] = useState("");
  const monthlyIncome = Number(incomeInput.replace(/\D/g, "")) || 0;

  const result = useMemo(() => {
    if (!monthlyIncome) return null;
    if (property.operation === "arrendar") {
      const maxRent = monthlyIncome * 0.3;
      return {
        affordable: property.price <= maxRent,
        maxAmount: maxRent,
        label: "Arriendo mensual recomendado",
      };
    }
    const maxPrice = monthlyIncome * 12 * 4;
    return {
      affordable: property.price <= maxPrice,
      maxAmount: maxPrice,
      label: "Valor de compra recomendado",
    };
  }, [monthlyIncome, property]);

  return (
    <div className="rounded-2xl border border-separator bg-surface p-5">
      <h3 className="text-sm font-semibold text-foreground">¿Puedo pagar esta propiedad?</h3>
      <p className="mt-1 text-xs text-muted">
        Un estimado según tu ingreso mensual — no es una pre-aprobación de crédito.
      </p>

      <label className="mt-4 block text-xs font-medium text-foreground">
        Ingreso mensual
        <input
          inputMode="numeric"
          value={incomeInput}
          onChange={(event) => setIncomeInput(event.target.value)}
          placeholder="$ 5.000.000"
          className="mt-1.5 w-full rounded-xl border border-separator bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
        />
      </label>

      {result ? (
        <div
          className={`mt-4 rounded-xl px-3.5 py-3 text-sm ${
            result.affordable ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
          }`}
        >
          {result.affordable
            ? "Según tu ingreso, esta propiedad está dentro de lo recomendado."
            : "Según tu ingreso, esta propiedad supera lo recomendado."}
          <div className="mt-1 text-xs opacity-80">
            {result.label}: {currency.format(result.maxAmount)}
          </div>
        </div>
      ) : null}
    </div>
  );
}

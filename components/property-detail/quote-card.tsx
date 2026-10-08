"use client";

import { useId, useState, type ReactNode } from "react";

import { formatCOP, type Property, type PropertyDetails } from "@/components/marketing/properties";
import { PropertyPrice } from "@/components/property-detail/property-price";

const AMOUNT = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const MILLIONS = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });

/** "$149,3 M" from a million up, the full amount below — short enough for a half-width cell. */
const compactCOP = (amount: number) =>
  amount >= 1_000_000 ? `$${MILLIONS.format(amount / 1_000_000)} M` : formatCOP(amount);

/** Value and optional percentage of one financing step, or `null` when neither is set. */
function financingValue(amount: number | undefined, percent: number | undefined) {
  if (amount == null && percent == null) return null;
  return {
    main: amount != null ? compactCOP(amount) : `${percent}%`,
    note: amount != null && percent != null ? `${percent}%` : undefined,
    full: amount != null ? formatCOP(amount) : undefined,
  };
}

/**
 * Rough, clearly-labeled rule of thumb — not financial advice: a rental
 * shouldn't exceed ~30% of monthly income, and a purchase price shouldn't
 * exceed ~4x annual income.
 */
function affordability(property: Pick<Property, "price" | "operation">, monthlyIncome: number) {
  if (!monthlyIncome) return null;
  const maxAmount = property.operation === "arrendar" ? monthlyIncome * 0.3 : monthlyIncome * 12 * 4;
  return { affordable: property.price <= maxAmount, maxAmount };
}

/** Tiny uppercase label over its content, like a booking widget's field. */
function CellLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  const className = "block text-[10px] font-bold uppercase tracking-[0.08em] text-foreground";
  return htmlFor ? (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ) : (
    <p className={className}>{children}</p>
  );
}

/**
 * Booking-style price card: the price as the headline, financing and the
 * monthly-income field in one bordered box, the affordability result in a
 * grey strip, then the call to action (`children`) and a disclaimer.
 */
export function QuoteCard({
  property,
  financing,
  children,
}: {
  property: Pick<Property, "price" | "operation">;
  financing?: PropertyDetails["financing"];
  /** The primary action, e.g. the WhatsApp button. */
  children?: ReactNode;
}) {
  const incomeId = useId();
  const [income, setIncome] = useState(0);
  const result = affordability(property, income);
  const isRent = property.operation === "arrendar";

  const cells = [
    {
      label: "Separación",
      value: financing?.separationAmount != null ? financingValue(financing.separationAmount, undefined) : null,
    },
    { label: "Cuota inicial", value: financingValue(financing?.initialFeeAmount, financing?.initialFeePercentage) },
    { label: "Crédito", value: financingValue(financing?.creditAmount, financing?.creditPercentage) },
  ].filter((cell): cell is { label: string; value: NonNullable<ReturnType<typeof financingValue>> } => cell.value !== null);

  return (
    <div className="brand-card rounded-2xl border border-separator bg-white p-6 shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
      <PropertyPrice property={property} />

      <div className="mt-6 overflow-hidden rounded-xl border border-[#b0b0b0]">
        {cells.length ? (
          <dl className="grid grid-cols-2">
            {cells.map((cell, index) => {
              // Odd count: the last cell spans the full row.
              const spansRow = cells.length % 2 === 1 && index === cells.length - 1;
              return (
                <div
                  key={cell.label}
                  className={`border-b border-[#b0b0b0] px-3 py-2.5 ${
                    spansRow ? "col-span-2" : index % 2 === 0 ? "border-r" : ""
                  }`}
                >
                  <dt>
                    <CellLabel>{cell.label}</CellLabel>
                  </dt>
                  <dd className="mt-1 flex items-baseline gap-1.5 text-sm text-foreground" title={cell.value.full}>
                    <span className="font-medium">{cell.value.main}</span>
                    {cell.value.note ? <span className="text-xs text-muted">· {cell.value.note}</span> : null}
                  </dd>
                </div>
              );
            })}
          </dl>
        ) : null}

        <div className="px-3 py-2.5 transition-colors focus-within:bg-surface-secondary/70">
          <CellLabel htmlFor={incomeId}>Tu ingreso mensual</CellLabel>
          <input
            id={incomeId}
            inputMode="numeric"
            autoComplete="off"
            value={income ? `$ ${AMOUNT.format(income)}` : ""}
            onChange={(event) => setIncome(Number(event.target.value.replace(/\D/g, "").slice(0, 12)) || 0)}
            placeholder="Ej: $ 5.000.000"
            className="mt-1 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
          />
        </div>
      </div>

      <p
        role="status"
        className={`mt-4 rounded-lg px-3 py-2 text-center text-xs ${
          !result
            ? "bg-surface-secondary text-foreground/80"
            : result.affordable
              ? "bg-success/10 font-medium text-success"
              : "bg-danger/10 font-medium text-danger"
        }`}
      >
        {!result
          ? "Calcula si está a tu alcance"
          : `${result.affordable ? "Está a tu alcance" : "Supera lo recomendado"} · Máx. ${compactCOP(result.maxAmount)}${isRent ? "/mes" : ""}`}
      </p>

      {children ? <div className="mt-4">{children}</div> : null}

      <p className="mt-4 text-center text-sm text-foreground">No es una pre-aprobación de crédito</p>
    </div>
  );
}

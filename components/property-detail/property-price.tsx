import type { Property } from "@/components/marketing/properties";

const AMOUNT = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

/**
 * The listing price headline — "Desde $497.650.000 COP" (or "… por mes" for
 * arriendos) — shared by the price card and the phone header so both read
 * the same.
 */
export function PropertyPrice({ property }: { property: Pick<Property, "price" | "operation"> }) {
  const isRent = property.operation === "arrendar";

  return (
    <p className="font-display text-[22px] leading-tight text-foreground">
      {!isRent ? <span className="font-semibold">Desde </span> : null}
      <span className="font-semibold underline decoration-[1.5px] underline-offset-[5px]">
        ${AMOUNT.format(property.price)} COP
      </span>
      {isRent ? <span className="text-base font-normal"> por mes</span> : null}
    </p>
  );
}

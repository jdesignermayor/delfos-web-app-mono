import type { Metadata } from "next";

import { PropertyForm } from "@/components/dashboard/properties/property-form";
import { requireDashboardUser } from "@/lib/auth/dal";
import { getPropertyFormOptions } from "@/lib/data/property-form-options";

export const metadata: Metadata = {
  title: "Nueva propiedad",
};

export default async function NewPropertyPage() {
  const user = await requireDashboardUser();
  const options = await getPropertyFormOptions(user);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva propiedad</h1>
        <p className="mt-1 text-sm text-muted">
          Completa los datos paso a paso para agregarla al sistema.
        </p>
      </div>

      <PropertyForm {...options} />
    </div>
  );
}

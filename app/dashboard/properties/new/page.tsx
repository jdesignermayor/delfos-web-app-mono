import type { Metadata } from "next";

import { PropertyForm } from "@/components/dashboard/properties/property-form";
import { createClient } from "@/supabase/server";

export const metadata: Metadata = {
  title: "Nueva propiedad",
};

export default async function NewPropertyPage() {
  const supabase = await createClient();
  const { data: developers } = await supabase
    .from("developers")
    .select("id, name")
    .order("name");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva propiedad</h1>
        <p className="mt-1 text-sm text-muted">
          Completa los datos paso a paso para agregarla al sistema.
        </p>
      </div>

      <PropertyForm developers={developers ?? []} />
    </div>
  );
}

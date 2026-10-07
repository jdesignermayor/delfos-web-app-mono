import type { Metadata } from "next";
import { EntityForm } from "@/components/dashboard/entity-form";

export const metadata: Metadata = { title: "Nueva inmobiliaria" };

export default function NewInmobiliariaPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva inmobiliaria</h1>
        <p className="mt-1 text-sm text-muted">Crea una nueva inmobiliaria en el sistema</p>
      </div>

      <EntityForm
        type="real_estate_agencies"
        backHref="/dashboard/inmobiliarias"
        fields={[
          { name: "name", label: "Nombre", required: true },
          { name: "nit", label: "NIT", required: false },
          { name: "phone", label: "Teléfono", type: "phone", required: false },
          { name: "email", label: "Email", type: "email", required: false },
          { name: "address", label: "Dirección", required: false },
          { name: "description", label: "Descripción", type: "textarea", required: false },
        ]}
      />
    </div>
  );
}

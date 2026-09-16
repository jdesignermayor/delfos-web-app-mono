"use client";

import { useId, useState } from "react";
import { Button, Input, Label, TextField } from "@heroui/react";

export type Typology = {
  name: string;
  area: string;
  bedrooms: string;
  bathrooms: string;
  study: "Sí" | "No";
  hasBalcony: "Sí" | "No";
};

const EMPTY_DRAFT: Typology = { name: "", area: "", bedrooms: "", bathrooms: "", study: "No", hasBalcony: "No" };

/**
 * Repeatable "Tipologías de apartamento" registry: a table of unit models
 * (name, area, bedrooms, bathrooms, study) plus an inline add-form, matching
 * the reference "Registro de tipologías" component. The resulting list is
 * meant to be stored as-is in `properties.typologies` (jsonb).
 */
export function TypologiesEditor({
  typologies,
  onChange,
}: {
  typologies: Typology[];
  onChange: (typologies: Typology[]) => void;
}) {
  const formId = useId();
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<Typology>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);

  function removeTypology(index: number) {
    onChange(typologies.filter((_, i) => i !== index));
  }

  function handleSave() {
    if (!draft.name.trim() || !draft.area.trim() || !draft.bedrooms.trim() || !draft.bathrooms.trim()) {
      setError("Nombre, área, alcobas y baños son obligatorios.");
      return;
    }

    if (editingIndex !== null) {
      // Editing mode
      const updated = [...typologies];
      updated[editingIndex] = draft;
      onChange(updated);
      setEditingIndex(null);
    } else {
      // Adding mode
      onChange([...typologies, draft]);
      setIsAdding(false);
    }

    setDraft(EMPTY_DRAFT);
    setError(null);
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setDraft(typologies[index]);
  }

  function cancelEdit() {
    setEditingIndex(null);
    setDraft(EMPTY_DRAFT);
    setError(null);
  }

  function handleCancel() {
    if (editingIndex !== null) {
      cancelEdit();
    } else {
      setDraft(EMPTY_DRAFT);
      setIsAdding(false);
      setError(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 border-t border-separator pt-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">
        Componente: registro de tipologías de apartamento
      </p>

      {typologies.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-separator">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-separator bg-surface-secondary text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-2.5 font-medium">Nombre / Modelo</th>
                <th className="px-4 py-2.5 font-medium">Área (m²)</th>
                <th className="px-4 py-2.5 font-medium">Alcobas</th>
                <th className="px-4 py-2.5 font-medium">Baños</th>
                <th className="px-4 py-2.5 font-medium">Estudio</th>
                <th className="px-4 py-2.5 font-medium">Balcón</th>
                <th className="px-4 py-2.5 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator">
              {typologies.map((typology, index) => (
                <tr key={`${typology.name}-${index}`}>
                  <td className="px-4 py-2.5 font-medium">{typology.name}</td>
                  <td className="px-4 py-2.5 text-muted">{typology.area}</td>
                  <td className="px-4 py-2.5 text-muted">{typology.bedrooms}</td>
                  <td className="px-4 py-2.5 text-muted">{typology.bathrooms}</td>
                  <td className="px-4 py-2.5 text-muted">{typology.study}</td>
                  <td className="px-4 py-2.5 text-muted">{typology.hasBalcony}</td>
                  <td className="px-4 py-2.5 flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onPress={() => startEdit(index)}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onPress={() => removeTypology(index)}
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted">Aún no hay tipologías registradas.</p>
      )}

      {editingIndex === null && !isAdding && (
        <Button type="button" variant="secondary" onPress={() => setIsAdding(true)}>
          + Añadir nuevo modelo de apartamento
        </Button>
      )}

      {(editingIndex !== null || isAdding) && (
        <div className="flex flex-col gap-4 rounded-lg border border-separator p-4">
          <h3 className="text-sm font-semibold">
            {editingIndex !== null ? `Editar: ${typologies[editingIndex].name}` : "Agregar nueva tipología"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-6">
            <TextField
              value={draft.name}
              onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
              validationBehavior="aria"
            >
              <Label>Nombre / Modelo</Label>
              <Input placeholder="Tipo C (Nuevo)" />
            </TextField>

            <TextField
              type="number"
              value={draft.area}
              onChange={(v) => setDraft((d) => ({ ...d, area: v }))}
              validationBehavior="aria"
            >
              <Label>Área (m²)</Label>
              <Input placeholder="65.0" />
            </TextField>

            <TextField
              type="number"
              value={draft.bedrooms}
              onChange={(v) => setDraft((d) => ({ ...d, bedrooms: v }))}
              validationBehavior="aria"
            >
              <Label>Alcobas</Label>
              <Input placeholder="2" />
            </TextField>

            <TextField
              type="number"
              value={draft.bathrooms}
              onChange={(v) => setDraft((d) => ({ ...d, bathrooms: v }))}
              validationBehavior="aria"
            >
              <Label>Baños</Label>
              <Input placeholder="2" />
            </TextField>

            <div>
              <label htmlFor={`${formId}-study`} className="mb-1.5 block text-sm font-medium">
                Estudio
              </label>
              <select
                id={`${formId}-study`}
                value={draft.study}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, study: e.target.value as "Sí" | "No" }))
                }
                className="h-10 w-full rounded-lg border border-separator bg-surface px-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-focus/30"
              >
                <option value="No">No</option>
                <option value="Sí">Sí</option>
              </select>
            </div>

            <div>
              <label htmlFor={`${formId}-balcony`} className="mb-1.5 block text-sm font-medium">
                Balcón
              </label>
              <select
                id={`${formId}-balcony`}
                value={draft.hasBalcony}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, hasBalcony: e.target.value as "Sí" | "No" }))
                }
                className="h-10 w-full rounded-lg border border-separator bg-surface px-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-focus/30"
              >
                <option value="No">No</option>
                <option value="Sí">Sí</option>
              </select>
            </div>
          </div>

          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onPress={handleCancel}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onPress={handleSave}>
              {editingIndex !== null ? "Guardar cambios" : "Guardar tipología"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

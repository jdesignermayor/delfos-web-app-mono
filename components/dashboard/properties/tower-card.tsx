"use client";

import { useId } from "react";

import type { TowerDetail } from "@/app/actions/properties";
import { TypologiesEditor, type Typology } from "@/components/dashboard/properties/typologies-editor";
import type { TowerStatusOption } from "@/lib/data/property-form-options";

const FIELD_CLASS =
  "h-10 w-full rounded-lg border border-separator bg-surface px-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-focus/30";
const LABEL_CLASS = "mb-1.5 block text-sm font-medium";

/**
 * One tower in the property form's "Tipologías por torre": its status (from `tower_statuses`),
 * features and typologies. Controlled: the form owns the values.
 */
export function TowerCard({
  towerNumber,
  statusOptions,
  statusId,
  onStatusChange,
  detail,
  onDetailChange,
  typologies,
  onTypologiesChange,
}: {
  towerNumber: number;
  statusOptions: TowerStatusOption[];
  statusId: string;
  onStatusChange: (statusId: string) => void;
  detail: TowerDetail;
  onDetailChange: (patch: Partial<TowerDetail>) => void;
  typologies: Typology[];
  onTypologiesChange: (typologies: Typology[]) => void;
}) {
  const id = useId();

  return (
    <div className="mb-6 rounded-lg border border-separator p-4">
      <h3 className="mb-4 text-sm font-semibold">Torre {towerNumber}</h3>
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor={`${id}-status`} className={LABEL_CLASS}>
            Estado de la torre <span className="text-danger">*</span>
          </label>
          <select
            id={`${id}-status`}
            className={FIELD_CLASS}
            value={statusId}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {statusOptions.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-trash-chute`} className={LABEL_CLASS}>
            Cuenta con shut de basura
          </label>
          <select
            id={`${id}-trash-chute`}
            className={FIELD_CLASS}
            value={detail.hasTrashChute ? "Sí" : "No"}
            onChange={(e) => onDetailChange({ hasTrashChute: e.target.value === "Sí" })}
          >
            <option value="No">No</option>
            <option value="Sí">Sí</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-delivery-date`} className={LABEL_CLASS}>
            Fecha de entrega
          </label>
          <input
            id={`${id}-delivery-date`}
            type="date"
            className={FIELD_CLASS}
            value={detail.deliveryDate ?? ""}
            onChange={(e) => onDetailChange({ deliveryDate: e.target.value || null })}
          />
        </div>
        <div>
          <label htmlFor={`${id}-elevators`} className={LABEL_CLASS}>
            Cantidad de ascensores
          </label>
          <input
            id={`${id}-elevators`}
            type="number"
            min={0}
            step={1}
            className={FIELD_CLASS}
            value={detail.elevatorCount}
            onChange={(e) => onDetailChange({ elevatorCount: Math.max(0, Math.trunc(Number(e.target.value) || 0)) })}
          />
        </div>
      </div>
      <TypologiesEditor typologies={typologies} onChange={onTypologiesChange} />
    </div>
  );
}

"use server";

import ExcelJS from "exceljs";

import { createClient } from "@/supabase/server";
import { getCurrentUser } from "@/supabase/roles";
import type { Json } from "@/supabase/types";

type Cell = string | number | boolean | null | undefined;

// Plain columns exported as-is, in this order (columns empty for every
// property are dropped). tower_details and typologies become dropdowns;
// amenities is intentionally skipped.
const COLUMNS: [key: string, header: string][] = [
  ["id", "ID"],
  ["uuid", "UUID"],
  ["title", "Título"],
  ["project_name", "Nombre del proyecto"],
  ["description", "Descripción"],
  ["type", "Tipo"],
  ["property_type", "Tipo de propiedad"],
  ["housing_type", "Tipo de vivienda"],
  ["developer", "Constructora"],
  ["builder", "Quién construye"],
  ["seller", "Quién vende"],
  ["construction_company", "Empresa constructora"],
  ["construction_bank", "Banco constructor"],
  ["trust_company", "Fiduciaria"],
  ["price", "Precio"],
  ["area", "Área"],
  ["meters", "Metros"],
  ["meters2", "Metros 2"],
  ["bedrooms", "Habitaciones"],
  ["bathrooms", "Baños"],
  ["parking", "Parqueaderos"],
  ["study", "Estudio"],
  ["stratum", "Estrato"],
  ["year_built", "Año de construcción"],
  ["delivery_date", "Fecha de entrega"],
  ["address", "Dirección"],
  ["location", "Ubicación"],
  ["city", "Ciudad"],
  ["commune", "Comuna"],
  ["neighborhood", "Barrio"],
  ["latitude", "Latitud"],
  ["longitude", "Longitud"],
  ["tower_count", "Número de torres"],
  ["tower_name", "Nombre de torre"],
  ["separation_amount", "Valor separación"],
  ["initial_fee_amount", "Valor cuota inicial"],
  ["initial_fee_percentage", "Porcentaje cuota inicial"],
  ["credit_amount", "Valor crédito"],
  ["credit_percentage", "Porcentaje crédito"],
  ["sales_room_address", "Sala de ventas - Dirección"],
  ["sales_room_phone", "Sala de ventas - Teléfono"],
  ["sales_room_email", "Sala de ventas - Email"],
  ["sales_room_hours", "Sala de ventas - Horario"],
  ["image", "Imagen principal"],
  ["additional_images", "Imágenes adicionales"],
  ["is_favorite", "Favorita"],
  ["created_at", "Creado"],
  ["updated_at", "Actualizado"],
];

const TYPOLOGY_FIELDS: [key: string, header: string][] = [
  ["name", "Nombre"],
  ["area", "Área"],
  ["bedrooms", "Habitaciones"],
  ["bathrooms", "Baños"],
  ["study", "Estudio"],
  ["hasBalcony", "Balcón"],
];

function asRecord(value: Json | undefined): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

/** "tower-2" → 2, so towers sort numerically instead of lexically. */
function towerNumber(key: string) {
  const n = Number(key.replace(/^tower-/, ""));
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

function towerLabel(key: string) {
  const n = towerNumber(key);
  return n === Number.MAX_SAFE_INTEGER ? key : `Torre ${n}`;
}

function byTower(a: string, b: string) {
  return towerNumber(a) - towerNumber(b) || a.localeCompare(b);
}

function formatCell(value: Cell | Json | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) return value.map((v) => formatCell(v)).join(" | ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** "Torre 1 · Shut de basuras: Sí" — one option per tower. */
function towerOptions(details: Record<string, Json | undefined>) {
  return Object.keys(details)
    .sort(byTower)
    .map((tower) => {
      const chute = asRecord(details[tower]).hasTrashChute;
      return chute === undefined
        ? towerLabel(tower)
        : `${towerLabel(tower)} · Shut de basuras: ${formatCell(chute)}`;
    });
}

/** "Torre 1 · A · Área: 65 · Habitaciones: 3 · …" — one option per typology. */
function typologyOptions(typologies: Record<string, Json | undefined>) {
  return Object.keys(typologies)
    .sort(byTower)
    .flatMap((tower) => {
      const list = typologies[tower];
      return (Array.isArray(list) ? list : []).map((item) => {
        const typology = asRecord(item);
        const parts = TYPOLOGY_FIELDS.map(([key, label]) =>
          key === "name" ? formatCell(typology[key]) : `${label}: ${formatCell(typology[key])}`,
        );
        return [towerLabel(tower), ...parts].join(" · ");
      });
    });
}

/** "A", "B", … — just the typology names, without repeats across towers. */
function typologyNameOptions(typologies: Record<string, Json | undefined>) {
  const names = Object.keys(typologies)
    .sort(byTower)
    .flatMap((tower) => {
      const list = typologies[tower];
      return (Array.isArray(list) ? list : []).map((item) => formatCell(asRecord(item).name));
    })
    .filter((name) => name !== "");
  return [...new Set(names)];
}

export type ExportPropertiesResult =
  | { success: true; fileName: string; base64: string }
  | { success: false; error: string };

/**
 * Builds an .xlsx of every property (one row each) with Torres / Tipologías as
 * dropdowns. Returned as base64 so the client can turn it into a download.
 */
export async function exportProperties(): Promise<ExportPropertiesResult> {
  // Server actions are callable directly, so re-check what the layout enforces.
  const user = await getCurrentUser();
  if (user?.role !== "superadmin") {
    return { success: false, error: "No autorizado." };
  }

  const supabase = await createClient();
  const { data: properties, error } = await supabase
    .from("properties")
    .select(
      "*, developer:developers!developer_id(name), builder:developers!builder_id(name), seller:developers!seller_id(name)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: `No se pudieron exportar las propiedades: ${error.message}` };
  }

  const rows = properties.map((property) => {
    const flat: Record<string, Cell | Json | undefined> = {
      ...property,
      developer: property.developer?.name,
      builder: property.builder?.name,
      seller: property.seller?.name,
    };
    return {
      name: property.project_name || property.title || `Propiedad ${property.id}`,
      values: COLUMNS.map(([key]) => formatCell(flat[key])),
      towers: towerOptions(asRecord(property.tower_details)),
      typologies: typologyOptions(asRecord(property.typologies)),
      typologyNames: typologyNameOptions(asRecord(property.typologies)),
    };
  });

  // Skip columns that are empty for every property.
  const keptColumns = COLUMNS.map((column, index) => ({ column, index })).filter(({ index }) =>
    rows.some((row) => row.values[index] !== ""),
  );

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Propiedades", { views: [{ state: "frozen", ySplit: 1 }] });
  // Dropdown options live on a hidden sheet: inline list validations break on
  // commas and are capped at 255 chars. Excel and Apple Numbers both turn
  // these range-based validations into pop-up menus.
  const lists = workbook.addWorksheet("Listas", { state: "hidden" });

  const headers = [...keptColumns.map(({ column: [, label] }) => label), "Torres", "Tipologías", "Nombres de tipologías"];
  sheet.addRow(headers).font = { bold: true };

  // Each dropdown gets its own column on "Listas": a named header on row 1
  let listColumn = 0;
  function addDropdown(cell: ExcelJS.Cell, title: string, options: string[]) {
    if (options.length === 0) return;
    listColumn += 1;
    const header = lists.getCell(1, listColumn);
    header.value = title;
    header.font = { bold: true };
    options.forEach((option, i) => (lists.getCell(i + 2, listColumn).value = option));
    const column = lists.getColumn(listColumn);
    column.width = Math.min(Math.max(title.length, ...options.map((o) => o.length)) + 2, 80);
    cell.value = options[0];
    cell.dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`Listas!$${column.letter}$2:$${column.letter}$${options.length + 1}`],
    };
  }

  for (const row of rows) {
    const excelRow = sheet.addRow(keptColumns.map(({ index }) => row.values[index]));
    addDropdown(excelRow.getCell(headers.length - 2), `${row.name} - Torres`, row.towers);
    addDropdown(excelRow.getCell(headers.length - 1), `${row.name} - Tipologías`, row.typologies);
    addDropdown(
      excelRow.getCell(headers.length),
      `${row.name} - Nombres de tipologías`,
      row.typologyNames,
    );
  }

  sheet.columns.forEach((column, i) => {
    const longest = Math.max(
      headers[i].length,
      ...rows.map((_, r) => String(sheet.getCell(r + 2, i + 1).value ?? "").length),
    );
    column.width = Math.min(Math.max(longest + 2, 10), 60);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);

  return {
    success: true,
    fileName: `propiedades-${date}.xlsx`,
    base64: Buffer.from(buffer).toString("base64"),
  };
}

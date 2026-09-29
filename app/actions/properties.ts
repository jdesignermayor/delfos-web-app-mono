"use server";

import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";
import type { Amenity } from "@/lib/amenities";
import { imageToWebp } from "@/lib/image-to-webp";
import type { Typology } from "@/components/dashboard/properties/typologies-editor";

/** Per-tower attributes stored in `properties.tower_details`. */
export type TowerDetail = {
  hasTrashChute: boolean;
  /** "Fecha de entrega" as an ISO date (YYYY-MM-DD), or null when unknown. */
  deliveryDate: string | null;
  /** "Cantidad de ascensores" — starts at 0. */
  elevatorCount: number;
};

export type CreatePropertyInput = {
  propertyType: string;
  housingType: string;
  description: string;
  image: string;
  address: string;
  location: string;
  /** Google Maps marker set via `LocationPicker` — `null` until a pin is placed. */
  latitude: number | null;
  longitude: number | null;
  city: string;
  commune: string;
  neighborhood: string;
  stratum: string;
  deliveryDate: string;
  developerId: string;
  projectName: string;
  towerCount: string;
  constructionCompany: string;
  builderId: string;
  sellerId: string;
  constructionBank: string;
  trustCompany: string;
  price: string;
  creditAmount: string;
  creditPercentage: string;
  initialFeeAmount: string;
  initialFeePercentage: string;
  separationAmount: string;
  salesRoomAddress: string;
  salesRoomPhone: string;
  salesRoomEmail: string;
  salesRoomHours: string;
  amenities: Amenity[];
  typologies: Record<string, Typology[]>;
  /** Per-tower attributes (trash chute, delivery date, elevators) keyed by `tower-${n}`. */
  towerDetails: Record<string, TowerDetail>;
  additionalImages: string[];
};

export type CreatePropertyResult =
  | { success: true; id: number }
  | { success: false; error: string };

const REQUIRED_FIELDS: Array<
  [
    Exclude<
      keyof CreatePropertyInput,
      | "amenities"
      | "typologies"
      | "towerDetails"
      | "additionalImages"
      | "latitude"
      | "longitude"
    >,
    string,
  ]
> = [
  ["propertyType", "Tipo"],
  ["description", "Descripción"],
  ["image", "Imagen (URL)"],
  ["address", "Dirección"],
  ["location", "Ubicación"],
  ["stratum", "Estrato"],
  ["price", "Precio"],
];

function validateInput(input: CreatePropertyInput): string | null {
  for (const [key, label] of REQUIRED_FIELDS) {
    if (!input[key]?.trim()) {
      return `${label} es obligatorio.`;
    }
  }
  return null;
}

function buildPropertyRow(input: CreatePropertyInput) {
  return {
    title: input.projectName.trim() || "Sin nombre",
    description: input.description.trim(),
    address: input.address.trim(),
    location: input.location.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    city: input.city.trim() || null,
    commune: input.commune.trim() || null,
    neighborhood: input.neighborhood.trim() || null,
    image: input.image.trim(),
    // Fixed discriminator — `properties_type_check` only allows "property".
    // The apartamento/casa/... distinction lives in `property_type` instead.
    type: "property",
    property_type: input.propertyType.trim() || null,
    housing_type: input.housingType || null,
    price: input.price.trim(),
    stratum: Number(input.stratum) || 0,
    delivery_date: input.deliveryDate ? `${input.deliveryDate}-01` : null,
    amenities: input.amenities.map(({ id, name }) => ({ id, name })),
    typologies: Object.keys(input.typologies).length > 0 ? input.typologies : {},
    tower_details: Object.keys(input.towerDetails).length > 0 ? input.towerDetails : {},
    additional_images: input.additionalImages.length > 0 ? input.additionalImages : null,
    developer_id: input.developerId ? Number(input.developerId) : null,
    project_name: input.projectName.trim() || null,
    tower_count: input.towerCount ? Number(input.towerCount) : null,
    construction_company: input.constructionCompany.trim() || null,
    builder_id: input.builderId ? Number(input.builderId) : null,
    seller_id: input.sellerId ? Number(input.sellerId) : null,
    construction_bank: input.constructionBank.trim() || null,
    trust_company: input.trustCompany.trim() || null,
    credit_amount: input.creditAmount.trim() || null,
    credit_percentage: input.creditPercentage ? Number(input.creditPercentage) : null,
    initial_fee_amount: input.initialFeeAmount.trim() || null,
    initial_fee_percentage: input.initialFeePercentage
      ? Number(input.initialFeePercentage)
      : null,
    separation_amount: input.separationAmount.trim() || null,
    sales_room_address: input.salesRoomAddress.trim() || null,
    sales_room_phone: input.salesRoomPhone.trim() || null,
    sales_room_email: input.salesRoomEmail.trim() || null,
    sales_room_hours: input.salesRoomHours.trim() || null,
  };
}

export async function createProperty(input: CreatePropertyInput): Promise<CreatePropertyResult> {
  const validationError = validateInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("properties")
    .insert(buildPropertyRow(input))
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, id: data.id };
}

export async function updateProperty(
  id: number,
  input: CreatePropertyInput,
): Promise<CreatePropertyResult> {
  const validationError = validateInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("properties").update(buildPropertyRow(input)).eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, id };
}

/** Fetches a single property (with its developer) for the detail/edit pages. */
export async function getPropertyById(id: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("*, developers!developer_id(id, name, address, phone)")
    .eq("id", id)
    .maybeSingle();

  return data;
}

export type PropertyImageKind = "main" | "secondary";

export type UploadPropertyImageResult = { url: string } | { error: string };

/** Upper bound for a single original photo; keep in sync with `serverActions.bodySizeLimit`. */
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/** "20260929-143012" (UTC) — sortable timestamp for storage file names. */
function fileTimestamp(date = new Date()) {
  return date.toISOString().slice(0, 19).replace(/-/g, "").replace("T", "-").replace(/:/g, "");
}

/**
 * Converts one photo picked in `MultiImagePicker` to WebP and uploads it to the
 * `properties` storage bucket. The stored name is generated server-side
 * (`main-picture-<date>-<uuid>.webp` / `secondary-picture-<date>-<uuid>.webp`)
 * so the user's original file name — spaces, accents, duplicates — never
 * reaches storage. Called once per photo to keep each request small.
 */
export async function uploadPropertyImage(
  formData: FormData,
): Promise<UploadPropertyImageResult> {
  const file = formData.get("file");
  const kind: PropertyImageKind = formData.get("kind") === "main" ? "main" : "secondary";
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No se recibió ninguna imagen." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: `${file.name} supera el tamaño máximo de 20 MB.` };
  }

  let webp: Buffer;
  try {
    webp = await imageToWebp(file);
  } catch {
    return { error: `No se pudo procesar ${file.name}. Usa JPG, JPEG, PNG o HEIC.` };
  }

  const path = `properties/${kind}-picture-${fileTimestamp()}-${crypto.randomUUID()}.webp`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from("properties").upload(path, webp, {
    contentType: "image/webp",
  });
  if (error) {
    return { error: `No se pudo subir ${file.name}: ${error.message}` };
  }
  const { data } = admin.storage.from("properties").getPublicUrl(path);
  return { url: data.publicUrl };
}

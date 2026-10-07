"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { PROPERTIES_CACHE_TAG } from "@/lib/cache-tags";
import { createAdminClient } from "@/supabase/admin";
import type { Amenity } from "@/lib/amenities";
import { imageToShareCard, imageToWebp } from "@/lib/image-to-webp";
import { slugify } from "@/lib/slug";
import { getDashboardUser } from "@/lib/auth/dal";
import { canManageProperty, developerScope, type DashboardUser } from "@/lib/auth/permissions";
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
  /** Per-platform SEO/ads fields (`{ meta: { ogTitle, … }, google: {…}, … }`); empty values are dropped. */
  seo: Record<string, Record<string, string>>;
};

/** Trims every SEO value and drops empty fields and platforms, so `seo` only holds what was filled in. */
function cleanSeo(seo: CreatePropertyInput["seo"]) {
  return Object.fromEntries(
    Object.entries(seo ?? {})
      .map(([platform, fields]) => [
        platform,
        Object.fromEntries(
          Object.entries(fields ?? {})
            .map(([name, value]) => [name, typeof value === "string" ? value.trim() : ""])
            .filter(([, value]) => value),
        ),
      ])
      .filter(([, fields]) => Object.keys(fields).length > 0),
  );
}

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
      | "seo"
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
    seo: cleanSeo(input.seo),
    // There's no DB trigger for this; it's the "last updated" date shown to visitors and search engines.
    updated_at: new Date().toISOString(),
  };
}

type PropertyRow = ReturnType<typeof buildPropertyRow>;

const UNAUTHORIZED = "No tienes permiso para realizar esta acción.";

/** A constructora admin's properties always belong to their own constructora, whatever the form sent. */
function withOwner(row: PropertyRow, user: DashboardUser): PropertyRow {
  const developerId = developerScope(user);
  return developerId === null ? row : { ...row, developer_id: developerId };
}

/** Whether `user` may edit the existing property `id` (it must exist and be in their scope). */
async function canEditProperty(user: DashboardUser, id: number): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin.from("properties").select("developer_id").eq("id", id).maybeSingle();
  return data !== null && canManageProperty(user, data.developer_id);
}

/**
 * Every property gets a clean, keyword-rich URL slug (`/propiedades/<slug>`):
 * the one typed in the SEO step (normalised), or one made from the project
 * name and municipality. Suffixes -2, -3… keep it unique across properties.
 */
async function withUniqueSlug(row: PropertyRow, id?: number): Promise<PropertyRow> {
  const seo = row.seo as Record<string, Record<string, string>>;
  const base = slugify(seo.google?.slug || `${row.title} ${row.location.split(",")[0] ?? ""}`);
  if (!base) return row;

  const admin = createAdminClient();
  let candidate = base;
  for (let n = 2; n < 100; n++) {
    let query = admin.from("properties").select("id").eq("seo->google->>slug", candidate).limit(1);
    if (id != null) query = query.neq("id", id);
    const { data } = await query;
    if (!data?.length) break;
    candidate = `${base}-${n}`;
  }
  return { ...row, seo: { ...seo, google: { ...seo.google, slug: candidate } } };
}

export async function createProperty(input: CreatePropertyInput): Promise<CreatePropertyResult> {
  const user = await getDashboardUser();
  if (!user) {
    return { success: false, error: UNAUTHORIZED };
  }

  const validationError = validateInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("properties")
    .insert(await withUniqueSlug(withOwner(buildPropertyRow(input), user)))
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }
  revalidateTag(PROPERTIES_CACHE_TAG, "max");
  // Dashboard lists, stats and detail pages (and their client-side cache).
  revalidatePath("/dashboard", "layout");
  return { success: true, id: data.id };
}

export async function updateProperty(
  id: number,
  input: CreatePropertyInput,
): Promise<CreatePropertyResult> {
  const user = await getDashboardUser();
  if (!user || !(await canEditProperty(user, id))) {
    return { success: false, error: UNAUTHORIZED };
  }

  const validationError = validateInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const admin = createAdminClient();
  const row = await withUniqueSlug(withOwner(buildPropertyRow(input), user), id);
  const { error } = await admin.from("properties").update(row).eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }
  revalidateTag(PROPERTIES_CACHE_TAG, "max");
  // Dashboard lists, stats and detail pages (and their client-side cache).
  revalidatePath("/dashboard", "layout");
  return { success: true, id };
}

/** "seo" is a share image (og:image / LinkedIn) picked in the SEO step. */
export type PropertyImageKind = "main" | "secondary" | "seo";

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
  if (!(await getDashboardUser())) {
    return { error: "No tienes permiso para subir imágenes." };
  }

  const file = formData.get("file");
  const rawKind = formData.get("kind");
  const kind: PropertyImageKind = rawKind === "main" || rawKind === "seo" ? rawKind : "secondary";
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

/**
 * Builds the social share image for the SEO autofill: the property's main
 * photo cropped to 1200 × 630 and compressed to WebP, uploaded once and used
 * for both Meta (og:image) and LinkedIn. Accepts the main photo either as a
 * newly picked `file` or, for a saved property, as its `url` in our own
 * `properties` bucket — any other URL is refused so the server never fetches
 * arbitrary addresses.
 */
export async function createSeoShareImage(formData: FormData): Promise<UploadPropertyImageResult> {
  if (!(await getDashboardUser())) {
    return { error: "No tienes permiso para generar imágenes." };
  }

  let file = formData.get("file");
  const url = formData.get("url");
  if (!(file instanceof File) || file.size === 0) {
    const bucketPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/properties/`;
    if (typeof url !== "string" || !url.startsWith(bucketPrefix)) {
      return { error: "La imagen principal no es válida." };
    }
    const response = await fetch(url);
    if (!response.ok) {
      return { error: "No se pudo leer la imagen principal." };
    }
    const blob = await response.blob();
    file = new File([blob], url.split("/").pop() ?? "main.webp", { type: blob.type });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "La imagen principal supera el tamaño máximo de 20 MB." };
  }

  let card: Buffer;
  try {
    card = await imageToShareCard(file);
  } catch {
    return { error: "No se pudo procesar la imagen principal." };
  }

  const path = `properties/seo-picture-${fileTimestamp()}-${crypto.randomUUID()}.webp`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from("properties").upload(path, card, { contentType: "image/webp" });
  if (error) {
    return { error: `No se pudo subir la imagen para compartir: ${error.message}` };
  }
  return { url: admin.storage.from("properties").getPublicUrl(path).data.publicUrl };
}

"use server";

import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";
import type { Typology } from "@/components/dashboard/properties/typologies-editor";

export type CreatePropertyInput = {
  title: string;
  propertyType: string;
  housingType: string;
  description: string;
  image: string;
  address: string;
  location: string;
  city: string;
  commune: string;
  neighborhood: string;
  stratum: string;
  bedrooms: string;
  bathrooms: string;
  parking: string;
  area: string;
  meters: string;
  yearBuilt: string;
  deliveryDate: string;
  study: string;
  developerId: string;
  projectName: string;
  towerName: string;
  towerCount: string;
  constructionCompany: string;
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
  amenities: string[];
  typologies: Typology[];
  additionalImages: string[];
};

export type CreatePropertyResult =
  | { success: true; id: number }
  | { success: false; error: string };

const REQUIRED_FIELDS: Array<
  [Exclude<keyof CreatePropertyInput, "amenities" | "typologies" | "additionalImages">, string]
> = [
  ["title", "Título"],
  ["propertyType", "Tipo"],
  ["description", "Descripción"],
  ["image", "Imagen (URL)"],
  ["address", "Dirección"],
  ["location", "Ubicación"],
  ["stratum", "Estrato"],
  ["bedrooms", "Habitaciones"],
  ["bathrooms", "Baños"],
  ["parking", "Parqueaderos"],
  ["area", "Área"],
  ["yearBuilt", "Año de construcción"],
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
    title: input.title.trim(),
    description: input.description.trim(),
    address: input.address.trim(),
    location: input.location.trim(),
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
    area: input.area.trim(),
    meters: input.meters.trim() || null,
    bedrooms: Number(input.bedrooms) || 0,
    bathrooms: Number(input.bathrooms) || 0,
    parking: Number(input.parking) || 0,
    stratum: Number(input.stratum) || 0,
    year_built: Number(input.yearBuilt) || new Date().getFullYear(),
    delivery_date: input.deliveryDate ? `${input.deliveryDate}-01` : null,
    study: input.study || null,
    amenities: input.amenities.length > 0 ? input.amenities : {},
    typologies: input.typologies.length > 0 ? input.typologies : {},
    additional_images: input.additionalImages.length > 0 ? input.additionalImages : null,
    developer_id: input.developerId ? Number(input.developerId) : null,
    project_name: input.projectName.trim() || null,
    tower_name: input.towerName.trim() || null,
    tower_count: input.towerCount ? Number(input.towerCount) : null,
    construction_company: input.constructionCompany.trim() || null,
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
    .select("*, developers(id, name, address, phone)")
    .eq("id", id)
    .maybeSingle();

  return data;
}

export type UploadPropertyImagesResult = { urls: string[] } | { error: string };

/** Uploads photos picked in-memory by `MultiImagePicker` to the `properties` storage bucket. */
export async function uploadPropertyImages(files: File[]): Promise<UploadPropertyImagesResult> {
  const admin = createAdminClient();
  const urls: string[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `properties/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await admin.storage.from("properties").upload(path, file, {
      contentType: file.type || undefined,
    });
    if (error) {
      return { error: `No se pudo subir ${file.name}: ${error.message}` };
    }
    const { data } = admin.storage.from("properties").getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return { urls };
}

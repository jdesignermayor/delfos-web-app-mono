"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, TextArea, TextField } from "@heroui/react";
import { Copy } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

import {
  createProperty,
  createSeoShareImage,
  updateProperty,
  uploadPropertyImage,
  type PropertyImageKind,
  type CreatePropertyInput,
  type TowerDetail,
} from "@/app/actions/properties";
import {
  existingImage,
  MultiImagePicker,
  type PickedImage,
  useRevokePreviewsOnUnmount,
} from "@/components/multi-image-picker";
import { LocationPicker } from "@/components/location-picker";
import { TypologiesEditor, type Typology } from "@/components/dashboard/properties/typologies-editor";
import { TagMultiSelect } from "@/components/dashboard/tag-multi-select";
import {
  EMPTY_SEO,
  SEO_IMAGE_FIELDS,
  SeoEditor,
  type SeoImageField,
  type SeoImages,
  type SeoValues,
} from "@/components/dashboard/properties/seo-editor";
import { type Amenity, parseAmenities } from "@/lib/amenities";
import { buildSeoTexts } from "@/lib/seo-autofill";
import type { Tables } from "@/supabase/types";

export type PropertyRecord = Tables<"properties"> & {
  developers: { id: number; name: string } | null;
};

type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "month"
  | "location"
  | "tel"
  | "email"
  | "boolean";

type PropertyFormValues = Omit<
  CreatePropertyInput,
  "amenities" | "typologies" | "towerDetails" | "additionalImages" | "latitude" | "longitude" | "seo"
> & {
  // Note: title field is not part of form values, it's auto-generated from projectName
};

type FieldConfig = {
  name: keyof PropertyFormValues;
  label: string;
  hint?: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  wide?: boolean;
  /** Value is derived from other fields and shown read-only. */
  readOnly?: boolean;
};

type FieldGroup = {
  heading?: string;
  fields: FieldConfig[];
};

type StepConfig = {
  key: string;
  title: string;
  description: string;
  groups: FieldGroup[];
  /** Optional steps can be skipped; the form can be submitted from the step before. */
  optional?: boolean;
};

const TEXT_FIELDS: (keyof PropertyFormValues)[] = [
  "propertyType",
  "housingType",
  "description",
  "image",
  "address",
  "location",
  "city",
  "commune",
  "neighborhood",
  "stratum",
  "deliveryDate",
  "developerId",
  "projectName",
  "towerCount",
  "constructionCompany",
  "builderId",
  "sellerId",
  "constructionBank",
  "trustCompany",
  "price",
  "creditAmount",
  "creditPercentage",
  "initialFeeAmount",
  "initialFeePercentage",
  "separationAmount",
  "salesRoomAddress",
  "salesRoomPhone",
  "salesRoomEmail",
  "salesRoomHours",
];

const EMPTY_STATE: PropertyFormValues = Object.fromEntries(
  TEXT_FIELDS.map((name) => [name, ""]),
) as unknown as PropertyFormValues;
EMPTY_STATE.propertyType = "apartamento";

function toInitialValues(property: PropertyRecord): PropertyFormValues {
  const str = (value: string | number | null | undefined) =>
    value === null || value === undefined ? "" : String(value);

  return {
    propertyType: property.property_type ?? "apartamento",
    housingType: property.housing_type ?? "",
    description: property.description,
    image: property.image,
    address: property.address,
    location: property.location,
    city: property.city ?? "",
    commune: property.commune ?? "",
    neighborhood: property.neighborhood ?? "",
    stratum: str(property.stratum),
    deliveryDate: property.delivery_date ? property.delivery_date.slice(0, 7) : "",
    developerId: str(property.developer_id),
    projectName: property.project_name ?? "",
    towerCount: str(property.tower_count),
    constructionCompany: property.construction_company ?? "",
    builderId: str(property.builder_id),
    sellerId: str(property.seller_id),
    constructionBank: property.construction_bank ?? "",
    trustCompany: property.trust_company ?? "",
    price: property.price,
    creditAmount: property.credit_amount ?? "",
    creditPercentage: str(property.credit_percentage),
    initialFeeAmount: property.initial_fee_amount ?? "",
    initialFeePercentage: str(property.initial_fee_percentage),
    separationAmount: property.separation_amount ?? "",
    salesRoomAddress: property.sales_room_address ?? "",
    salesRoomPhone: property.sales_room_phone ?? "",
    salesRoomEmail: property.sales_room_email ?? "",
    salesRoomHours: property.sales_room_hours ?? "",
  };
}

const PROPERTY_TYPE_OPTIONS = [
  { value: "apartamento", label: "Apartamento" },
  { value: "casa", label: "Casa" },
  { value: "apartaestudio", label: "Apartaestudio" },
  { value: "proyecto", label: "Proyecto sobre planos" },
];

const HOUSING_TYPE_OPTIONS = [
  { value: "", label: "Sin especificar" },
  { value: "VIS", label: "VIS" },
  { value: "No VIS", label: "No VIS" },
];

const BOOLEAN_OPTIONS = [
  { value: "", label: "Sin especificar" },
  { value: "Sí", label: "Sí" },
  { value: "No", label: "No" },
];

const CITY_OPTIONS = [
  "Medellín",
  "Envigado",
  "Itagüí",
  "Sabaneta",
  "La Estrella",
  "Bello",
  "Caldas",
  "Copacabana",
  "Rionegro",
  "Bogotá",
];

function buildSteps(
  developers: { id: number; name: string }[],
  realEstateAgencies: { id: string; name: string }[],
  trustCompanies: { id: string; name: string }[],
): StepConfig[] {
  return [
    {
      key: "macro",
      title: "Macro",
      description: "Identidad del proyecto, ubicación y sala de ventas.",
      groups: [
        {
          heading: "Identificación",
          fields: [
            { name: "projectName", label: "Nombre del Proyecto", kind: "text", required: true },
            {
              name: "developerId",
              label: "Constructora",
              kind: "select",
              options: [
                { value: "", label: "Sin constructora" },
                ...developers.map((d) => ({ value: String(d.id), label: d.name })),
              ],
            },
            {
              name: "description",
              label: "Descripción",
              kind: "textarea",
              required: true,
              wide: true,
            },
          ],
        },
        {
          heading: "Ubicación",
          fields: [
            {
              name: "address",
              label: "Ubicación (mapa)",
              kind: "location",
              required: true,
              wide: true,
            },
          ],
        },
        {
          heading: "Sala de ventas",
          fields: [
            { name: "salesRoomAddress", label: "Dirección sala de ventas", kind: "text" },
            { name: "salesRoomPhone", label: "Teléfono", kind: "tel" },
            { name: "salesRoomEmail", label: "Correo", kind: "email" },
            { name: "salesRoomHours", label: "Horario", kind: "text" },
          ],
        },
      ],
    },
    {
      key: "micro",
      title: "Micro",
      description: "Estructura del proyecto y entidades relacionadas.",
      groups: [
        {
          heading: "Tipo de apartamento",
          fields: [
            {
              name: "propertyType",
              label: "Tipo",
              kind: "select",
              required: true,
              options: PROPERTY_TYPE_OPTIONS,
            },
            {
              name: "housingType",
              label: "Tipo de vivienda",
              kind: "select",
              options: HOUSING_TYPE_OPTIONS,
            },
          ],
        },
        {
          heading: "Estructura",
          fields: [
            {
              name: "towerCount",
              label: "Cantidad de torres",
              kind: "select",
              options: [
                { value: "", label: "Selecciona cantidad" },
                ...Array.from({ length: 10 }, (_, i) => ({
                  value: String(i + 1),
                  label: String(i + 1),
                })),
              ],
            },
            { name: "deliveryDate", label: "Fecha de entrega", kind: "month" },
            {
              name: "constructionCompany",
              label: "Gerencia",
              kind: "select",
              options: [
                { value: "", label: "Selecciona una inmobiliaria o constructora" },
                ...realEstateAgencies.map((a) => ({ value: a.name, label: a.name })),
                ...developers.map((d) => ({ value: d.name, label: d.name })),
              ],
            },
            {
              name: "builderId",
              label: "Quién construye",
              kind: "select",
              options: [
                { value: "", label: "Selecciona una constructora" },
                ...developers.map((d) => ({ value: String(d.id), label: d.name })),
              ],
            },
            {
              name: "sellerId",
              label: "Quién vende",
              kind: "select",
              options: [
                { value: "", label: "Selecciona una constructora" },
                ...developers.map((d) => ({ value: String(d.id), label: d.name })),
              ],
            },
            {
              name: "trustCompany",
              label: "Fiducia",
              kind: "select",
              options: [
                { value: "", label: "Selecciona una fiducia" },
                ...trustCompanies.map((t) => ({ value: t.name, label: t.name })),
              ],
            },
          ],
        },
      ],
    },
    {
      key: "detalle",
      title: "Detalle",
      description: "Características físicas, precio y financiación.",
      groups: [
        {
          heading: "Características",
          fields: [
            { name: "stratum", label: "Estrato", kind: "number", required: true },
          ],
        },
        {
          heading: "Precio y financiación",
          fields: [
            { name: "price", label: "Precio", kind: "number", required: true },
            { name: "initialFeePercentage", label: "% cuota inicial", kind: "number" },
            {
              name: "creditPercentage",
              label: "% crédito",
              kind: "number",
              hint: "Se calcula automáticamente a partir del % de cuota inicial.",
              readOnly: true,
            },
            {
              name: "initialFeeAmount",
              label: "Cuota inicial",
              kind: "text",
              hint: "Se calcula automáticamente a partir del precio y el % de cuota inicial.",
              readOnly: true,
            },
            {
              name: "creditAmount",
              label: "Crédito",
              kind: "text",
              hint: "Se calcula automáticamente a partir del precio y el % de cuota inicial.",
              readOnly: true,
            },
            { name: "separationAmount", label: "Separación", kind: "text" },
          ],
        },
      ],
    },
    {
      key: "seo",
      title: "SEO",
      description: "Variables de SEO y publicidad por plataforma. Este paso es opcional.",
      groups: [],
      optional: true,
    },
  ];
}

const EMPTY_TOWER_DETAIL: TowerDetail = { hasTrashChute: false, deliveryDate: null, elevatorCount: 0 };

/** Fills in defaults for towers saved before `deliveryDate`/`elevatorCount` existed. */
/** Reads `properties.seo` into the editor's shape, keeping only string values. */
function parseSeo(value: unknown): SeoValues {
  const source = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const platform = (key: keyof SeoValues) => {
    const fields = source[key];
    if (!fields || typeof fields !== "object" || Array.isArray(fields)) return {};
    return Object.fromEntries(
      Object.entries(fields as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
  };
  return { ...EMPTY_SEO, meta: platform("meta"), google: platform("google"), youtube: platform("youtube"), linkedin: platform("linkedin") };
}

function parseTowerDetails(raw: unknown): Record<string, TowerDetail> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, Partial<TowerDetail>>).map(([key, detail]) => [
      key,
      { ...EMPTY_TOWER_DETAIL, ...detail },
    ]),
  );
}

function fieldClassName() {
  return "h-10 w-full rounded-lg border border-separator bg-surface px-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-focus/30";
}


export function PropertyForm({
  developers,
  realEstateAgencies,
  trustCompanies,
  commonAreas,
  property,
  onSaved,
  openSeo = false,
}: {
  developers: { id: number; name: string }[];
  realEstateAgencies: { id: string; name: string }[];
  trustCompanies: { id: string; name: string }[];
  commonAreas: { id: string; name: string }[];
  /** When provided, the form edits this property instead of creating a new one. */
  property?: PropertyRecord;
  /** Called after a successful edit, instead of the default create-mode redirect. */
  onSaved?: () => void;
  /** Open straight on the SEO step, where the "Autorrellenar" button is (the detail view's shortcut). */
  openSeo?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const isEditing = Boolean(property);
  const steps = buildSteps(developers, realEstateAgencies, trustCompanies);
  const formId = useId();
  const [stepIndex, setStepIndex] = useState(() =>
    openSeo ? Math.max(0, steps.findIndex((s) => s.key === "seo")) : 0,
  );
  const [values, setValues] = useState<PropertyFormValues>(() =>
    property ? toInitialValues(property) : EMPTY_STATE,
  );
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(() =>
    property?.latitude != null && property?.longitude != null
      ? { lat: property.latitude, lng: property.longitude }
      : null,
  );
  const [amenities, setAmenities] = useState<Amenity[]>(() => {
    const parsed = parseAmenities(property?.amenities);
    // Resolve ids for legacy name-only entries so they get saved in the new shape.
    return parsed.map((a) => (a.id ? a : (commonAreas.find((c) => c.name === a.name) ?? a)));
  });
  const [towerTypologies, setTowerTypologies] = useState<Record<string, Typology[]>>(() => {
    if (property?.typologies && typeof property.typologies === 'object' && !Array.isArray(property.typologies)) {
      return property.typologies as Record<string, Typology[]>;
    }
    return {};
  });
  const [towerDetails, setTowerDetails] = useState<Record<string, TowerDetail>>(() =>
    parseTowerDetails(property?.tower_details),
  );
  const [images, setImages] = useState<PickedImage[]>(() =>
    (property?.additional_images ?? []).map(existingImage),
  );
  const [mainImage, setMainImage] = useState<PickedImage[]>(() =>
    property?.image ? [existingImage(property.image)] : [],
  );
  const [seo, setSeo] = useState<SeoValues>(() => parseSeo(property?.seo));
  // Share images live as picked files until save; existing ones come back as their URLs.
  const [seoImages, setSeoImages] = useState<SeoImages>(() => {
    const saved = parseSeo(property?.seo);
    return Object.fromEntries(
      SEO_IMAGE_FIELDS.map((field) => {
        const [platform, name] = field.split(".") as [keyof SeoValues, string];
        const url = saved[platform][name];
        return [field, url ? [existingImage(url)] : []];
      }),
    ) as SeoImages;
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isAutofilling, startAutofill] = useTransition();
  useRevokePreviewsOnUnmount(mainImage, images, ...Object.values(seoImages));

  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const nextStepIsOptional = steps[stepIndex + 1]?.optional ?? false;

  function setField(name: keyof PropertyFormValues, value: string) {
    setValues((prev) => {
      const next = { ...prev, [name]: value };

      // The initial-fee percentage drives the rest of the financing breakdown:
      // credit % is its complement, and both amounts scale off the price.
      if (name === "price" || name === "initialFeePercentage") {
        const price = Number(next.price);
        const initialFeePercentage = Number(next.initialFeePercentage);
        if (
          next.price.trim() !== "" &&
          next.initialFeePercentage.trim() !== "" &&
          price > 0 &&
          initialFeePercentage >= 0 &&
          initialFeePercentage <= 100
        ) {
          const creditPercentage = 100 - initialFeePercentage;
          next.creditPercentage = String(creditPercentage);
          next.initialFeeAmount = String(Math.round(price * (initialFeePercentage / 100)));
          next.creditAmount = String(Math.round(price * (creditPercentage / 100)));
        }
      }

      return next;
    });
  }

  function findMissingField(target = step) {
    for (const group of target.groups) {
      const missing = group.fields.find((f) => f.required && !values[f.name].trim());
      if (missing) return missing;
    }
    return null;
  }

  function goNext() {
    if (step.key === "macro" && mainImage.length === 0) {
      setError("La imagen principal es obligatoria.");
      return;
    }
    const missing = findMissingField();
    if (missing) {
      setError(`${missing.label} es obligatorio.`);
      return;
    }

    // Validate typologies when towers are selected
    if (step.key === "micro" && values.towerCount && Number(values.towerCount) > 0) {
      const towerCount = Number(values.towerCount);
      for (let i = 1; i <= towerCount; i++) {
        const towerKey = `tower-${i}`;
        const typologies = towerTypologies[towerKey] || [];
        if (typologies.length === 0) {
          setError(`Torre ${i} requiere al menos una tipología.`);
          return;
        }
      }
    }

    setError(null);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  function setTowerDetail(towerKey: string, patch: Partial<TowerDetail>) {
    setTowerDetails((prev) => ({
      ...prev,
      [towerKey]: { ...EMPTY_TOWER_DETAIL, ...prev[towerKey], ...patch },
    }));
  }

  function uploadImage(file: File, kind: PropertyImageKind) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);
    return uploadPropertyImage(formData);
  }

  /**
   * SEO autofill: suggested copy for every platform from the form's data, put
   * only into empty fields; plus one share image made from the main photo
   * (cropped to 1200 × 630 on the server) for whichever of Meta / LinkedIn has
   * no image yet. Nothing the user already wrote or picked is replaced.
   */
  function autofillSeo() {
    const texts = buildSeoTexts({
      ...values,
      developerName: developers.find((d) => String(d.id) === values.developerId)?.name,
      amenities: amenities.map((a) => a.name),
      typologies: Array.from({ length: Number(values.towerCount) || 0 }, (_, i) => towerTypologies[`tower-${i + 1}`] ?? []).flat(),
    });

    let filled = 0;
    const next: SeoValues = { meta: { ...seo.meta }, google: { ...seo.google }, youtube: { ...seo.youtube }, linkedin: { ...seo.linkedin } };
    for (const [platform, fields] of Object.entries(texts) as [keyof SeoValues, Record<string, string>][]) {
      for (const [name, value] of Object.entries(fields)) {
        if (value && !next[platform][name]?.trim()) {
          next[platform][name] = value;
          filled += 1;
        }
      }
    }
    setSeo(next);

    const missingImages = SEO_IMAGE_FIELDS.filter((field) => seoImages[field].length === 0);
    const main = mainImage[0];
    if (missingImages.length === 0 || !main) {
      if (!main && missingImages.length > 0) {
        toast.error("Falta la imagen principal", "Agrégala en el primer paso para generar la imagen para compartir.");
      }
      toast.success("SEO autorrellenado", filled ? `${filled} campos completados.` : "Todos los campos ya tenían contenido.");
      return;
    }

    startAutofill(async () => {
      const formData = new FormData();
      if (main.file) formData.append("file", main.file);
      else formData.append("url", main.previewUrl);
      const result = await createSeoShareImage(formData);
      if ("error" in result) {
        toast.error("No se pudo crear la imagen para compartir", result.error);
        return;
      }
      setSeoImages((prev) => {
        const updated = { ...prev };
        for (const field of missingImages) if (updated[field].length === 0) updated[field] = [existingImage(result.url)];
        return updated;
      });
      toast.success(
        "SEO autorrellenado",
        `${filled} campos completados y la imagen para compartir creada (1200 × 630) para ${missingImages.length === 2 ? "Meta y LinkedIn" : missingImages[0].startsWith("meta") ? "Meta" : "LinkedIn"}.`,
      );
    });
  }

  function goBack() {
    setError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function handleSubmit() {
    if (mainImage.length === 0) {
      setError("La imagen principal es obligatoria.");
      setStepIndex(0);
      return;
    }
    // Validate every step, not just the current one: when editing, the form
    // can be saved from any step.
    for (const [i, s] of steps.entries()) {
      const missing = findMissingField(s);
      if (missing) {
        setError(`${missing.label} es obligatorio.`);
        setStepIndex(i);
        return;
      }
    }

    // Validate typologies when towers are selected
    if (values.towerCount && Number(values.towerCount) > 0) {
      const towerCount = Number(values.towerCount);
      for (let i = 1; i <= towerCount; i++) {
        const towerKey = `tower-${i}`;
        const typologies = towerTypologies[towerKey] || [];
        if (typologies.length === 0) {
          setError(`Torre ${i} requiere al menos una tipología.`);
          setStepIndex(1); // Go to Micro step where typologies are edited
          return;
        }
      }
    }

    setError(null);
    startTransition(async () => {
      // The main image picker always holds exactly one entry at this point —
      // either a newly picked file (needs uploading) or an existing URL
      // carried over unchanged from the property being edited.
      // Swap every uploaded file for its stored URL as soon as it lands, so a
      // retry after a failure (or saving again while editing) doesn't upload
      // the same photo twice.
      const uploaded = new Map<string, string>();
      const swapUploaded = (list: PickedImage[]) =>
        list.map((img) => {
          const url = uploaded.get(img.id);
          if (!url) return img;
          if (img.previewUrl.startsWith("blob:")) URL.revokeObjectURL(img.previewUrl);
          return existingImage(url);
        });
      const commitUploads = () => {
        if (uploaded.size === 0) return;
        setMainImage(swapUploaded);
        setImages(swapUploaded);
        setSeoImages((prev) =>
          Object.fromEntries(Object.entries(prev).map(([field, list]) => [field, swapUploaded(list)])) as SeoImages,
        );
      };

      let imageUrl = mainImage[0].previewUrl;
      if (mainImage[0].file) {
        const mainUpload = await uploadImage(mainImage[0].file, "main");
        if ("error" in mainUpload) {
          setError(mainUpload.error);
          return;
        }
        imageUrl = mainUpload.url;
        uploaded.set(mainImage[0].id, imageUrl);
      }

      // Existing URLs are kept as-is; new files are uploaded one request each,
      // in their on-screen order.
      const additionalImages: string[] = [];
      for (const img of images) {
        if (!img.file) {
          additionalImages.push(img.previewUrl);
          continue;
        }
        const upload = await uploadImage(img.file, "secondary");
        if ("error" in upload) {
          commitUploads();
          setError(upload.error);
          return;
        }
        additionalImages.push(upload.url);
        uploaded.set(img.id, upload.url);
      }

      // Share images: upload new picks, keep existing URLs, clear removed ones.
      const seoPayload: SeoValues = {
        meta: { ...seo.meta },
        google: { ...seo.google },
        youtube: { ...seo.youtube },
        linkedin: { ...seo.linkedin },
      };
      for (const field of SEO_IMAGE_FIELDS) {
        const [platform, name] = field.split(".") as [keyof SeoValues, string];
        const picked = seoImages[field as SeoImageField][0];
        if (!picked) {
          delete seoPayload[platform][name];
          continue;
        }
        if (!picked.file) {
          seoPayload[platform][name] = picked.previewUrl;
          continue;
        }
        const upload = await uploadImage(picked.file, "seo");
        if ("error" in upload) {
          commitUploads();
          setError(upload.error);
          return;
        }
        seoPayload[platform][name] = upload.url;
        uploaded.set(picked.id, upload.url);
      }
      commitUploads();

      const towerKeys = Array.from({ length: Number(values.towerCount) || 0 }, (_, i) => `tower-${i + 1}`);
      const payload: CreatePropertyInput = {
        ...values,
        image: imageUrl,
        latitude: coordinates?.lat ?? null,
        longitude: coordinates?.lng ?? null,
        amenities,
        // Only the visible towers are saved, so lowering the count drops the extra towers' data.
        typologies: Object.fromEntries(towerKeys.flatMap((key) => (towerTypologies[key] ? [[key, towerTypologies[key]]] : []))),
        // Every visible tower is saved with defaults, even if its fields were never touched.
        towerDetails: Object.fromEntries(towerKeys.map((key) => [key, { ...EMPTY_TOWER_DETAIL, ...towerDetails[key] }])),
        additionalImages,
        seo: seoPayload,
      };

      const result =
        isEditing && property
          ? await updateProperty(property.id, payload)
          : await createProperty(payload);

      if (!result.success) {
        setError(result.error);
        toast.error(
          isEditing ? "No se pudo actualizar la propiedad" : "No se pudo crear la propiedad",
          result.error,
        );
        return;
      }

      toast.success(
        isEditing ? "Propiedad actualizada" : "Propiedad creada",
        isEditing
          ? "Los cambios se han guardado correctamente"
          : "La propiedad se ha agregado correctamente",
      );

      if (isEditing && property) {
        router.refresh();
        onSaved?.();
        return;
      }
      router.push("/dashboard/properties");
      router.refresh();
    });
  }

  const submitLabel = isPending
    ? isEditing
      ? "Guardando…"
      : "Creando…"
    : isEditing
      ? "Guardar cambios"
      : "Crear propiedad";

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex items-center" aria-label="Pasos del formulario">
        {steps.map((s, i) => {
          const state = i === stepIndex ? "current" : i < stepIndex ? "done" : "upcoming";
          return (
            <li key={s.key} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                onClick={() => setStepIndex(i)}
                aria-current={state === "current" ? "step" : undefined}
                className="flex items-center gap-2.5"
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    state === "current"
                      ? "bg-accent text-accent-foreground"
                      : state === "done"
                        ? "bg-accent-soft text-accent"
                        : "bg-surface-secondary text-muted"
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`text-sm font-medium ${
                    state === "upcoming" ? "text-muted" : "text-foreground"
                  }`}
                >
                  {s.title}
                  {s.optional ? <span className="ml-1 font-normal text-muted">(opcional)</span> : null}
                </span>
              </button>
              {i < steps.length - 1 ? (
                <span
                  className={`mx-3 h-px flex-1 ${
                    i < stepIndex ? "bg-accent" : "bg-separator"
                  }`}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <Card className="p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">{step.title}</h2>
          <p className="mt-1 text-sm text-muted">{step.description}</p>
        </div>

        <div className="flex flex-col gap-6">
          {step.groups.map((group, gi) => (
            <div key={group.heading ?? gi} className="flex flex-col gap-4">
              {group.heading ? (
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  {group.heading}
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                {group.fields.map((field) => {
                  const value = values[field.name];
                  const spanClass = field.wide ? "sm:col-span-2" : undefined;
                  const fieldId = `${formId}-${field.name}`;

                  if (field.kind === "location") {
                    return (
                      <div key={field.name} className={spanClass}>
                        <label className="mb-1.5 block text-sm font-medium">
                          {field.label}
                          {field.required ? <span className="text-danger"> *</span> : null}
                        </label>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <LocationPicker
                              label=""
                              value={value}
                              coordinates={coordinates}
                              onChange={(address, coords, location) => {
                                setField("address", address);
                                if (location) {
                                  setField("location", location);
                                }
                                setCoordinates(coords);
                              }}
                              isRequired={field.required}
                            />
                          </div>
                          {value && (
                            <Button
                              isIconOnly
                              variant="outline"
                              size="lg"
                              onPress={() => {
                                navigator.clipboard.writeText(value);
                                toast.success("Dirección copiada", "Se ha copiado la dirección al portapapeles");
                              }}
                              className="mb-0"
                            >
                              <Copy size={18} />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (field.kind === "select" || field.kind === "boolean") {
                    const options =
                      field.kind === "boolean" ? BOOLEAN_OPTIONS : (field.options ?? []);
                    return (
                      <div key={field.name} className={spanClass}>
                        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium">
                          {field.label}
                          {field.required ? <span className="text-danger"> *</span> : null}
                        </label>
                        <select
                          id={fieldId}
                          className={fieldClassName()}
                          value={value}
                          onChange={(e) => setField(field.name, e.target.value)}
                        >
                          {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  if (field.name === "city") {
                    return (
                      <div key={field.name} className={spanClass}>
                        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium">
                          {field.label}
                        </label>
                        <input
                          id={fieldId}
                          list={`${formId}-cities`}
                          className={fieldClassName()}
                          value={value}
                          placeholder="Empieza a escribir…"
                          onChange={(e) => setField(field.name, e.target.value)}
                        />
                        <datalist id={`${formId}-cities`}>
                          {CITY_OPTIONS.map((city) => (
                            <option key={city} value={city} />
                          ))}
                        </datalist>
                      </div>
                    );
                  }

                  return (
                    <div key={field.name} className={spanClass}>
                      <TextField
                        type={
                          field.kind === "number"
                            ? "number"
                            : field.kind === "month"
                              ? "month"
                              : field.kind === "tel"
                                ? "tel"
                                : field.kind === "email"
                                  ? "email"
                                  : "text"
                        }
                        value={value}
                        onChange={(v) => setField(field.name, v)}
                        isRequired={field.required}
                        isReadOnly={field.readOnly}
                        validationBehavior="aria"
                      >
                        <Label>{field.label}</Label>
                        {field.kind === "textarea" ? (
                          <TextArea placeholder={field.placeholder} rows={4} />
                        ) : (
                          <Input placeholder={field.placeholder} />
                        )}
                        {field.hint ? <p className="mt-1 text-xs text-muted">{field.hint}</p> : null}
                      </TextField>
                    </div>
                  );
                })}
              </div>

              {step.key === "macro" && gi === 0 ? (
                <>
                  <MultiImagePicker
                    images={mainImage}
                    onChange={setMainImage}
                    label="Imagen principal"
                    maxFiles={1}
                    required
                  />
                  <MultiImagePicker
                    images={images}
                    onChange={setImages}
                    label="Fotos adicionales"
                  />
                </>
              ) : null}

              {step.key === "micro" && gi === 1 && values.towerCount && Number(values.towerCount) > 0 ? (
                <div className="border-t border-separator pt-5">
                  <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted">
                    Tipologías por torre <span className="text-danger">*</span>
                  </p>
                  {Array.from({ length: Number(values.towerCount) }, (_, i) => (
                    <div key={`tower-${i + 1}`} className="mb-6 rounded-lg border border-separator p-4">
                      <h3 className="mb-4 text-sm font-semibold">Torre {i + 1}</h3>
                      <div className="mb-4 grid gap-4 sm:grid-cols-3">
                        <div>
                          <label
                            htmlFor={`${formId}-tower-${i + 1}-trash-chute`}
                            className="mb-1.5 block text-sm font-medium"
                          >
                            Cuenta con shut de basura
                          </label>
                          <select
                            id={`${formId}-tower-${i + 1}-trash-chute`}
                            className={fieldClassName()}
                            value={towerDetails[`tower-${i + 1}`]?.hasTrashChute ? "Sí" : "No"}
                            onChange={(e) =>
                              setTowerDetail(`tower-${i + 1}`, { hasTrashChute: e.target.value === "Sí" })
                            }
                          >
                            <option value="No">No</option>
                            <option value="Sí">Sí</option>
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor={`${formId}-tower-${i + 1}-delivery-date`}
                            className="mb-1.5 block text-sm font-medium"
                          >
                            Fecha de entrega
                          </label>
                          <input
                            id={`${formId}-tower-${i + 1}-delivery-date`}
                            type="date"
                            className={fieldClassName()}
                            value={towerDetails[`tower-${i + 1}`]?.deliveryDate ?? ""}
                            onChange={(e) =>
                              setTowerDetail(`tower-${i + 1}`, { deliveryDate: e.target.value || null })
                            }
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`${formId}-tower-${i + 1}-elevators`}
                            className="mb-1.5 block text-sm font-medium"
                          >
                            Cantidad de ascensores
                          </label>
                          <input
                            id={`${formId}-tower-${i + 1}-elevators`}
                            type="number"
                            min={0}
                            step={1}
                            className={fieldClassName()}
                            value={towerDetails[`tower-${i + 1}`]?.elevatorCount ?? 0}
                            onChange={(e) =>
                              setTowerDetail(`tower-${i + 1}`, {
                                elevatorCount: Math.max(0, Math.trunc(Number(e.target.value) || 0)),
                              })
                            }
                          />
                        </div>
                      </div>
                      <TypologiesEditor
                        typologies={towerTypologies[`tower-${i + 1}`] || []}
                        onChange={(newTypologies) => {
                          setTowerTypologies((prev) => ({
                            ...prev,
                            [`tower-${i + 1}`]: newTypologies,
                          }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : null}

            </div>
          ))}

          {step.key === "seo" ? (
            <SeoEditor
              values={seo}
              onChange={setSeo}
              images={seoImages}
              onImagesChange={setSeoImages}
              onAutofill={autofillSeo}
              autofilling={isAutofilling}
            />
          ) : null}

          {step.key === "micro" ? (
            <div className="flex flex-col gap-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                Zonas comunes
              </p>
              <TagMultiSelect
                options={commonAreas.map((c) => ({ id: c.id, name: c.name }))}
                selected={amenities}
                onChange={setAmenities}
              />
            </div>
          ) : null}
        </div>
      </Card>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onPress={goBack} isDisabled={stepIndex === 0}>
          Atrás
        </Button>

        {isLastStep ? (
          <Button type="button" variant="primary" onPress={handleSubmit} isDisabled={isPending}>
            {submitLabel}
          </Button>
        ) : nextStepIsOptional ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onPress={goNext}>
              Configurar SEO
            </Button>
            <Button type="button" variant="primary" onPress={handleSubmit} isDisabled={isPending}>
              {submitLabel}
            </Button>
          </div>
        ) : isEditing ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onPress={handleSubmit} isDisabled={isPending}>
              {isPending ? "Actualizando…" : "Actualizar propiedad"}
            </Button>
            <Button type="button" variant="primary" onPress={goNext}>
              Siguiente
            </Button>
          </div>
        ) : (
          <Button type="button" variant="primary" onPress={goNext}>
            Siguiente
          </Button>
        )}
      </div>
    </div>
  );
}

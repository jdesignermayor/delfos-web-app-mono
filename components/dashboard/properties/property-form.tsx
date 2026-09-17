"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, TextArea, TextField } from "@heroui/react";
import { Copy } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

import {
  createProperty,
  updateProperty,
  uploadPropertyImages,
  type CreatePropertyInput,
} from "@/app/actions/properties";
import { existingImage, MultiImagePicker, type PickedImage } from "@/components/multi-image-picker";
import { LocationPicker } from "@/components/location-picker";
import { TypologiesEditor, type Typology } from "@/components/dashboard/properties/typologies-editor";
import { TagMultiSelect } from "@/components/dashboard/tag-multi-select";
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
  "amenities" | "typologies" | "towerDetails" | "additionalImages" | "latitude" | "longitude"
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
  "bedrooms",
  "bathrooms",
  "parking",
  "area",
  "meters",
  "yearBuilt",
  "deliveryDate",
  "study",
  "developerId",
  "projectName",
  "towerName",
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
    bedrooms: str(property.bedrooms),
    bathrooms: str(property.bathrooms),
    parking: str(property.parking),
    area: property.area,
    meters: property.meters ?? "",
    yearBuilt: str(property.year_built),
    deliveryDate: property.delivery_date ? property.delivery_date.slice(0, 7) : "",
    study: property.study ?? "",
    developerId: str(property.developer_id),
    projectName: property.project_name ?? "",
    towerName: property.tower_name ?? "",
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
            { name: "towerName", label: "Torre", kind: "text" },
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
            { name: "area", label: "Área (m²)", kind: "number", required: true },
            { name: "meters", label: "Área alterna (opcional)", kind: "text" },
            { name: "bedrooms", label: "Alcobas", kind: "number", required: true },
            { name: "bathrooms", label: "Baños", kind: "number", required: true },
            { name: "parking", label: "Parqueadero", kind: "number", required: true },
            { name: "study", label: "Estudio", kind: "boolean" },
            { name: "stratum", label: "Estrato", kind: "number", required: true },
            { name: "yearBuilt", label: "Año de construcción", kind: "number", required: true },
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
  ];
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
}: {
  developers: { id: number; name: string }[];
  realEstateAgencies: { id: string; name: string }[];
  trustCompanies: { id: string; name: string }[];
  commonAreas: { id: string; name: string }[];
  /** When provided, the form edits this property instead of creating a new one. */
  property?: PropertyRecord;
  /** Called after a successful edit, instead of the default create-mode redirect. */
  onSaved?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const isEditing = Boolean(property);
  const steps = buildSteps(developers, realEstateAgencies, trustCompanies);
  const formId = useId();
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<PropertyFormValues>(() =>
    property ? toInitialValues(property) : EMPTY_STATE,
  );
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(() =>
    property?.latitude != null && property?.longitude != null
      ? { lat: property.latitude, lng: property.longitude }
      : null,
  );
  const [amenities, setAmenities] = useState<string[]>(() =>
    Array.isArray(property?.amenities) ? (property.amenities as string[]) : [],
  );
  const [towerTypologies, setTowerTypologies] = useState<Record<string, Typology[]>>(() => {
    if (property?.typologies && typeof property.typologies === 'object' && !Array.isArray(property.typologies)) {
      return property.typologies as Record<string, Typology[]>;
    }
    return {};
  });
  const [towerDetails, setTowerDetails] = useState<Record<string, { hasTrashChute: boolean }>>(() => {
    if (property?.tower_details && typeof property.tower_details === 'object' && !Array.isArray(property.tower_details)) {
      return property.tower_details as Record<string, { hasTrashChute: boolean }>;
    }
    return {};
  });
  const [images, setImages] = useState<PickedImage[]>(() =>
    (property?.additional_images ?? []).map(existingImage),
  );
  const [mainImage, setMainImage] = useState<PickedImage[]>(() =>
    property?.image ? [existingImage(property.image)] : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

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

  function findMissingField() {
    for (const group of step.groups) {
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
    const missing = findMissingField();
    if (missing) {
      setError(`${missing.label} es obligatorio.`);
      return;
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
      let imageUrl = mainImage[0].previewUrl;
      if (mainImage[0].file) {
        const mainUpload = await uploadPropertyImages([mainImage[0].file]);
        if ("error" in mainUpload) {
          setError(mainUpload.error);
          return;
        }
        imageUrl = mainUpload.urls[0];
      }

      const newFiles = images.flatMap((img) => (img.file ? [img.file] : []));
      let uploadedUrls: string[] = [];
      if (newFiles.length > 0) {
        const uploadResult = await uploadPropertyImages(newFiles);
        if ("error" in uploadResult) {
          setError(uploadResult.error);
          return;
        }
        uploadedUrls = uploadResult.urls;
      }
      const keptExistingUrls = images.filter((img) => !img.file).map((img) => img.previewUrl);
      const additionalImages = [...keptExistingUrls, ...uploadedUrls];

      const payload: CreatePropertyInput = {
        ...values,
        image: imageUrl,
        latitude: coordinates?.lat ?? null,
        longitude: coordinates?.lng ?? null,
        amenities,
        typologies: towerTypologies,
        towerDetails,
        additionalImages,
      };

      const result =
        isEditing && property
          ? await updateProperty(property.id, payload)
          : await createProperty(payload);

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (isEditing && property) {
        router.refresh();
        onSaved?.();
        return;
      }
      router.push("/dashboard/properties");
      router.refresh();
    });
  }

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
                      <div className="mb-4 max-w-xs">
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
                          onChange={(e) => {
                            const hasTrashChute = e.target.value === "Sí";
                            setTowerDetails((prev) => ({
                              ...prev,
                              [`tower-${i + 1}`]: { hasTrashChute },
                            }));
                          }}
                        >
                          <option value="No">No</option>
                          <option value="Sí">Sí</option>
                        </select>
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
            {isPending
              ? isEditing
                ? "Guardando…"
                : "Creando…"
              : isEditing
                ? "Guardar cambios"
                : "Crear propiedad"}
          </Button>
        ) : (
          <Button type="button" variant="primary" onPress={goNext}>
            Siguiente
          </Button>
        )}
      </div>
    </div>
  );
}

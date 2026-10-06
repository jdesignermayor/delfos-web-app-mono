"use client";

import { useState, type ComponentType, type SVGProps } from "react";
import { Input, Label, TextArea, TextField } from "@heroui/react";
import { GoogleIcon, LinkedInIcon, MetaIcon, YouTubeIcon } from "@/components/icons";
import { MultiImagePicker, type PickedImage } from "@/components/multi-image-picker";

export type SeoPlatform = "meta" | "google" | "youtube" | "linkedin";

type SeoField = {
  name: string;
  label: string;
  /** "image" is picked from the computer and uploaded when the property is saved. */
  kind: "text" | "textarea" | "url" | "image";
  placeholder?: string;
  hint?: string;
  /** Recommended max length; shows a character counter. */
  maxLength?: number;
  wide?: boolean;
};

type SeoPlatformConfig = {
  key: SeoPlatform;
  label: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  fields: SeoField[];
};

/** Values keyed by platform, then by field name; saved in `properties.seo`. */
export type SeoValues = Record<SeoPlatform, Record<string, string>>;

export const EMPTY_SEO: SeoValues = { meta: {}, google: {}, youtube: {}, linkedin: {} };

/** Share-image fields, as `platform.field`. Their value is the uploaded image URL. */
export const SEO_IMAGE_FIELDS = ["meta.ogImage", "linkedin.image"] as const;
export type SeoImageField = (typeof SEO_IMAGE_FIELDS)[number];

/** Picked share images per field (at most one each), kept by the form until it saves. */
export type SeoImages = Record<SeoImageField, PickedImage[]>;

const PLATFORMS: SeoPlatformConfig[] = [
  {
    key: "meta",
    label: "Meta",
    description: "Cómo se ve la propiedad al compartirse en Facebook e Instagram (Open Graph).",
    icon: MetaIcon,
    fields: [
      { name: "ogTitle", label: "Título (og:title)", kind: "text", maxLength: 60 },
      {
        name: "ogDescription",
        label: "Descripción (og:description)",
        kind: "textarea",
        maxLength: 160,
        wide: true,
      },
      {
        name: "ogImage",
        label: "Imagen para compartir (og:image)",
        kind: "image",
        hint: "Recomendado 1200 × 630 px (JPG, PNG o HEIC). Si se deja vacío se usa la imagen principal.",
        wide: true,
      },
      { name: "pixelId", label: "Meta Pixel ID", kind: "text", placeholder: "123456789012345" },
      { name: "campaign", label: "Campaña (utm_campaign)", kind: "text" },
    ],
  },
  {
    key: "google",
    label: "Google",
    description: "Metadatos para buscadores y seguimiento de Google Ads / Analytics.",
    icon: GoogleIcon,
    fields: [
      { name: "metaTitle", label: "Meta título", kind: "text", maxLength: 60 },
      { name: "slug", label: "Slug", kind: "text", placeholder: "proyecto-en-medellin" },
      {
        name: "metaDescription",
        label: "Meta descripción",
        kind: "textarea",
        maxLength: 160,
        wide: true,
      },
      {
        name: "keywords",
        label: "Palabras clave",
        kind: "text",
        placeholder: "apartamentos, medellín, vis",
        hint: "Separadas por comas.",
        wide: true,
      },
      { name: "canonicalUrl", label: "URL canónica", kind: "url", placeholder: "https://…" },
      { name: "adsConversionId", label: "Google Ads conversion ID", kind: "text", placeholder: "AW-XXXXXXXXX" },
    ],
  },
  {
    key: "youtube",
    label: "YouTube",
    description: "Video promocional del proyecto y sus metadatos.",
    icon: YouTubeIcon,
    fields: [
      {
        name: "videoUrl",
        label: "URL del video",
        kind: "url",
        placeholder: "https://www.youtube.com/watch?v=…",
        wide: true,
      },
      { name: "videoTitle", label: "Título del video", kind: "text", maxLength: 100 },
      { name: "tags", label: "Etiquetas", kind: "text", hint: "Separadas por comas." },
      {
        name: "videoDescription",
        label: "Descripción del video",
        kind: "textarea",
        maxLength: 5000,
        wide: true,
      },
    ],
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    description: "Cómo se ve la propiedad al compartirse en LinkedIn.",
    icon: LinkedInIcon,
    fields: [
      { name: "title", label: "Título", kind: "text", maxLength: 70 },
      { name: "insightTagId", label: "Insight Tag partner ID", kind: "text", placeholder: "1234567" },
      { name: "description", label: "Descripción", kind: "textarea", maxLength: 150, wide: true },
      {
        name: "image",
        label: "Imagen para compartir",
        kind: "image",
        hint: "Recomendado 1200 × 627 px (JPG, PNG o HEIC). Si se deja vacío se usa la imagen principal.",
        wide: true,
      },
    ],
  },
];

export function SeoEditor({
  values,
  onChange,
  images,
  onImagesChange,
}: {
  values: SeoValues;
  onChange: (values: SeoValues) => void;
  images: SeoImages;
  onImagesChange: (images: SeoImages) => void;
}) {
  const [active, setActive] = useState<SeoPlatform>("meta");
  const platform = PLATFORMS.find((p) => p.key === active)!;
  const platformValues = values[active];

  function setField(name: string, value: string) {
    onChange({ ...values, [active]: { ...platformValues, [name]: value } });
  }

  function filledCount(key: SeoPlatform) {
    const texts = Object.entries(values[key]).filter(
      ([name, v]) => v.trim() && !SEO_IMAGE_FIELDS.includes(`${key}.${name}` as SeoImageField),
    ).length;
    const pictures = SEO_IMAGE_FIELDS.filter((field) => field.startsWith(`${key}.`) && images[field].length).length;
    return texts + pictures;
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label="Plataformas"
        className="flex gap-1 overflow-x-auto rounded-xl bg-surface-secondary p-1"
      >
        {PLATFORMS.map((p) => {
          const Icon = p.icon;
          const selected = p.key === active;
          const count = filledCount(p.key);
          return (
            <button
              key={p.key}
              type="button"
              role="tab"
              id={`seo-tab-${p.key}`}
              aria-selected={selected}
              aria-controls={`seo-panel-${p.key}`}
              onClick={() => setActive(p.key)}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                selected
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Icon width={18} height={18} />
              {p.label}
              {count > 0 ? (
                <span className="rounded-full bg-accent-soft px-1.5 text-xs text-accent">{count}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`seo-panel-${active}`}
        aria-labelledby={`seo-tab-${active}`}
        className="flex flex-col gap-4"
      >
        <p className="text-sm text-muted">{platform.description}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          {platform.fields.map((field) => {
            const value = platformValues[field.name] ?? "";
            const overLimit = field.maxLength !== undefined && value.length > field.maxLength;
            if (field.kind === "image") {
              const key = `${active}.${field.name}` as SeoImageField;
              return (
                <div key={key} className={field.wide ? "sm:col-span-2" : undefined}>
                  <MultiImagePicker
                    images={images[key]}
                    onChange={(next) => onImagesChange({ ...images, [key]: next })}
                    label={field.label}
                    hint={field.hint}
                    maxFiles={1}
                  />
                </div>
              );
            }
            return (
              <div key={`${active}-${field.name}`} className={field.wide ? "sm:col-span-2" : undefined}>
                <TextField
                  type={field.kind === "url" ? "url" : "text"}
                  value={value}
                  onChange={(v) => setField(field.name, v)}
                >
                  <Label>{field.label}</Label>
                  {field.kind === "textarea" ? (
                    <TextArea placeholder={field.placeholder} rows={3} />
                  ) : (
                    <Input placeholder={field.placeholder} />
                  )}
                  {field.hint || field.maxLength !== undefined ? (
                    <div className="mt-1 flex justify-between gap-2 text-xs text-muted">
                      <span>{field.hint}</span>
                      {field.maxLength !== undefined ? (
                        <span className={overLimit ? "text-danger" : undefined}>
                          {value.length}/{field.maxLength}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </TextField>
              </div>
            );
          })}
        </div>

        {active === "google" ? <GooglePreview values={platformValues} /> : null}
      </div>
    </div>
  );
}

function GooglePreview({ values }: { values: Record<string, string> }) {
  const title = values.metaTitle?.trim() || "Título de la propiedad";
  const description =
    values.metaDescription?.trim() || "La meta descripción aparecerá aquí en los resultados de búsqueda.";
  const slug = values.slug?.trim() || "propiedad";

  return (
    <div className="rounded-lg border border-separator p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
        Vista previa en Google
      </p>
      <p className="truncate text-xs text-muted">godelfos.co › propiedades › {slug}</p>
      <p className="truncate text-lg text-[#1a0dab] dark:text-[#8ab4f8]">{title}</p>
      <p className="line-clamp-2 text-sm text-muted">{description}</p>
    </div>
  );
}

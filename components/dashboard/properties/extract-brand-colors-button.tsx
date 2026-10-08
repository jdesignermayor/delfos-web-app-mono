"use client";

import { useId, useState, useTransition } from "react";
import { Button } from "@heroui/react";
import { CircleAlert, CircleCheck, LoaderCircle, Palette } from "lucide-react";

import { extractBrandColors } from "@/app/actions/brand-colors";
import { useToast } from "@/components/providers/toast-provider";
import { BRAND_COLOR_KEYS, type BrandColorKey, type BrandColors } from "@/lib/brand-colors";
import { normalizeWebsiteUrl } from "@/lib/url";

type Result =
  | { status: "success"; url: string; colors: BrandColors }
  | { status: "error"; url: string; message: string };

/** Swatches + the extracted JSON, shown while hovering/focusing a successful button. */
function ColorsPreview({ id, colors }: { id: string; colors: BrandColors }) {
  return (
    <div
      id={id}
      role="tooltip"
      className="pointer-events-none invisible absolute left-0 top-full z-30 mt-2 w-64 rounded-xl border border-separator bg-surface p-3 opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
    >
      <div className="mb-2 flex gap-1.5">
        {BRAND_COLOR_KEYS.map((key) =>
          colors[key] ? (
            <span
              key={key}
              title={key}
              className="size-6 rounded-md border border-separator"
              style={{ backgroundColor: colors[key] }}
            />
          ) : null,
        )}
      </div>
      <pre className="overflow-x-auto rounded-lg bg-surface-secondary p-2 font-mono text-xs text-foreground">
        {JSON.stringify(colors, null, 2)}
      </pre>
    </div>
  );
}

const ROLE_LABELS: Record<BrandColorKey, string> = {
  primary: "Primario",
  secondary: "Secundario",
  tertiary: "Terciario",
};

const hasColors = (colors: BrandColors) => BRAND_COLOR_KEYS.some((key) => colors[key]);

/** "Primario #12a56f · Secundario #162737 · …" for the success toast. */
const describeColors = (colors: BrandColors) =>
  BRAND_COLOR_KEYS.filter((key) => colors[key])
    .map((key) => `${ROLE_LABELS[key]} ${colors[key]}`)
    .join(" · ");

/**
 * Always-visible state of the property's brand colors, so it's clear in both
 * create and edit whether they were extracted and whether they're saved.
 */
function BrandColorsSummary({ colors, isExisting }: { colors: BrandColors; isExisting: boolean }) {
  if (!hasColors(colors)) {
    return <p className="text-xs text-muted">Aún no se han extraído los colores de la marca.</p>;
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-success/40 bg-success-soft p-3" role="status">
      <p className="flex items-center gap-1.5 text-xs font-medium text-success">
        <CircleCheck className="size-3.5" />
        {isExisting ? "Colores extraídos y guardados en la propiedad." : "Colores extraídos. Se guardarán al crear la propiedad."}
      </p>
      <ul className="flex flex-wrap gap-3">
        {BRAND_COLOR_KEYS.map((key) =>
          colors[key] ? (
            <li key={key} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-7 shrink-0 rounded-lg border border-separator"
                style={{ backgroundColor: colors[key] }}
              />
              <span className="flex flex-col leading-tight">
                <span className="text-xs text-muted">{ROLE_LABELS[key]}</span>
                <span className="font-mono text-xs uppercase text-foreground">{colors[key]}</span>
              </span>
            </li>
          ) : null,
        )}
      </ul>
    </div>
  );
}

type Availability = { websiteUrl: string; reason: null } | { websiteUrl: null; reason: string };

/**
 * Which site will be read, mirroring the server: an existing property always
 * uses its saved website; a new one uses what's typed. No site → disabled.
 */
function availability(projectUrl: string, savedProjectUrl: string | null | undefined, isExisting: boolean): Availability {
  const typed = normalizeWebsiteUrl(projectUrl);
  if (!isExisting) {
    return typed
      ? { websiteUrl: typed, reason: null }
      : { websiteUrl: null, reason: "Agrega el sitio web del proyecto para extraer sus colores." };
  }

  const saved = normalizeWebsiteUrl(savedProjectUrl ?? "");
  if (!saved) {
    return { websiteUrl: null, reason: "Guarda el sitio web del proyecto para extraer sus colores." };
  }
  if (typed !== saved) {
    return { websiteUrl: null, reason: "Guarda los cambios del sitio web para extraer sus colores." };
  }
  return { websiteUrl: saved, reason: null };
}

/**
 * Extracts the brand colors from the project's website and shows the current
 * ones. Editing: the server reads the saved website and saves the colors on the
 * property right away. Creating: the form keeps them (`onExtractedAction`) and
 * saves them with the new property.
 */
export function ExtractBrandColorsButton({
  projectUrl,
  savedProjectUrl,
  propertyId,
  colors,
  onExtractedAction,
}: {
  /** What's typed in the form right now. */
  projectUrl: string;
  /** `project_url` as stored in the database (existing properties only). */
  savedProjectUrl?: string | null;
  propertyId?: number;
  /** The property's current brand colors (saved ones when editing, extracted ones when creating). */
  colors: BrandColors;
  onExtractedAction: (colors: BrandColors) => void;
}) {
  const toast = useToast();
  const [result, setResult] = useState<Result | null>(null);
  const [isPending, startTransition] = useTransition();
  const previewId = useId();

  const { websiteUrl, reason } = availability(projectUrl, savedProjectUrl, propertyId != null);
  // A result only applies to the URL it was extracted from.
  const current = result && result.url === websiteUrl ? result : null;

  function extract() {
    if (!websiteUrl) return;
    startTransition(async () => {
      const response = await extractBrandColors(propertyId != null ? { propertyId } : { url: websiteUrl });
      if (!response.success) {
        setResult({ status: "error", url: websiteUrl, message: response.error });
        toast.error("No se pudieron extraer los colores", response.error);
        return;
      }
      setResult({ status: "success", url: websiteUrl, colors: response.colors });
      onExtractedAction(response.colors);
      toast.success("Colores de la marca extraídos", describeColors(response.colors));
    });
  }

  const succeeded = current?.status === "success";
  const failed = current?.status === "error";
  const Icon = isPending ? LoaderCircle : succeeded ? CircleCheck : failed ? CircleAlert : Palette;
  const label = isPending
    ? "Extrayendo colores…"
    : succeeded
      ? "Colores extraídos"
      : failed
        ? "Reintentar extracción"
        : "Extraer colores de la marca";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="group relative w-fit">
        <Button
          type="button"
          variant="outline"
          onPress={extract}
          isPending={isPending}
          isDisabled={!websiteUrl}
          aria-describedby={succeeded ? previewId : undefined}
          className={succeeded ? "border-success text-success" : failed ? "border-danger text-danger" : undefined}
        >
          <Icon className={`size-4 ${isPending ? "animate-spin" : ""}`} />
          {label}
        </Button>
        {succeeded ? <ColorsPreview id={previewId} colors={current.colors} /> : null}
      </div>

      {failed ? (
        <p className="text-xs text-danger" role="alert">
          {current.message}
        </p>
      ) : reason ? (
        <p className="text-xs text-muted">{reason}</p>
      ) : succeeded ? (
        <p className="text-xs text-muted">Pasa el cursor sobre el botón para ver el JSON extraído.</p>
      ) : null}

      <BrandColorsSummary colors={colors} isExisting={propertyId != null} />
    </div>
  );
}

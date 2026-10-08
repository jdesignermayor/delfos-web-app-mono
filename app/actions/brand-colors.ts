"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { PROPERTIES_CACHE_TAG } from "@/lib/cache-tags";
import { getDashboardUser } from "@/lib/auth/dal";
import { canManageProperty, type DashboardUser } from "@/lib/auth/permissions";
import { ExtractionError, extractBrandColorsFromWebsite } from "@/lib/brand-color-extraction/extract";
import { BRAND_COLOR_KEYS, cleanBrandColors, type BrandColors } from "@/lib/brand-colors";
import { createRateLimiter } from "@/lib/rate-limit";
import { normalizeWebsiteUrl } from "@/lib/url";
import { createAdminClient } from "@/supabase/admin";

export type ExtractBrandColorsResult =
  | { success: true; colors: BrandColors }
  | { success: false; error: string };

const UNAUTHORIZED = "No tienes permiso para realizar esta acción.";

/** Each uncached extraction downloads a whole website: a few per minute is plenty for one person. */
const extractionLimiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

const NO_WEBSITE = "El proyecto no tiene un sitio web válido. Guárdalo primero para extraer sus colores.";

type SiteResolution = { ok: true; websiteUrl: string } | { ok: false; error: string };

/**
 * The website to read: for an existing property, always the `project_url` saved
 * in the database (never a URL sent by the browser); while creating one there's
 * no row yet, so the URL typed in the form is used. Without a valid site the
 * feature is off.
 */
async function resolveWebsite(user: DashboardUser, target: ExtractTarget): Promise<SiteResolution> {
  if (!("propertyId" in target)) {
    const websiteUrl = normalizeWebsiteUrl(target.url);
    return websiteUrl ? { ok: true, websiteUrl } : { ok: false, error: NO_WEBSITE };
  }

  const { data } = await createAdminClient()
    .from("properties")
    .select("developer_id, project_url")
    .eq("id", target.propertyId)
    .maybeSingle();
  if (!data || !canManageProperty(user, data.developer_id)) return { ok: false, error: UNAUTHORIZED };

  const websiteUrl = normalizeWebsiteUrl(data.project_url ?? "");
  return websiteUrl ? { ok: true, websiteUrl } : { ok: false, error: NO_WEBSITE };
}

/** An existing property (its saved website is used) or a property being created (the typed one). */
export type ExtractTarget = { propertyId: number } | { url: string };

/**
 * Reads the project's website and returns its primary, secondary and tertiary
 * brand colors. For an existing property they're saved to
 * `properties.brand_colors` right away — the property form never sends them on
 * update; a property being created sends them with `createProperty`.
 */
export async function extractBrandColors(target: ExtractTarget): Promise<ExtractBrandColorsResult> {
  const user = await getDashboardUser();
  if (!user) return { success: false, error: UNAUTHORIZED };

  // Resolve (and validate) the site before rate limiting, so a disabled call costs nothing.
  const site = await resolveWebsite(user, target);
  if (!site.ok) return { success: false, error: site.error };
  if (!extractionLimiter.tryConsume(user.id)) {
    return { success: false, error: "Demasiados intentos. Espera un minuto y vuelve a intentarlo." };
  }

  let colors: BrandColors;
  try {
    colors = await extractBrandColorsFromWebsite(site.websiteUrl);
  } catch (error) {
    if (error instanceof ExtractionError) return { success: false, error: error.message };
    console.error("[extractBrandColors]", site.websiteUrl, error);
    return { success: false, error: "No pudimos extraer los colores de este sitio." };
  }

  if (BRAND_COLOR_KEYS.every((key) => !colors[key])) {
    return { success: false, error: "No encontramos colores de marca en este sitio." };
  }

  if ("propertyId" in target) {
    const { error } = await createAdminClient()
      .from("properties")
      .update({ brand_colors: cleanBrandColors(colors) })
      .eq("id", target.propertyId);
    if (error) return { success: false, error: error.message };
    // The public detail page reads the property from the Data Cache: refresh it so the new
    // palette shows there, and the dashboard page so reopening the editor shows it too.
    revalidateTag(PROPERTIES_CACHE_TAG, "max");
    revalidatePath(`/dashboard/properties/${target.propertyId}`);
  }

  return { success: true, colors };
}

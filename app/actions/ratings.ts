"use server";

import { getCurrentUser } from "@/supabase/roles";
import { findPropertyId } from "@/lib/favorites/favorites-repository";
import { createRateLimiter } from "@/lib/rate-limit";
import { getRatingSummary, getUserRating, upsertRating, type RatingSummary } from "@/lib/ratings/ratings-repository";
import { createClient } from "@/supabase/server";

/**
 * Who may rate: signed-in users with the "viewer" role (the public's accounts). Constructoras and
 * Delfos staff can't, so nobody rates their own projects.
 */
export type RatingAccess = "can-rate" | "signed-out" | "not-allowed";

export type PropertyRatingState = RatingSummary & { myRating: number | null; access: RatingAccess };

export type SetRatingResult =
  | ({ success: true } & RatingSummary & { myRating: number })
  | { success: false; error: string; reason?: "signed-out" | "not-allowed" };

const ratingLimiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function currentAccess(): Promise<{ access: RatingAccess; userId: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { access: "signed-out", userId: null };
  return { access: user.role === "viewer" && user.isActive ? "can-rate" : "not-allowed", userId: user.id };
}

/**
 * A property's rating summary plus the visitor's own rating and whether they may rate. Loaded from
 * the client so the property page itself stays static. `null` for unknown properties.
 */
export async function getPropertyRatingAction(propertyUuid: string): Promise<PropertyRatingState | null> {
  if (typeof propertyUuid !== "string" || !UUID_RE.test(propertyUuid)) return null;

  try {
    const supabase = await createClient();
    const propertyId = await findPropertyId(supabase, propertyUuid);
    if (propertyId === null) return null;

    const { access, userId } = await currentAccess();
    const [summary, myRating] = await Promise.all([
      getRatingSummary(supabase, propertyId),
      access === "can-rate" && userId ? getUserRating(supabase, userId, propertyId) : Promise.resolve(null),
    ]);
    return { ...summary, myRating, access };
  } catch {
    return null;
  }
}

/** Saves the signed-in user's 1–5 rating of a property and returns the updated summary. */
export async function setPropertyRatingAction(input: { propertyUuid: string; rating: number }): Promise<SetRatingResult> {
  const { access, userId } = await currentAccess();
  if (access === "signed-out" || !userId) {
    return { success: false, error: "Inicia sesión para calificar.", reason: "signed-out" };
  }
  if (access === "not-allowed") {
    return { success: false, error: "Solo los usuarios pueden calificar proyectos.", reason: "not-allowed" };
  }
  if (!ratingLimiter.tryConsume(userId)) {
    return { success: false, error: "Demasiados cambios seguidos. Espera un momento." };
  }

  const propertyUuid = typeof input?.propertyUuid === "string" ? input.propertyUuid : "";
  const rating = Number(input?.rating);
  if (!UUID_RE.test(propertyUuid)) return { success: false, error: "Propiedad no válida." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { success: false, error: "Calificación no válida." };

  try {
    const supabase = await createClient();
    const propertyId = await findPropertyId(supabase, propertyUuid);
    if (propertyId === null) return { success: false, error: "Propiedad no válida." };

    await upsertRating(supabase, userId, propertyId, rating);
    const summary = await getRatingSummary(supabase, propertyId);
    return { success: true, ...summary, myRating: rating };
  } catch {
    return { success: false, error: "No pudimos guardar tu calificación. Intenta de nuevo." };
  }
}

/**
 * Pure authorization rules — no I/O, so they're safe to use from Server and
 * Client Components alike. Server-side enforcement lives in `lib/auth/dal.ts`.
 */
import type { CurrentUser, UserDeveloper } from "@/supabase/roles";

/** A user allowed into `/dashboard`. */
export type DashboardUser =
  | (CurrentUser & { role: "superadmin" })
  | (CurrentUser & { role: "admin"; developer: UserDeveloper });

export function isSuperadmin(user: CurrentUser | null): boolean {
  return user?.role === "superadmin";
}

/**
 * Why this user may not sign in, or `null` when they can. Applies to every
 * role: the profile must exist and be active, and a constructora admin's
 * constructora must exist and be enabled.
 */
export function signInDenialReason(user: CurrentUser): string | null {
  if (!user.hasProfile) return "Tu usuario no está registrado en Delfos.";
  if (!user.isActive) return "Tu usuario está deshabilitado. Contacta al administrador.";
  if (user.role === "admin") {
    if (!user.developer) return "Tu usuario no está asociado a ninguna constructora.";
    if (!user.developer.isEnabled) return "Tu constructora no está habilitada. Contacta al administrador.";
  }
  return null;
}

export function canAccessDashboard(user: CurrentUser | null): user is DashboardUser {
  if (!user || signInDenialReason(user) !== null) return false;
  return user.role === "superadmin" || user.role === "admin";
}

/**
 * The constructora whose data this user is limited to, or `null` when they
 * can see everything (superadmin).
 */
export function developerScope(user: DashboardUser): number | null {
  return user.role === "admin" ? user.developer.id : null;
}

/** Whether the user may view / edit a property owned by `developerId`. */
export function canManageProperty(user: DashboardUser, developerId: number | null): boolean {
  const scope = developerScope(user);
  return scope === null || scope === developerId;
}

/** Catalogs a constructora admin may list and add to (never edit or delete). */
const DEVELOPER_CREATABLE_ENTITIES: ReadonlySet<string> = new Set(["trust_companies"]);

export type EntityAction = "read" | "create" | "modify";

/**
 * Whether the user may perform `action` on the `type` catalog (constructoras,
 * bancos, fiducias…). Superadmins can do everything; constructora admins can
 * read and create fiducias, but only superadmins edit or delete them.
 */
export function canAccessEntity(user: DashboardUser, type: string, action: EntityAction): boolean {
  if (user.role === "superadmin") return true;
  return action !== "modify" && DEVELOPER_CREATABLE_ENTITIES.has(type);
}

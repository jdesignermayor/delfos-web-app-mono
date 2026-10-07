import { requireSuperadmin } from "@/lib/auth/dal";

/**
 * Platform-wide configuration (constructoras, bancos, users…) — superadmins
 * only. Constructora admins are sent back to `/dashboard`. The data these
 * pages read and write is also guarded inside each Server Action.
 */
export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperadmin();
  return children;
}

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

/**
 * Service-role client — bypasses Row Level Security. Server-only: never
 * import this file from a Client Component or expose SUPABASE_SECRET_KEY
 * to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

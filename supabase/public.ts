import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

/**
 * Anon-key client for public marketing pages/sections that read data but
 * don't need the visitor's session. Unlike `@/supabase/server`, this never
 * calls `cookies()`, so it won't force a route into dynamic rendering —
 * important for `/propiedades/[slug]`, which mixes statically generated
 * mock slugs (via generateStaticParams) with on-demand DB lookups: calling
 * a cookie-based client there hit Next's DYNAMIC_SERVER_USAGE error.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

/**
 * Service-role client — bypasses Row Level Security. Server-only: never
 * import this file from a Client Component or expose SUPABASE_SECRET_KEY
 * to the browser.
 *
 * With `cache`, reads go through Next's data cache (refreshed every
 * `revalidate` seconds or when one of `tags` is expired) — only for data that
 * every mutation path invalidates explicitly.
 */
export function createAdminClient(cache?: { revalidate: number; tags: string[] }) {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      ...(cache
        ? {
            global: {
              fetch: (input: RequestInfo | URL, init?: RequestInit) =>
                fetch(input, { ...init, next: { revalidate: cache.revalidate, tags: cache.tags } }),
            },
          }
        : {}),
    },
  );
}

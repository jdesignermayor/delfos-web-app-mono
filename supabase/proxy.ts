import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "./types";

/**
 * Keeps the Supabase session fresh. Server Components can't write cookies, so
 * when the access token expires the refreshed one must be persisted here,
 * before rendering — otherwise every request would refresh it again (an extra
 * network round trip) and reusing the single-use refresh token eventually
 * gets the session revoked.
 *
 * Authorization is NOT decided here; pages and Server Actions check access
 * themselves through `lib/auth/dal.ts`.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Forward the refreshed cookies to the render (request) and the browser (response).
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        },
      },
    },
  );

  // Verifies the JWT locally (ES256) and refreshes it only when it has expired.
  // Must run between creating the client and returning the response.
  await supabase.auth.getClaims();

  return response;
}

import type { NextRequest } from "next/server";

import { updateSession } from "@/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Every page and Server Action request, but not static assets, image
  // optimization, generated OG images or metadata files.
  matcher: [
    "/((?!_next/static|_next/image|og/|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};

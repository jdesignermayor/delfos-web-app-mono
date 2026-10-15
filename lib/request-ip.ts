import "server-only";

import { headers } from "next/headers";

/** The caller's IP as reported by the proxy in front of the app, for rate limiting only. */
export async function getClientIp(): Promise<string> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || requestHeaders.get("x-real-ip") || "unknown";
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `value` if it's a UUID (e.g. a catalog row id from a route segment), otherwise `null`. */
export function parseUuid(value: unknown): string | null {
  return typeof value === "string" && UUID_REGEX.test(value) ? value : null;
}

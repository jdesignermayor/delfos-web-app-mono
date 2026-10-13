/**
 * GETs one of our Route Handlers for a TanStack Query `queryFn`. Throws on a
 * non-2xx response with the handler's `{ error }` message (or `fallbackError`),
 * so the query lands in its error state.
 */
export async function fetchJson<T>(url: string, fallbackError: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const body: { error?: string } | null = await response.json().catch(() => null);
    throw new Error(body?.error ?? fallbackError);
  }
  return response.json() as Promise<T>;
}

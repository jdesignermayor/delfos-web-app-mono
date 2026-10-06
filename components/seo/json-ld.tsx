/**
 * Structured data for search engines (schema.org, JSON-LD format).
 *
 * It renders `<script type="application/ld+json">…</script>`: invisible to
 * visitors and never executed — browsers ignore this script type. Google reads
 * it to understand the page (here: an apartment complex with address, location,
 * photos and video) and can show rich results from it.
 *
 * React can't put raw text inside a <script> any other way, hence
 * `dangerouslySetInnerHTML` — the pattern from Next's JSON-LD guide. It's safe
 * because the content is our own data serialised with JSON.stringify, and every
 * `<` is escaped so no value can close the tag early.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

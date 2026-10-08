/**
 * Property descriptions are stored as a small Markdown subset: paragraphs,
 * line breaks, **bold**, *italic*, ### subtitles and bullet / numbered lists.
 * The dashboard editor writes it and `MarkdownContent` renders it.
 */

/**
 * Typography for that subset, shared by the editor and the rendered page so
 * what the admin sees while typing is what visitors get (no typography plugin).
 */
export const MARKDOWN_PROSE_CLASS = [
  "leading-relaxed",
  "[&_p]:my-3 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
  "[&_h3]:mb-2 [&_h3]:mt-5 [&_h3:first-child]:mt-0 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_li]:my-1 [&_li>p]:my-0 [&_li::marker]:text-muted",
].join(" ");

/** Plain text for places that can't render Markdown (e.g. a YouTube description). */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/^\s*[-*+]\s+/gm, "• ") // bullet items
    .replace(/(\*\*|__)(.+?)\1/g, "$2") // bold
    .replace(/(\*|_)(.+?)\1/g, "$2") // italic
    .replace(/\\([\\`*_{}[\]()#+\-.!])/g, "$1") // escaped characters
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

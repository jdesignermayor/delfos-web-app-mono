import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";

import { MARKDOWN_PROSE_CLASS } from "@/lib/markdown";

/** Only what the description editor can produce; anything else (images, links, raw HTML…) is dropped. */
const ALLOWED_ELEMENTS = ["p", "br", "strong", "em", "h3", "ul", "ol", "li"];

/**
 * Renders a property description written in the dashboard editor. Works as a
 * Server Component, so it adds no client JavaScript. `remark-breaks` keeps
 * single line breaks, which older plain-text descriptions rely on.
 */
export function MarkdownContent({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`${MARKDOWN_PROSE_CLASS} ${className}`}>
      <Markdown remarkPlugins={[remarkBreaks]} allowedElements={ALLOWED_ELEMENTS} unwrapDisallowed>
        {children}
      </Markdown>
    </div>
  );
}

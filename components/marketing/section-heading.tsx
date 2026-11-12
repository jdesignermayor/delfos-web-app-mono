import type { CSSProperties, ReactNode } from "react";

/**
 * Eyebrow + h2 + lead paragraph shared by the landing's content sections. Quiet brutalism: a fine
 * mono line with the section's index (`01`) after a short ink rule, a bold sentence-case title,
 * and a plain lead.
 */
export function SectionHeading({
  eyebrow,
  title,
  children,
  className,
  index,
}: {
  eyebrow: string;
  title: string;
  /** Lead paragraph under the title. */
  children: ReactNode;
  className?: string;
  /** Section number shown in the tag, e.g. "01". */
  index?: string;
}) {
  return (
    <div className={className}>
      <span data-reveal="left" className="inline-flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.2em] text-ink/65">
        <span aria-hidden="true" className="h-px w-6 bg-ink" />
        {index ? <span className="text-ink">{index}</span> : null}
        {eyebrow}
      </span>
      <h2 data-reveal="up" style={{ "--i": 1 } as CSSProperties} className="mt-4 font-display text-3xl font-bold leading-[1.02] tracking-tight text-balance text-ink sm:text-5xl">
        {title}
      </h2>
      <p data-reveal="up" style={{ "--i": 2 } as CSSProperties} className="mt-5 max-w-xl text-base leading-relaxed text-ink/80 sm:text-lg">{children}</p>
    </div>
  );
}

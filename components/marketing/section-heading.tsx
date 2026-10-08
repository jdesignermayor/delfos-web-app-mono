import type { ReactNode } from "react";

/** Eyebrow + h2 + lead paragraph shared by the landing's content sections. */
export function SectionHeading({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  /** Lead paragraph under the title. */
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="text-sm font-medium text-accent">{eyebrow}</span>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-4 text-lg text-muted">{children}</p>
    </div>
  );
}

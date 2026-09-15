import Link from "next/link";

import { LogoMark } from "@/components/icons";

const FOOTER_LINKS = [
  { label: "Comprar", href: "/search?operacion=comprar" },
  { label: "Arrendar", href: "/search?operacion=arrendar" },
  { label: "Vivienda asequible", href: "/search?asequible=si" },
  { label: "Publicar propiedad", href: "/dashboard" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-separator">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 font-display font-semibold text-foreground">
          <LogoMark className="size-5" />
          Delfos
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <p>© {new Date().getFullYear()} Delfos Vivienda S.A.S. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

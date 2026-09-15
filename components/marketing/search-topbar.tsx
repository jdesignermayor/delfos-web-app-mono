import Link from "next/link";
import { buttonVariants } from "@heroui/react";

import { HeartIcon, LogoMark, SearchIcon } from "@/components/icons";

/**
 * Top bar for the search experience: search / favourites tabs on the left,
 * the logo centred, and the account actions on the right.
 */
export function SearchTopbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-separator bg-background/90 backdrop-blur-xl">
      <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6">
        <nav className="flex items-center gap-1">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-secondary px-3 py-1.5 text-sm font-medium text-foreground">
            <SearchIcon className="size-4" />
            <span className="hidden sm:inline">Buscar</span>
          </span>
          <Link
            href="/search?favoritos=1"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
          >
            <HeartIcon className="size-4" />
            <span className="hidden sm:inline">Favoritos</span>
          </Link>
        </nav>

        <Link
          href="/"
          className="flex items-center gap-2 justify-self-center font-display text-lg font-semibold tracking-tight"
        >
          <LogoMark />
          <span>Delfos</span>
        </Link>

        <div className="flex items-center justify-end gap-2">
          <Link
            href="/dashboard"
            className={`hidden sm:inline-flex ${buttonVariants({ variant: "ghost", size: "sm" })}`}
          >
            Ingresar
          </Link>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            Publicar propiedad
          </Link>
        </div>
      </div>
    </header>
  );
}

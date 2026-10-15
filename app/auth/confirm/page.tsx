import type { Metadata } from "next";
import Link from "next/link";

import { ConfirmEmailButton } from "@/components/auth/confirm-email-button";
import { LogoMark } from "@/components/icons";

export const metadata: Metadata = {
  title: "Confirmar correo",
  robots: { index: false, follow: false },
};

/**
 * Landing page of the sign-up confirmation email (`/auth/confirm?token_hash=…&type=signup`).
 * The token isn't checked here: it's single-use, and mail scanners open links before the user
 * does, so it's only exchanged when the button is pressed.
 */
export default async function ConfirmEmailPage({ searchParams }: PageProps<"/auth/confirm">) {
  const { token_hash: tokenHash, type } = await searchParams;
  const isValidLink = typeof tokenHash === "string" && tokenHash.length > 0 && type === "signup";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-semibold tracking-tight">
          <LogoMark />
          <span className="text-lg">Delfos</span>
        </Link>

        <div className="rounded-2xl border border-separator bg-surface p-6 shadow-sm sm:p-8">
          {isValidLink ? (
            <>
              <h1 className="text-xl font-semibold tracking-tight">Confirma tu correo</h1>
              <p className="mt-1 mb-6 text-sm text-muted">
                Activa tu cuenta para ingresar. El enlace solo puede usarse una vez.
              </p>
              <ConfirmEmailButton tokenHash={tokenHash} />
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold tracking-tight">Enlace no válido</h1>
              <p className="mt-2 text-sm text-muted">
                Este enlace está incompleto o ya no es válido. Intenta registrarte de nuevo.
              </p>
              <Link href="/" className="mt-6 inline-block text-sm font-medium text-accent hover:underline">
                Volver al inicio
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

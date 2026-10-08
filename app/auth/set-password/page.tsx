import type { Metadata } from "next";
import Link from "next/link";

import { SetPasswordForm } from "@/components/auth/set-password-form";
import { LogoMark } from "@/components/icons";

export const metadata: Metadata = {
  title: "Crear contraseña",
  robots: { index: false, follow: false },
};

/**
 * Landing page of the emailed password link
 * (`/auth/set-password?token_hash=…&type=recovery`). The token isn't checked
 * here: it's single-use, and mail scanners open links before the user does,
 * so it's only exchanged when the form is submitted.
 */
export default async function SetPasswordPage({ searchParams }: PageProps<"/auth/set-password">) {
  const { token_hash: tokenHash, type } = await searchParams;
  const isValidLink = typeof tokenHash === "string" && tokenHash.length > 0 && type === "recovery";

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
              <h1 className="text-xl font-semibold tracking-tight">Crea tu contraseña</h1>
              <p className="mt-1 mb-6 text-sm text-muted">
                Elige una contraseña segura para ingresar a tu panel. El enlace solo puede usarse una vez.
              </p>
              <SetPasswordForm tokenHash={tokenHash} />
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold tracking-tight">Enlace no válido</h1>
              <p className="mt-2 text-sm text-muted">
                Este enlace está incompleto o ya no es válido. Pide al administrador de Delfos que te envíe uno nuevo.
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

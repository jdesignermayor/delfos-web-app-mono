import type { Metadata } from "next";
import Link from "next/link";

import { SetPasswordForm } from "@/components/auth/set-password-form";
import { LogoMark } from "@/components/icons";

export const metadata: Metadata = {
  title: "Crear contraseña",
  robots: { index: false, follow: false },
};

/**
 * Landing page of the emailed password links: the welcome email
 * (`/auth/set-password?token_hash=…&type=recovery`) and "forgot password"
 * (same, plus `&flow=reset`, which only changes the copy). The token isn't checked
 * here: it's single-use, and mail scanners open links before the user does,
 * so it's only exchanged when the form is submitted.
 */
export default async function SetPasswordPage({ searchParams }: PageProps<"/auth/set-password">) {
  const { token_hash: tokenHash, type, flow } = await searchParams;
  const isValidLink = typeof tokenHash === "string" && tokenHash.length > 0 && type === "recovery";
  const isReset = flow === "reset";

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
              <h1 className="text-xl font-semibold tracking-tight">
                {isReset ? "Restablece tu contraseña" : "Crea tu contraseña"}
              </h1>
              <p className="mt-1 mb-6 text-sm text-muted">
                {isReset
                  ? "Elige una nueva contraseña segura para tu cuenta. El enlace solo puede usarse una vez."
                  : "Elige una contraseña segura para ingresar a tu panel. El enlace solo puede usarse una vez."}
              </p>
              <SetPasswordForm tokenHash={tokenHash} isReset={isReset} />
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold tracking-tight">Enlace no válido</h1>
              <p className="mt-2 text-sm text-muted">
                Este enlace está incompleto o ya no es válido. Solicita uno nuevo con «¿Olvidaste tu contraseña?» al
                iniciar sesión.
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

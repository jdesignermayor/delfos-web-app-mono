import type { Metadata } from "next";

import { AvatarUploader } from "@/components/dashboard/profile/avatar-uploader";
import { PasswordForm } from "@/components/dashboard/profile/password-form";
import { ProfileForm } from "@/components/dashboard/profile/profile-form";
import { requireDashboardUser } from "@/lib/auth/dal";
import { createAdminClient } from "@/supabase/admin";

export const metadata: Metadata = { title: "Mi perfil" };

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Superadministrador",
  admin: "Constructora",
  creator: "Creador",
  viewer: "Lector",
};

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-separator bg-surface p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-0.5 text-sm text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default async function ProfilePage() {
  const user = await requireDashboardUser();
  // Fresh read (not the cached session profile) so the form shows what was just saved.
  const { data: profile } = await createAdminClient()
    .from("users")
    .select("name, phone, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile?.name ?? user.name;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mi perfil</h1>
        <p className="mt-1 text-sm text-muted">
          {user.role ? ROLE_LABELS[user.role] ?? user.role : "Usuario"}
          {user.developer ? ` · ${user.developer.name}` : null}
        </p>
      </div>

      <Section title="Foto de perfil" description="Se muestra en el menú lateral del dashboard.">
        <AvatarUploader avatarUrl={profile?.avatar_url ?? null} name={name} email={user.email} />
      </Section>

      <Section title="Datos personales" description="Actualiza tu nombre y teléfono de contacto.">
        <ProfileForm initialValues={{ name: name ?? "", phone: profile?.phone ?? "" }} email={user.email} />
      </Section>

      <Section title="Seguridad" description="Cambia tu contraseña. Se cerrarán tus otras sesiones abiertas.">
        <PasswordForm />
      </Section>
    </div>
  );
}

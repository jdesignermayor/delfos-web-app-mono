import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";

import { BRAND_COLOR, SITE_NAME } from "@/lib/site";

export type AdminWelcomeEmailProps = {
  name: string;
  email: string;
  developerName: string | null;
  /** One-time link to `/auth/set-password` with the Supabase token. */
  setPasswordUrl: string;
  expiresInHours: number;
};

const font =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Sent when a superadmin creates a constructora (role `admin`) user. */
export function AdminWelcomeEmail({
  name,
  email,
  developerName,
  setPasswordUrl,
  expiresInHours,
}: AdminWelcomeEmailProps) {
  const firstName = name.split(/\s+/)[0] || name;
  const expiry = expiresInHours === 1 ? "1 hora" : `${expiresInHours} horas`;

  return (
    <Html lang="es">
      <Head />
      <Preview>Tu cuenta de {SITE_NAME} está lista. Crea tu contraseña para ingresar.</Preview>
      <Body style={{ backgroundColor: "#f4f5f7", fontFamily: font, margin: 0, padding: "32px 0" }}>
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 16,
            maxWidth: 520,
            margin: "0 auto",
            padding: "40px 36px",
            border: "1px solid #e6e8eb",
          }}
        >
          <Text style={{ color: BRAND_COLOR, fontSize: 20, fontWeight: 700, margin: 0 }}>{SITE_NAME}</Text>

          <Heading as="h1" style={{ color: "#111827", fontSize: 24, lineHeight: "32px", margin: "28px 0 12px" }}>
            Hola {firstName}, ¡bienvenido!
          </Heading>
          <Text style={{ color: "#374151", fontSize: 15, lineHeight: "24px", margin: "0 0 12px" }}>
            Creamos tu cuenta en el panel de {SITE_NAME}
            {developerName ? (
              <>
                {" "}para <strong>{developerName}</strong>
              </>
            ) : null}
            . Desde allí podrás gestionar tus proyectos, propiedades y fiducias.
          </Text>
          <Text style={{ color: "#374151", fontSize: 15, lineHeight: "24px", margin: "0 0 24px" }}>
            Para empezar, crea tu propia contraseña:
          </Text>

          <Section style={{ textAlign: "center" }}>
            <Button
              href={setPasswordUrl}
              style={{
                backgroundColor: BRAND_COLOR,
                borderRadius: 12,
                color: "#ffffff",
                display: "inline-block",
                fontSize: 15,
                fontWeight: 600,
                padding: "14px 28px",
                textDecoration: "none",
              }}
            >
              Crear mi contraseña
            </Button>
          </Section>

          <Text style={{ color: "#6b7280", fontSize: 13, lineHeight: "20px", margin: "24px 0 0", textAlign: "center" }}>
            El enlace vence en {expiry} y solo puede usarse una vez.
          </Text>

          <Section
            style={{ backgroundColor: "#f4f5f7", borderRadius: 12, margin: "28px 0 0", padding: "14px 18px" }}
          >
            <Text style={{ color: "#6b7280", fontSize: 12, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>
              Tu usuario
            </Text>
            <Text style={{ color: "#111827", fontSize: 15, fontWeight: 600, margin: "4px 0 0" }}>{email}</Text>
          </Section>

          <Hr style={{ borderColor: "#e6e8eb", margin: "28px 0" }} />

          <Text style={{ color: "#9ca3af", fontSize: 12, lineHeight: "18px", margin: 0 }}>
            Si el botón no funciona, copia y pega este enlace en tu navegador:
            <br />
            <Link href={setPasswordUrl} style={{ color: BRAND_COLOR, wordBreak: "break-all" }}>
              {setPasswordUrl}
            </Link>
          </Text>
          <Text style={{ color: "#9ca3af", fontSize: 12, lineHeight: "18px", margin: "12px 0 0" }}>
            Si el enlace venció, pide al administrador de {SITE_NAME} que te envíe uno nuevo. Si no esperabas este
            correo, puedes ignorarlo.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

AdminWelcomeEmail.PreviewProps = {
  name: "Ana María Restrepo",
  email: "ana@constructora.co",
  developerName: "Constructora Demo",
  setPasswordUrl: "http://localhost:3000/auth/set-password?token_hash=demo&type=recovery",
  expiresInHours: 24,
} satisfies AdminWelcomeEmailProps;

export default AdminWelcomeEmail;

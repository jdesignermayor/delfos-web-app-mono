import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "react-email";

import { BRAND_COLOR, SITE_NAME } from "@/lib/site";

export type PasswordResetEmailProps = {
  name: string;
  /** One-time link to `/auth/set-password` with the Supabase recovery token. */
  resetUrl: string;
  expiresInHours: number;
};

const font =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Sent when someone asks to reset the password of an existing account. */
export function PasswordResetEmail({ name, resetUrl, expiresInHours }: PasswordResetEmailProps) {
  const firstName = name.split(/\s+/)[0] || name;
  const expiry = expiresInHours === 1 ? "1 hora" : `${expiresInHours} horas`;

  return (
    <Html lang="es">
      <Head />
      <Preview>Restablece tu contraseña de {SITE_NAME}.</Preview>
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
            Hola {firstName}, restablece tu contraseña
          </Heading>
          <Text style={{ color: "#374151", fontSize: 15, lineHeight: "24px", margin: "0 0 24px" }}>
            Recibimos una solicitud para cambiar la contraseña de tu cuenta en {SITE_NAME}. Usa el botón para crear una
            nueva:
          </Text>

          <Section style={{ textAlign: "center" }}>
            <Button
              href={resetUrl}
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
              Restablecer contraseña
            </Button>
          </Section>

          <Text style={{ color: "#6b7280", fontSize: 13, lineHeight: "20px", margin: "24px 0 0", textAlign: "center" }}>
            El enlace vence en {expiry} y solo puede usarse una vez.
          </Text>

          <Hr style={{ borderColor: "#e6e8eb", margin: "28px 0" }} />

          <Text style={{ color: "#9ca3af", fontSize: 12, lineHeight: "18px", margin: 0 }}>
            Si el botón no funciona, copia y pega este enlace en tu navegador:
            <br />
            <Link href={resetUrl} style={{ color: BRAND_COLOR, wordBreak: "break-all" }}>
              {resetUrl}
            </Link>
          </Text>
          <Text style={{ color: "#9ca3af", fontSize: 12, lineHeight: "18px", margin: "12px 0 0" }}>
            Si no pediste este cambio, puedes ignorar este correo: tu contraseña actual seguirá funcionando.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

PasswordResetEmail.PreviewProps = {
  name: "Ana María Restrepo",
  resetUrl: "http://localhost:3000/auth/set-password?token_hash=demo&type=recovery&flow=reset",
  expiresInHours: 24,
} satisfies PasswordResetEmailProps;

export default PasswordResetEmail;

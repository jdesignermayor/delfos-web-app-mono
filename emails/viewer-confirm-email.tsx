import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "react-email";

import { BRAND_COLOR, SITE_NAME } from "@/lib/site";

export type ViewerConfirmEmailProps = {
  name: string;
  /** One-time link to `/auth/confirm` with the Supabase token. */
  confirmUrl: string;
  expiresInHours: number;
};

const font =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Sent when a visitor signs up: they confirm their email to activate the account. */
export function ViewerConfirmEmail({ name, confirmUrl, expiresInHours }: ViewerConfirmEmailProps) {
  const firstName = name.split(/\s+/)[0] || name;
  const expiry = expiresInHours === 1 ? "1 hora" : `${expiresInHours} horas`;

  return (
    <Html lang="es">
      <Head />
      <Preview>Confirma tu correo para activar tu cuenta de {SITE_NAME}.</Preview>
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
            Hola {firstName}, confirma tu correo
          </Heading>
          <Text style={{ color: "#374151", fontSize: 15, lineHeight: "24px", margin: "0 0 24px" }}>
            Gracias por registrarte en {SITE_NAME}. Para activar tu cuenta, confirma que este correo es tuyo:
          </Text>

          <Section style={{ textAlign: "center" }}>
            <Button
              href={confirmUrl}
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
              Confirmar mi correo
            </Button>
          </Section>

          <Text style={{ color: "#6b7280", fontSize: 13, lineHeight: "20px", margin: "24px 0 0", textAlign: "center" }}>
            El enlace vence en {expiry} y solo puede usarse una vez.
          </Text>

          <Hr style={{ borderColor: "#e6e8eb", margin: "28px 0" }} />

          <Text style={{ color: "#9ca3af", fontSize: 12, lineHeight: "18px", margin: 0 }}>
            Si el botón no funciona, copia y pega este enlace en tu navegador:
            <br />
            <Link href={confirmUrl} style={{ color: BRAND_COLOR, wordBreak: "break-all" }}>
              {confirmUrl}
            </Link>
          </Text>
          <Text style={{ color: "#9ca3af", fontSize: 12, lineHeight: "18px", margin: "12px 0 0" }}>
            Si no creaste una cuenta en {SITE_NAME}, puedes ignorar este correo.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

ViewerConfirmEmail.PreviewProps = {
  name: "Ana María Restrepo",
  confirmUrl: "http://localhost:3000/auth/confirm?token_hash=demo&type=signup",
  expiresInHours: 24,
} satisfies ViewerConfirmEmailProps;

export default ViewerConfirmEmail;

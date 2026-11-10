import { AgentCta } from "@/components/property-detail/agent-cta";

/**
 * wa.me wants international digits only. Colombian numbers are stored as the
 * 10-digit national number ("3160235920"), so they get the 57 country code.
 */
function toWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `57${digits}` : digits;
}

/**
 * Opens a WhatsApp chat (WhatsApp Web on desktop, the app on phones) with the
 * sales room (sala de ventas), pre-filled with the listing's name. Renders nothing when the
 * listing has no contact phone. On phones it also floats until the reader reaches it (`AgentCta`).
 */
export function TalkToAgentButton({ propertyTitle, phone }: { propertyTitle: string; phone?: string }) {
  const number = phone ? toWhatsAppNumber(phone) : "";
  if (!number) return null;

  const message = encodeURIComponent(`Hola, quiero más información sobre "${propertyTitle}".`);
  return <AgentCta href={`https://wa.me/${number}?text=${message}`} />;
}

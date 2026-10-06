import { MessageCircleIcon } from "@/components/icons";

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
 * constructora, pre-filled with the listing's name. Renders nothing when the
 * listing has no contact phone.
 */
export function TalkToAgentButton({ propertyTitle, phone }: { propertyTitle: string; phone?: string }) {
  const number = phone ? toWhatsAppNumber(phone) : "";
  if (!number) return null;

  const message = encodeURIComponent(`Hola, quiero más información sobre "${propertyTitle}".`);
  const href = `https://wa.me/${number}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover"
    >
      <MessageCircleIcon className="size-4" />
      Hablar con un agente
    </a>
  );
}

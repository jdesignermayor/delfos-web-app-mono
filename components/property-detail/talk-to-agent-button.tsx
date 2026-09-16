import { MessageCircleIcon } from "@/components/icons";

// TODO: replace with the real sales WhatsApp number (E.164 digits, no symbols).
const AGENT_WHATSAPP_NUMBER = "573000000000";

/** Opens a WhatsApp chat with an agent, pre-filled with the listing's name. */
export function TalkToAgentButton({ propertyTitle }: { propertyTitle: string }) {
  const message = encodeURIComponent(`Hola, quiero más información sobre "${propertyTitle}".`);
  const href = `https://wa.me/${AGENT_WHATSAPP_NUMBER}?text=${message}`;

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

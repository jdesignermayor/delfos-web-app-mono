/** "maria@correo.com" → "m***a@correo.com"; very short values are returned as-is. */
export function maskEmail(email: string): string {
  if (!email || email.length < 5) return email;
  const [localPart, domain] = email.split("@");
  const first = localPart.charAt(0);
  const last = localPart.length > 1 ? localPart.charAt(localPart.length - 1) : "";
  const hidden = "*".repeat(Math.max(0, localPart.length - 2));
  return `${first}${hidden}${last}@${domain}`;
}

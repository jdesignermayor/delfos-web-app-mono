/**
 * Browser-only hints about the visitor's session, kept in localStorage.
 * Every helper is safe to call during SSR (it just reports "nothing stored").
 */

const AUTH_TOKEN_KEY = "auth_token";
const LAST_EMAIL_KEY = "last_email";

const hasStorage = () => typeof window !== "undefined";

export function hasClientSession(): boolean {
  return hasStorage() && Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
}

/** The email last used to sign in or register on this device, to suggest it next time. */
export function getLastEmail(): string | null {
  return hasStorage() ? localStorage.getItem(LAST_EMAIL_KEY) : null;
}

export function rememberLastEmail(email: string): void {
  if (hasStorage()) localStorage.setItem(LAST_EMAIL_KEY, email);
}

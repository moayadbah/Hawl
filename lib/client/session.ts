// localStorage-backed session — intentionally a mock auth layer (no cookies, no
// password, a spoofable userId) matching this app's honest prototype framing.
// Guests get a session here too (their own `userId`), just with isGuest: true.

export interface Session {
  userId: string;
  phone: string | null;
  displayName: string | null;
  email: string | null;
  isGuest: boolean;
}

const KEY = "hawl_session";

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

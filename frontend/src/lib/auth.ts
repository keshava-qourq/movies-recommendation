import { apiFetch, clearSessionToken, type AuthUser } from "@/lib/api";

// Minimal in-memory auth state: the signed-in user, kept after login or signup.
let currentUser: AuthUser | null = null;
let notice: string | null = null;

export const SESSION_EXPIRED_NOTICE = "Your session has expired. Log in again.";

export function getUser(): AuthUser | null {
  return currentUser;
}

export function setUser(user: AuthUser | null): void {
  currentUser = user;
}

// A message the login screen shows once (for example after a session expires).
export function getNotice(): string | null {
  return notice;
}

export function setNotice(value: string | null): void {
  notice = value;
}

// Ends the session locally whatever the server says, so a failed call cannot leave the user in.
export async function logout(): Promise<void> {
  try {
    await apiFetch<void>("/auth/logout", { method: "POST" });
  } catch {
    // The token is dropped below regardless.
  }
  clearSessionToken();
  setUser(null);
  setNotice(null);
}

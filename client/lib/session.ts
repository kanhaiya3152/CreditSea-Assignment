import type { User } from '@/types';

const TOKEN_KEY = 'lms_token';
const USER_KEY = 'lms_user';

export interface Session {
  token: string;
  user: User;
}

/**
 * The signed-in session lives in localStorage rather than a cookie. The client and
 * the API are on separate domains, so a cookie between them is a third-party cookie -
 * dropped by default in incognito and increasingly in normal browsing, which left
 * users "logged in" with no credential actually being sent.
 *
 * Every accessor is defensive: localStorage throws in some privacy modes, and it
 * is simply absent during server rendering.
 */
export function readSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const token = window.localStorage.getItem(TOKEN_KEY);
    const rawUser = window.localStorage.getItem(USER_KEY);
    if (!token || !rawUser) return null;
    return { token, user: JSON.parse(rawUser) as User };
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeSession(session: Session): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, session.token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  } catch {
    // A session that can't be persisted still works for this tab - it just won't survive a reload.
  }
}

export function writeUser(user: User): void {
  try {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // See writeSession.
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    // Nothing persisted means nothing to clear.
  }
}

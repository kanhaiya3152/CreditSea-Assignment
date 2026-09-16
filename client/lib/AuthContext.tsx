'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, ApiClientError } from './api';
import { clearSession, readSession, writeSession, writeUser } from './session';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restoring the session is a synchronous localStorage read, so a returning user is
  // signed in on the first tick after hydration rather than after a /auth/me round
  // trip. The token is still verified against the server immediately afterwards, but
  // that happens in the background and never blocks the first render.
  useEffect(() => {
    const stored = readSession();
    if (!stored) {
      setLoading(false);
      return;
    }

    setUser(stored.user);
    setLoading(false);

    api
      .get<{ user: User }>('/auth/me')
      .then((data) => {
        setUser(data.user);
        writeUser(data.user);
      })
      .catch((err) => {
        // Only a definitive rejection clears the session. A network blip or a cold-starting
        // server must not sign out someone holding a perfectly valid token.
        if (err instanceof ApiClientError && err.status === 401) {
          clearSession();
          setUser(null);
        }
      });
  }, []);

  const signIn = useCallback((token: string, nextUser: User) => {
    writeSession({ token, user: nextUser });
    setUser(nextUser);
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    // The token is stateless, so signing out is purely local - no server round trip.
    clearSession();
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, signIn, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

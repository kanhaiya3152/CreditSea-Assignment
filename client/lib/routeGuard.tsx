'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { Role } from '@/types';
import { useAuth } from './AuthContext';

export const ROLE_HOME: Record<Role, string> = {
  ADMIN: '/dashboard/sales',
  SALES: '/dashboard/sales',
  SANCTION: '/dashboard/sanction',
  DISBURSEMENT: '/dashboard/disbursement',
  COLLECTION: '/dashboard/collection',
  BORROWER: '/my-loan',
};

/**
 * Client-side route guard. Frontend and backend live on different domains
 * in production, so the auth cookie set by the backend is host-only and
 * never visible to Next.js edge middleware running on the frontend's own
 * domain - route protection has to happen here, after the app has loaded
 * and asked the backend (via /auth/me) who's signed in.
 */
export function RequireRole({ roles, children }: { roles: Role[]; children: React.ReactNode }): JSX.Element | null {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const authorized = !!user && roles.includes(user.role);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!authorized) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [loading, user, authorized, pathname, router]);

  if (loading || !authorized) return null;
  return <>{children}</>;
}

export function GuestOnly({ children }: { children: React.ReactNode }): JSX.Element | null {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [loading, user, router]);

  if (loading || user) return null;
  return <>{children}</>;
}

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingState } from '@/components/ui/States';
import type { Role } from '@/types';
import { useAuth } from './AuthContext';

/** Where each role lands when it has no more specific destination. Single source of truth. */
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: '/dashboard/sales',
  SALES: '/dashboard/sales',
  SANCTION: '/dashboard/sanction',
  DISBURSEMENT: '/dashboard/disbursement',
  COLLECTION: '/dashboard/collection',
  BORROWER: '/my-loan',
};

function FullScreenLoader({ label }: { label: string }): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <LoadingState label={label} />
    </div>
  );
}

/**
 * The only route guard in the app. It runs in the browser rather than in Next.js
 * middleware because the session lives in localStorage, which edge middleware cannot
 * read - and because the API is on a different domain, so no cookie reaches the
 * frontend's own server either. Every API route re-checks the token server-side
 * regardless, so this is a navigation convenience, not the security boundary.
 */
export function RequireRole({ roles, children }: { roles: Role[]; children: React.ReactNode }): JSX.Element {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // ADMIN is an ops superuser: it can open any ops module, but borrower-only routes
  // still require an actual BORROWER, since they render that user's own loan.
  const authorized = !!user && (roles.includes(user.role) || (user.role === 'ADMIN' && !roles.includes('BORROWER')));

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

  if (loading || !authorized) return <FullScreenLoader label="Loading..." />;
  return <>{children}</>;
}

/** Sends an already-signed-in user away from /login and /signup. */
export function GuestOnly({ children }: { children: React.ReactNode }): JSX.Element {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [loading, user, router]);

  if (loading || user) return <FullScreenLoader label="Loading..." />;
  return <>{children}</>;
}

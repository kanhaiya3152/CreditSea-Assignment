'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ROLE_HOME } from '@/lib/routeGuard';
import type { Role } from '@/types';

const MODULE_ROLE: Record<string, Role> = {
  sales: 'SALES',
  sanction: 'SANCTION',
  disbursement: 'DISBURSEMENT',
  collection: 'COLLECTION',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }): JSX.Element | null {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const requiredRole = MODULE_ROLE[pathname.split('/')[2] ?? ''];
  const authorized = !!user && !!requiredRole && (user.role === 'ADMIN' || user.role === requiredRole);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      return;
    }
    // No module segment (bare /dashboard) or a module the user can't access - send them home.
    if (!authorized) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [loading, user, authorized, pathname, router]);

  if (loading || !authorized) return null;
  return <>{children}</>;
}

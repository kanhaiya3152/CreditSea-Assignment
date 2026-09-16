'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import type { Role } from '@/types';
import { useAuth } from '@/lib/AuthContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { LoadingState } from '@/components/ui/States';

const ROLE_HOME: Record<Role, string> = {
  ADMIN: '/dashboard/sales',
  SALES: '/dashboard/sales',
  SANCTION: '/dashboard/sanction',
  DISBURSEMENT: '/dashboard/disbursement',
  COLLECTION: '/dashboard/collection',
  BORROWER: '/my-loan',
};

export function DashboardShell({
  requiredRole,
  title,
  children,
}: {
  requiredRole: Role;
  title: string;
  children: ReactNode;
}): JSX.Element {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'ADMIN' && user.role !== requiredRole) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [loading, user, requiredRole, router]);

  if (loading || !user || (user.role !== 'ADMIN' && user.role !== requiredRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <LoadingState label="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar role={user.role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

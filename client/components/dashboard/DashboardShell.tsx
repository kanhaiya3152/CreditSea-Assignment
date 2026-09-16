'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Role } from '@/types';
import { useAuth } from '@/lib/AuthContext';
import { RequireRole } from '@/lib/routeGuard';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

function DashboardChrome({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar role={user!.role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export function DashboardShell({
  requiredRole,
  title,
  children,
}: {
  requiredRole: Role;
  title: string;
  children: ReactNode;
}): JSX.Element {
  // RequireRole renders nothing but a loader until the user is known and authorized,
  // so DashboardChrome can read `user` without re-checking it.
  return (
    <RequireRole roles={[requiredRole]}>
      <DashboardChrome title={title}>{children}</DashboardChrome>
    </RequireRole>
  );
}

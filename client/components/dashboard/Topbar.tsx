'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/Button';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  SALES: 'Sales Executive',
  SANCTION: 'Sanction Executive',
  DISBURSEMENT: 'Disbursement Executive',
  COLLECTION: 'Collection Executive',
};

export function Topbar({ title, onMenuClick }: { title: string; onMenuClick: () => void }): JSX.Element {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <header className="flex h-14 items-center justify-between gap-2 border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="shrink-0 rounded p-1.5 text-muted hover:bg-bg hover:text-ink lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="truncate text-section text-ink">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        {user && (
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight text-ink">{user.fullName}</p>
            <p className="text-caption leading-tight text-muted">{ROLE_LABELS[user.role] ?? user.role}</p>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>
    </header>
  );
}

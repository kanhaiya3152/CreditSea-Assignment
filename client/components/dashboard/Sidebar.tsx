'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Banknote, CircleDollarSign, ClipboardCheck, Users, X } from 'lucide-react';
import type { Role } from '@/types';
import { cn } from '@/lib/utils';

interface ModuleDef {
  key: string;
  href: string;
  label: string;
  icon: typeof Users;
  role: Role;
}

const MODULES: ModuleDef[] = [
  { key: 'sales', href: '/dashboard/sales', label: 'Sales', icon: Users, role: 'SALES' },
  { key: 'sanction', href: '/dashboard/sanction', label: 'Sanction', icon: ClipboardCheck, role: 'SANCTION' },
  { key: 'disbursement', href: '/dashboard/disbursement', label: 'Disbursement', icon: Banknote, role: 'DISBURSEMENT' },
  { key: 'collection', href: '/dashboard/collection', label: 'Collection', icon: CircleDollarSign, role: 'COLLECTION' },
];

export function Sidebar({
  role,
  open,
  onClose,
}: {
  role: Role;
  open: boolean;
  onClose: () => void;
}): JSX.Element {
  const pathname = usePathname();
  const visibleModules = role === 'ADMIN' ? MODULES : MODULES.filter((m) => m.role === role);

  return (
    <>
      {/* Mobile-only backdrop - clicking it closes the drawer */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200',
          'lg:static lg:z-auto lg:w-56 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-border px-5">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-brand" />
            <span className="text-sm font-semibold text-ink">LMS Ops</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded p-1 text-muted hover:bg-bg hover:text-ink lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {visibleModules.map((mod) => {
            const active = pathname.startsWith(mod.href);
            const Icon = mod.icon;
            return (
              <Link
                key={mod.key}
                href={mod.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-brand-light text-brand' : 'text-muted hover:bg-bg hover:text-ink',
                )}
              >
                <Icon className="h-4 w-4" />
                {mod.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

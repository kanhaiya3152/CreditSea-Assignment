'use client';

import { ApplyProvider } from '@/lib/ApplyContext';
import { RequireRole } from '@/lib/routeGuard';

export default function BorrowerLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <RequireRole roles={['BORROWER']}>
      <ApplyProvider>{children}</ApplyProvider>
    </RequireRole>
  );
}

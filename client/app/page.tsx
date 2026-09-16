'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Role } from '@/types';
import { useAuth } from '@/lib/AuthContext';
import { LoadingState } from '@/components/ui/States';

const ROLE_HOME: Record<Role, string> = {
  ADMIN: '/dashboard/sales',
  SALES: '/dashboard/sales',
  SANCTION: '/dashboard/sanction',
  DISBURSEMENT: '/dashboard/disbursement',
  COLLECTION: '/dashboard/collection',
  BORROWER: '/my-loan',
};

export default function HomePage(): JSX.Element {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? ROLE_HOME[user.role] : '/login');
  }, [loading, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <LoadingState label="Loading..." />
    </div>
  );
}

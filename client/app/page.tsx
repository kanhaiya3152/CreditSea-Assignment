'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { ROLE_HOME } from '@/lib/routeGuard';
import { LoadingState } from '@/components/ui/States';

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

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, PlusCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';
import { LoanStatusCard } from '@/components/borrower/LoanStatusCard';
import { Button } from '@/components/ui/Button';
import type { LoanApplication } from '@/types';

export default function MyLoanPage(): JSX.Element {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [applications, setApplications] = useState<LoanApplication[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A borrower can only have one loan in flight at a time - REJECTED/CLOSED are the
  // only terminal statuses, matching the server-side guard in submitApplication.
  const hasActiveApplication = applications?.some((a) => a.status !== 'REJECTED' && a.status !== 'CLOSED') ?? false;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    api
      .get<{ applications: LoanApplication[] }>('/applications/me')
      .then((data) => setApplications(data.applications))
      .catch(() => setError('Could not load your loan applications. Please refresh the page.'));
  }, [authLoading, user, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-bg">
      <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-brand" />
          <span className="text-sm font-semibold text-ink">LMS</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {user && <span className="hidden truncate text-sm text-muted sm:block">{user.fullName}</span>}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-page-title text-ink">My loan</h1>
          {applications && applications.length > 0 && !hasActiveApplication && (
            <Link href="/apply/personal-details">
              <Button variant="secondary" size="sm">
                <PlusCircle className="h-4 w-4" />
                New application
              </Button>
            </Link>
          )}
        </div>

        {error && <ErrorState message={error} />}

        {!error && applications === null && <LoadingState label="Loading your applications..." />}

        {!error && applications !== null && applications.length === 0 && (
          <div className="rounded-lg border border-border bg-surface p-10 shadow-panel">
            <EmptyState
              title="You haven't applied for a loan yet"
              description="Complete a short 4-step application to check your eligibility and get an instant repayment estimate."
            />
            <div className="mt-4 flex justify-center">
              <Link href="/apply/personal-details">
                <Button>Start application</Button>
              </Link>
            </div>
          </div>
        )}

        {!error && applications && applications.length > 0 && (
          <div className="flex flex-col gap-4">
            {applications.map((app) => (
              <LoanStatusCard key={app._id} application={app} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

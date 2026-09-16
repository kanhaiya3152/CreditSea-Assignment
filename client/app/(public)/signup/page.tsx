'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { GuestOnly } from '@/lib/routeGuard';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import type { User } from '@/types';

function SignupForm(): JSX.Element {
  const router = useRouter();
  const { refresh } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post<{ user: User }>('/auth/signup', { fullName, email, password });
      await refresh();
      // Land on the borrower's home, not straight into the wizard - starting an
      // application is something they choose to do, not something signup forces.
      router.push('/my-loan');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="h-7 w-7 rounded-md bg-brand" />
          <span className="text-sm font-semibold text-ink">LMS</span>
        </div>
        <div className="rounded-lg border border-border bg-surface p-8 shadow-panel">
          <h1 className="text-page-title text-ink">Create your account</h1>
          <p className="mt-1 text-body text-muted">Sign up to check your loan eligibility whenever you&apos;re ready.</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <Field label="Full name">
              <Input
                required
                autoFocus
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="As per your PAN card"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password" hint="At least 8 characters.">
              <Input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>

            {error && <p className="text-caption text-[#B91C1C]">{error}</p>}

            <Button type="submit" loading={loading} className="mt-2 w-full">
              Create account
            </Button>
          </form>
        </div>
        <p className="mt-4 text-center text-caption text-muted">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function SignupPage(): JSX.Element {
  return (
    <GuestOnly>
      <SignupForm />
    </GuestOnly>
  );
}

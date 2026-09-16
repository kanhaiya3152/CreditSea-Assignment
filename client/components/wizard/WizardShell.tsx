import type { ReactNode } from 'react';
import { WizardProgress } from './WizardProgress';

export function WizardShell({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <main className="flex min-h-screen justify-center bg-bg px-4 py-10 sm:py-16">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-brand" />
          <span className="text-sm font-semibold text-ink">LMS</span>
        </div>
        <div className="mb-8">
          <WizardProgress currentStep={step} />
        </div>
        <div className="rounded-lg border border-border bg-surface p-6 shadow-panel sm:p-8">
          <h1 className="text-page-title text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-body text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}

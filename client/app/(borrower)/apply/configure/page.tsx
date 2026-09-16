'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { WizardShell } from '@/components/wizard/WizardShell';
import { Slider } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';
import { useApply } from '@/lib/ApplyContext';
import { api, ApiClientError } from '@/lib/api';
import { formatINR } from '@/lib/format';
import { computeLoanFigures } from '@/lib/loanMath';
import { INTEREST_RATE_PCT, LOAN_MAX_PRINCIPAL, LOAN_MAX_TENURE_DAYS, LOAN_MIN_PRINCIPAL, LOAN_MIN_TENURE_DAYS } from '@/lib/constants';
import type { LoanApplication } from '@/types';

export default function ConfigurePage(): JSX.Element {
  const router = useRouter();
  const { personalDetails, breResult, salarySlip, principal, setPrincipal, tenureDays, setTenureDays, reset } =
    useApply();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Submitting clears the wizard context (breResult/salarySlip), which would otherwise
  // re-trigger this guard and bounce the user back mid-navigation to /my-loan.
  const submittedRef = useRef(false);

  useEffect(() => {
    if (submittedRef.current) return;
    if (!breResult?.passed) {
      router.replace('/apply/personal-details');
      return;
    }
    if (!salarySlip) {
      router.replace('/apply/upload');
    }
  }, [breResult, salarySlip, router]);

  const figures = computeLoanFigures(principal, tenureDays);

  const handleApply = async () => {
    if (!salarySlip) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.post<{ application: LoanApplication }>('/applications', {
        personalDetails: {
          fullName: personalDetails.fullName,
          pan: personalDetails.pan,
          dateOfBirth: personalDetails.dateOfBirth,
          monthlySalary: Number(personalDetails.monthlySalary),
          employmentMode: personalDetails.employmentMode,
        },
        salarySlip,
        loanConfig: { principal, tenureDays },
      });
      submittedRef.current = true;
      reset();
      router.push(`/my-loan?applied=${data.application._id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <WizardShell step={4} title="Configure your loan" subtitle="Adjust the amount and tenure. Your repayment updates instantly.">
      <div className="flex flex-col gap-8">
        <Slider
          label="Loan amount"
          min={LOAN_MIN_PRINCIPAL}
          max={LOAN_MAX_PRINCIPAL}
          step={5000}
          value={principal}
          onChange={setPrincipal}
          formatValue={formatINR}
        />
        <Slider
          label="Tenure"
          min={LOAN_MIN_TENURE_DAYS}
          max={LOAN_MAX_TENURE_DAYS}
          step={5}
          value={tenureDays}
          onChange={setTenureDays}
          formatValue={(v) => `${v} days`}
        />

        <div className="rounded-lg border border-border bg-bg p-5">
          <p className="text-caption font-medium uppercase tracking-wide text-muted">Repayment summary</p>
          <dl className="mt-3 grid grid-cols-2 gap-y-3 text-body">
            <dt className="text-muted">Principal</dt>
            <dd className="text-right tabular-nums text-ink">{formatINR(principal)}</dd>
            <dt className="text-muted">Tenure</dt>
            <dd className="text-right tabular-nums text-ink">{tenureDays} days</dd>
            <dt className="text-muted">Interest rate</dt>
            <dd className="text-right tabular-nums text-ink">{INTEREST_RATE_PCT}% p.a.</dd>
            <dt className="text-muted">Simple interest</dt>
            <dd className="text-right tabular-nums text-ink">{formatINR(figures.simpleInterest)}</dd>
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3">
            <span className="text-section text-ink">Total repayment</span>
            <span className="text-page-title tabular-nums text-brand">{formatINR(figures.totalRepayment)}</span>
          </div>
        </div>

        {error && <p className="text-caption text-[#B91C1C]">{error}</p>}

        <Button onClick={handleApply} loading={loading} className="w-full">
          Apply for this loan
        </Button>
      </div>
    </WizardShell>
  );
}

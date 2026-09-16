'use client';

import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import type { LoanApplication, Payment } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate, formatINR } from '@/lib/format';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const HAPPY_PATH = [
  { key: 'APPLIED', label: 'Applied' },
  { key: 'SANCTIONED', label: 'Sanctioned' },
  { key: 'DISBURSED', label: 'Disbursed' },
  { key: 'CLOSED', label: 'Closed' },
] as const;

function StageTracker({ status }: { status: LoanApplication['status'] }): JSX.Element {
  if (status === 'REJECTED') {
    return (
      <div className="flex items-center gap-2 text-sm text-[#B91C1C]">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FEE2E2]">
          <X className="h-3.5 w-3.5" />
        </div>
        Application rejected
      </div>
    );
  }

  const currentIndex = HAPPY_PATH.findIndex((s) => s.key === status);

  return (
    <ol className="flex items-center">
      {HAPPY_PATH.map((stage, i) => {
        const done = i <= currentIndex;
        return (
          <li key={stage.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-caption font-semibold',
                  done ? 'bg-brand text-white' : 'border border-border text-muted',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={cn('whitespace-nowrap text-caption', done ? 'text-ink' : 'text-muted')}>
                {stage.label}
              </span>
            </div>
            {i !== HAPPY_PATH.length - 1 && (
              <div className={cn('mx-2 mb-5 h-px flex-1', i < currentIndex ? 'bg-brand' : 'bg-border')} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function LoanStatusCard({ application }: { application: LoanApplication }): JSX.Element {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [outstanding, setOutstanding] = useState<number | null>(null);

  useEffect(() => {
    if (application.status !== 'DISBURSED' && application.status !== 'CLOSED') return;
    api
      .get<{ payments: Payment[]; paidTotal: number; outstandingBalance: number }>(
        `/applications/${application._id}/payments`,
      )
      .then((data) => {
        setPayments(data.payments);
        setOutstanding(data.outstandingBalance);
      })
      .catch(() => {
        setPayments([]);
      });
  }, [application._id, application.status]);

  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-panel sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-caption text-muted">Applied on {formatDate(application.appliedAt)}</p>
          <p className="mt-0.5 text-section text-ink">{formatINR(application.loanConfig.principal)} loan</p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="mt-6">
        <StageTracker status={application.status} />
      </div>

      {application.status === 'REJECTED' && application.rejectionReason && (
        <div className="mt-5 rounded-md border border-[#F3B9B9] bg-[#FEE2E2] p-4">
          <p className="text-sm font-medium text-[#B91C1C]">Reason for rejection</p>
          <p className="mt-1 text-caption text-[#7F1D1D]">{application.rejectionReason}</p>
        </div>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 text-body sm:grid-cols-4">
        <dt className="text-muted">Tenure</dt>
        <dd className="tabular-nums text-ink sm:text-right">{application.loanConfig.tenureDays} days</dd>
        <dt className="text-muted">Interest</dt>
        <dd className="tabular-nums text-ink sm:text-right">{formatINR(application.loanConfig.simpleInterest)}</dd>
        <dt className="text-muted">Total repayment</dt>
        <dd className="tabular-nums text-ink sm:text-right">{formatINR(application.loanConfig.totalRepayment)}</dd>
        <dt className="text-muted">Outstanding</dt>
        <dd className="tabular-nums text-ink sm:text-right">
          {outstanding !== null ? formatINR(outstanding) : '—'}
        </dd>
      </dl>

      {payments && payments.length > 0 && (
        <div className="mt-6 border-t border-border pt-4">
          <p className="text-sm font-medium text-ink">Payment history</p>
          <div className="mt-2 overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="bg-bg text-caption text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">UTR</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} className="border-t border-border">
                    <td className="px-3 py-2 tabular-nums text-ink">{p.utrNumber}</td>
                    <td className="px-3 py-2 tabular-nums text-ink">{formatDate(p.paymentDate)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-ink">{formatINR(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

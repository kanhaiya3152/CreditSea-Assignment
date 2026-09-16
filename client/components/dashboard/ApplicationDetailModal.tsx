import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate, formatINR } from '@/lib/format';
import { BRE_RULE_MESSAGES } from '@/lib/constants';
import type { LoanApplication } from '@/types';

function DetailRow({ label, value }: { label: string; value: ReactNode }): JSX.Element {
  return (
    <div className="flex items-center justify-between py-1.5 text-body">
      <span className="text-muted">{label}</span>
      <span className="tabular-nums text-ink">{value}</span>
    </div>
  );
}

export function ApplicationDetailModal({
  application,
  onClose,
  footer,
}: {
  application: LoanApplication;
  onClose: () => void;
  footer?: ReactNode;
}): JSX.Element {
  const borrowerName =
    typeof application.borrower === 'object' ? application.borrower.fullName : application.personalDetails.fullName;

  return (
    <Modal open onClose={onClose} title={borrowerName} widthClassName="max-w-2xl">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <p className="text-caption text-muted">Applied on {formatDate(application.appliedAt)}</p>
        <StatusBadge status={application.status} />
      </div>

      <div className="grid gap-6 py-4 sm:grid-cols-2">
        <div>
          <p className="text-caption font-medium uppercase tracking-wide text-muted">Personal details</p>
          <div className="mt-1 divide-y divide-border">
            <DetailRow label="PAN" value={application.personalDetails.pan} />
            <DetailRow label="Date of birth" value={formatDate(application.personalDetails.dateOfBirth)} />
            <DetailRow label="Monthly salary" value={formatINR(application.personalDetails.monthlySalary)} />
            <DetailRow
              label="Employment"
              value={application.personalDetails.employmentMode.replace('_', ' ')}
            />
          </div>
        </div>

        <div>
          <p className="text-caption font-medium uppercase tracking-wide text-muted">Loan figures</p>
          <div className="mt-1 divide-y divide-border">
            <DetailRow label="Principal" value={formatINR(application.loanConfig.principal)} />
            <DetailRow label="Tenure" value={`${application.loanConfig.tenureDays} days`} />
            <DetailRow label="Interest rate" value={`${application.loanConfig.interestRatePct}% p.a.`} />
            <DetailRow label="Simple interest" value={formatINR(application.loanConfig.simpleInterest)} />
            <DetailRow label="Total repayment" value={formatINR(application.loanConfig.totalRepayment)} />
          </div>
        </div>
      </div>

      <div className="border-t border-border py-4">
        <p className="text-caption font-medium uppercase tracking-wide text-muted">BRE result</p>
        {application.breResult.passed ? (
          <p className="mt-1 text-body text-[#15803D]">Passed all eligibility rules.</p>
        ) : (
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-body text-[#B91C1C]">
            {application.breResult.failedRules.map((rule) => (
              <li key={rule}>{BRE_RULE_MESSAGES[rule]}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border py-4">
        <p className="text-caption font-medium uppercase tracking-wide text-muted">Salary slip</p>
        <a
          href={application.salarySlip.filePath}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-2 text-body font-medium text-brand hover:underline"
        >
          <FileText className="h-4 w-4" />
          {application.salarySlip.fileName}
        </a>
      </div>

      {application.status === 'REJECTED' && application.rejectionReason && (
        <div className="rounded-md border border-[#F3B9B9] bg-[#FEE2E2] p-3">
          <p className="text-sm font-medium text-[#B91C1C]">Rejection reason</p>
          <p className="mt-0.5 text-caption text-[#7F1D1D]">{application.rejectionReason}</p>
        </div>
      )}

      {footer && <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">{footer}</div>}
    </Modal>
  );
}

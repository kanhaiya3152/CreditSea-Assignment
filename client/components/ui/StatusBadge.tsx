import type { ApplicationStatus } from '@/types';
import { STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const STATUS_CLASSES: Record<ApplicationStatus, string> = {
  APPLIED: 'text-[#B45309] bg-[#FEF3C7]',
  SANCTIONED: 'text-[#1D4ED8] bg-[#DBEAFE]',
  REJECTED: 'text-[#B91C1C] bg-[#FEE2E2]',
  DISBURSED: 'text-[#15803D] bg-[#DCFCE7]',
  CLOSED: 'text-[#475569] bg-[#E2E8F0]',
};

export function StatusBadge({ status }: { status: ApplicationStatus }): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-caption font-medium',
        STATUS_CLASSES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

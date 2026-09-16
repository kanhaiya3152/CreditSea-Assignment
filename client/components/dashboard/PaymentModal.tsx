'use client';

import { FormEvent, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { formatDate, formatINR } from '@/lib/format';

/**
 * Local calendar date as YYYY-MM-DD, matching what the native <input type="date">
 * picker shows as "today". `toISOString()` converts to UTC first, which is a
 * different calendar day than local "today" for part of every day in timezones
 * ahead of UTC (e.g. IST, UTC+5:30) - that mismatch was rejecting valid payments
 * dated today as "in the future".
 */
function todayLocal(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function PaymentModal({
  open,
  onClose,
  onSubmit,
  outstandingBalance,
  minDate,
  loading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { utrNumber: string; amount: number; paymentDate: string }) => void;
  outstandingBalance: number;
  /** The loan's disbursement date (ISO) - a payment can't predate the money actually being disbursed. */
  minDate: string;
  loading?: boolean;
  error?: string | null;
}): JSX.Element | null {
  const [utrNumber, setUtrNumber] = useState('');
  const [amount, setAmount] = useState('');
  const today = todayLocal();
  const [paymentDate, setPaymentDate] = useState(today);

  if (!open) return null;

  const minDateOnly = minDate.slice(0, 10);
  const amountNum = Number(amount);
  const amountInvalid = amount !== '' && (Number.isNaN(amountNum) || amountNum <= 0 || amountNum > outstandingBalance);
  // Bounded to [disbursement date, today] inclusive. "today" is computed from local
  // date components (not toISOString/UTC) so it matches what the native date picker
  // itself shows as today - see todayLocal's doc comment for why that distinction matters.
  const dateInvalid = paymentDate < minDateOnly || paymentDate > today;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim() || amountInvalid || dateInvalid) return;
    onSubmit({ utrNumber: utrNumber.trim(), amount: amountNum, paymentDate });
  };

  return (
    <Modal open={open} onClose={onClose} title="Record payment" widthClassName="max-w-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-caption text-muted">
          Outstanding balance: <span className="tabular-nums font-medium text-ink">{formatINR(outstandingBalance)}</span>
        </p>

        <Field label="UTR number">
          <Input
            required
            value={utrNumber}
            onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
            placeholder="e.g. UTR2024090112345"
            className="tabular-nums uppercase"
          />
        </Field>

        <Field
          label="Amount (₹)"
          error={amountInvalid ? `Enter an amount between ₹1 and ${formatINR(outstandingBalance)}.` : undefined}
        >
          <Input
            type="number"
            required
            min={1}
            max={outstandingBalance}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="tabular-nums"
          />
        </Field>

        <Field
          label="Payment date"
          error={
            dateInvalid
              ? `Enter a date between ${formatDate(minDateOnly)} and ${formatDate(today)} (today).`
              : undefined
          }
        >
          <Input
            type="date"
            required
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            min={minDateOnly}
            max={today}
          />
        </Field>

        {error && <p className="text-caption text-[#B91C1C]">{error}</p>}

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={loading} disabled={!utrNumber.trim() || amountInvalid || dateInvalid}>
            Record payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}

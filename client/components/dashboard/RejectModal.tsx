'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Input';

export function RejectModal({
  open,
  onClose,
  onConfirm,
  loading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
  error?: string | null;
}): JSX.Element | null {
  const [reason, setReason] = useState('');

  if (!open) return null;

  const tooShort = reason.trim().length > 0 && reason.trim().length < 10;

  return (
    <Modal open={open} onClose={onClose} title="Reject application" widthClassName="max-w-md">
      <Field label="Reason for rejection" error={tooShort ? 'Reason must be at least 10 characters.' : undefined}>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="e.g. Salary slip does not match the declared monthly salary."
          className="w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-body text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </Field>
      {error && <p className="mt-2 text-caption text-[#B91C1C]">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onConfirm(reason.trim())}
          loading={loading}
          disabled={reason.trim().length < 10}
        >
          Reject application
        </Button>
      </div>
    </Modal>
  );
}

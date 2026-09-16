'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Table, Thead, Th, Tr, Td } from '@/components/dashboard/Table';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';
import { ApplicationDetailModal } from '@/components/dashboard/ApplicationDetailModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api, ApiClientError } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/format';
import type { BorrowerRef, LoanApplication } from '@/types';

function borrowerName(app: LoanApplication): string {
  return typeof app.borrower === 'object' ? (app.borrower as BorrowerRef).fullName : app.personalDetails.fullName;
}

function DisbursementContent(): JSX.Element {
  const [applications, setApplications] = useState<LoanApplication[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<LoanApplication | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ applications: LoanApplication[] }>('/applications?status=SANCTIONED')
      .then((data) => setApplications(data.applications))
      .catch(() => setError('Could not load applications. Please refresh the page.'));
  }, []);

  const filtered = useMemo(() => {
    if (!applications) return [];
    const q = search.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter(
      (a) => borrowerName(a).toLowerCase().includes(q) || a.personalDetails.pan.toLowerCase().includes(q),
    );
  }, [applications, search]);

  const closeAll = () => {
    setSelected(null);
    setConfirmOpen(false);
    setActionError(null);
  };

  const handleDisburse = async () => {
    if (!selected) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await api.patch(`/applications/${selected._id}/disburse`);
      setApplications((prev) => (prev ? prev.filter((a) => a._id !== selected._id) : prev));
      closeAll();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Could not disburse this loan.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-caption text-muted">Sanctioned loans awaiting disbursement.</p>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or PAN..." />
      </div>

      {error && <ErrorState message={error} />}
      {!error && applications === null && <LoadingState label="Loading applications..." />}
      {!error && applications !== null && filtered.length === 0 && (
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState
            title={applications.length === 0 ? 'Nothing to disburse right now' : 'No loans match your search'}
            description={applications.length === 0 ? 'Sanctioned loans will show up here.' : undefined}
          />
        </div>
      )}
      {!error && filtered.length > 0 && (
        <Table>
          <Thead>
            <tr>
              <Th>Applicant</Th>
              <Th>PAN</Th>
              <Th>Amount</Th>
              <Th>Sanctioned</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.map((app) => (
              <Tr key={app._id} onClick={() => setSelected(app)}>
                <Td className="font-medium">{borrowerName(app)}</Td>
                <Td className="tabular-nums text-muted">{app.personalDetails.pan}</Td>
                <Td className="tabular-nums">{formatINR(app.loanConfig.principal)}</Td>
                <Td className="tabular-nums text-muted">{app.sanctionedAt ? formatDate(app.sanctionedAt) : '—'}</Td>
                <Td>
                  <StatusBadge status={app.status} />
                </Td>
                <Td className="text-right">
                  <div onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelected(app);
                        setConfirmOpen(true);
                      }}
                    >
                      Mark disbursed
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      {selected && !confirmOpen && (
        <ApplicationDetailModal
          application={selected}
          onClose={closeAll}
          footer={
            <Button size="sm" onClick={() => setConfirmOpen(true)}>
              Mark disbursed
            </Button>
          }
        />
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Confirm disbursement"
        description={`Mark ${selected ? formatINR(selected.loanConfig.principal) : ''} as disbursed to ${
          selected ? borrowerName(selected) : ''
        }? This cannot be undone.`}
        confirmLabel="Mark disbursed"
        loading={actionLoading}
        error={actionError}
        onConfirm={handleDisburse}
        onCancel={closeAll}
      />
    </div>
  );
}

export default function DisbursementPage(): JSX.Element {
  return (
    <DashboardShell requiredRole="DISBURSEMENT" title="Disbursement queue">
      <DisbursementContent />
    </DashboardShell>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Table, Thead, Th, Tr, Td } from '@/components/dashboard/Table';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';
import { ApplicationDetailModal } from '@/components/dashboard/ApplicationDetailModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { RejectModal } from '@/components/dashboard/RejectModal';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api, ApiClientError } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/format';
import type { BorrowerRef, LoanApplication } from '@/types';

function borrowerName(app: LoanApplication): string {
  return typeof app.borrower === 'object' ? (app.borrower as BorrowerRef).fullName : app.personalDetails.fullName;
}

function SanctionContent(): JSX.Element {
  const [applications, setApplications] = useState<LoanApplication[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<LoanApplication | null>(null);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = () => {
    api
      .get<{ applications: LoanApplication[] }>('/applications?status=APPLIED')
      .then((data) => setApplications(data.applications))
      .catch(() => setError('Could not load applications. Please refresh the page.'));
  };

  useEffect(load, []);

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
    setConfirmApprove(false);
    setRejectOpen(false);
    setActionError(null);
  };

  const handleApprove = async () => {
    if (!selected) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await api.patch(`/applications/${selected._id}/sanction`);
      setApplications((prev) => (prev ? prev.filter((a) => a._id !== selected._id) : prev));
      closeAll();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Could not sanction this application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!selected) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await api.patch(`/applications/${selected._id}/reject`, { reason });
      setApplications((prev) => (prev ? prev.filter((a) => a._id !== selected._id) : prev));
      closeAll();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Could not reject this application.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-caption text-muted">Applications awaiting a sanction decision.</p>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or PAN..." />
      </div>

      {error && <ErrorState message={error} />}
      {!error && applications === null && <LoadingState label="Loading applications..." />}
      {!error && applications !== null && filtered.length === 0 && (
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState
            title={applications.length === 0 ? 'Nothing to sanction right now' : 'No applications match your search'}
            description={applications.length === 0 ? 'New applications will show up here.' : undefined}
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
              <Th>Applied</Th>
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
                <Td className="tabular-nums text-muted">{formatDate(app.appliedAt)}</Td>
                <Td>
                  <StatusBadge status={app.status} />
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelected(app);
                        setRejectOpen(true);
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelected(app);
                        setConfirmApprove(true);
                      }}
                    >
                      Approve
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      {selected && !confirmApprove && !rejectOpen && (
        <ApplicationDetailModal
          application={selected}
          onClose={closeAll}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setRejectOpen(true)}>
                Reject
              </Button>
              <Button size="sm" onClick={() => setConfirmApprove(true)}>
                Approve
              </Button>
            </>
          }
        />
      )}

      <ConfirmModal
        open={confirmApprove}
        title="Approve application"
        description={`Sanction ${selected ? borrowerName(selected) : ''}'s application for ${
          selected ? formatINR(selected.loanConfig.principal) : ''
        }? This moves it to the disbursement queue.`}
        confirmLabel="Approve"
        loading={actionLoading}
        error={actionError}
        onConfirm={handleApprove}
        onCancel={closeAll}
      />

      <RejectModal
        open={rejectOpen}
        onClose={closeAll}
        onConfirm={handleReject}
        loading={actionLoading}
        error={actionError}
      />
    </div>
  );
}

export default function SanctionPage(): JSX.Element {
  return (
    <DashboardShell requiredRole="SANCTION" title="Sanction queue">
      <SanctionContent />
    </DashboardShell>
  );
}

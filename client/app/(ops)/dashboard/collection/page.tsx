'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Table, Thead, Th, Tr, Td } from '@/components/dashboard/Table';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';
import { ApplicationDetailModal } from '@/components/dashboard/ApplicationDetailModal';
import { PaymentModal } from '@/components/dashboard/PaymentModal';
import { Button } from '@/components/ui/Button';
import { api, ApiClientError } from '@/lib/api';
import { formatINR } from '@/lib/format';
import type { BorrowerRef, LoanApplication } from '@/types';

function borrowerName(app: LoanApplication): string {
  return typeof app.borrower === 'object' ? (app.borrower as BorrowerRef).fullName : app.personalDetails.fullName;
}

function CollectionContent(): JSX.Element {
  const [applications, setApplications] = useState<LoanApplication[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<LoanApplication | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ applications: LoanApplication[] }>('/applications?status=DISBURSED')
      .then((data) => setApplications(data.applications))
      .catch(() => setError('Could not load the loan book. Please refresh the page.'));
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
    setPaymentOpen(false);
    setActionError(null);
  };

  const handleRecordPayment = async (data: { utrNumber: string; amount: number; paymentDate: string }) => {
    if (!selected) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await api.post<{ application: LoanApplication; outstandingBalance: number }>(
        `/applications/${selected._id}/payments`,
        data,
      );
      setApplications((prev) => {
        if (!prev) return prev;
        if (res.application.status === 'CLOSED') {
          return prev.filter((a) => a._id !== selected._id);
        }
        return prev.map((a) =>
          a._id === selected._id
            ? {
                ...a,
                outstandingBalance: res.outstandingBalance,
                paidTotal: (a.loanConfig.totalRepayment ?? 0) - res.outstandingBalance,
              }
            : a,
        );
      });
      closeAll();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Could not record this payment.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-caption text-muted">Active, disbursed loans and their outstanding balances.</p>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or PAN..." />
      </div>

      {error && <ErrorState message={error} />}
      {!error && applications === null && <LoadingState label="Loading loan book..." />}
      {!error && applications !== null && filtered.length === 0 && (
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState
            title={applications.length === 0 ? 'No active loans' : 'No loans match your search'}
            description={applications.length === 0 ? 'Disbursed loans will show up here.' : undefined}
          />
        </div>
      )}
      {!error && filtered.length > 0 && (
        <Table>
          <Thead>
            <tr>
              <Th>Applicant</Th>
              <Th>Principal</Th>
              <Th>Total repayment</Th>
              <Th>Paid</Th>
              <Th>Outstanding</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.map((app) => (
              <Tr key={app._id} onClick={() => setSelected(app)}>
                <Td className="font-medium">{borrowerName(app)}</Td>
                <Td className="tabular-nums">{formatINR(app.loanConfig.principal)}</Td>
                <Td className="tabular-nums">{formatINR(app.loanConfig.totalRepayment)}</Td>
                <Td className="tabular-nums text-[#15803D]">{formatINR(app.paidTotal ?? 0)}</Td>
                <Td className="tabular-nums font-medium">
                  {formatINR(app.outstandingBalance ?? app.loanConfig.totalRepayment)}
                </Td>
                <Td className="text-right">
                  <div onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelected(app);
                        setPaymentOpen(true);
                      }}
                    >
                      Record payment
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      {selected && !paymentOpen && (
        <ApplicationDetailModal
          application={selected}
          onClose={closeAll}
          footer={
            <Button size="sm" onClick={() => setPaymentOpen(true)}>
              Record payment
            </Button>
          }
        />
      )}

      {selected && (
        <PaymentModal
          open={paymentOpen}
          onClose={closeAll}
          onSubmit={handleRecordPayment}
          outstandingBalance={selected.outstandingBalance ?? selected.loanConfig.totalRepayment}
          minDate={selected.disbursedAt ?? selected.appliedAt}
          loading={actionLoading}
          error={actionError}
        />
      )}
    </div>
  );
}

export default function CollectionPage(): JSX.Element {
  return (
    <DashboardShell requiredRole="COLLECTION" title="Collection">
      <CollectionContent />
    </DashboardShell>
  );
}

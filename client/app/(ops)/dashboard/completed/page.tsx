'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Table, Thead, Th, Tr, Td } from '@/components/dashboard/Table';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';
import { ApplicationDetailModal } from '@/components/dashboard/ApplicationDetailModal';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/format';
import type { BorrowerRef, LoanApplication } from '@/types';

function borrowerName(app: LoanApplication): string {
  return app.borrower !== null && typeof app.borrower === 'object' ? (app.borrower as BorrowerRef).fullName : app.personalDetails.fullName;
}

function borrowerEmail(app: LoanApplication): string {
  return app.borrower !== null && typeof app.borrower === 'object' ? (app.borrower as BorrowerRef).email : '—';
}

function StatCard({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-lg border border-border bg-surface px-5 py-4">
      <p className="text-caption text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}

function CompletedContent(): JSX.Element {
  const [applications, setApplications] = useState<LoanApplication[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<LoanApplication | null>(null);

  useEffect(() => {
    api
      .get<{ applications: LoanApplication[] }>('/applications?status=CLOSED')
      .then((data) => setApplications(data.applications))
      .catch(() => setError('Could not load completed loans. Please refresh the page.'));
  }, []);

  const filtered = useMemo(() => {
    if (!applications) return [];
    const sorted = [...applications].sort(
      (a, b) => new Date(b.closedAt ?? b.appliedAt).getTime() - new Date(a.closedAt ?? a.appliedAt).getTime(),
    );
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (a) =>
        borrowerName(a).toLowerCase().includes(q) ||
        borrowerEmail(a).toLowerCase().includes(q) ||
        a.personalDetails.pan.toLowerCase().includes(q) ||
        a.personalDetails.employmentMode.toLowerCase().includes(q),
    );
  }, [applications, search]);

  const totalPrincipal = filtered.reduce((sum, a) => sum + a.loanConfig.principal, 0);
  const totalCollected = filtered.reduce((sum, a) => sum + a.loanConfig.totalRepayment, 0);

  return (
    <div className="flex flex-col gap-6">
      {applications !== null && applications.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total completed loans" value={filtered.length.toString()} />
          <StatCard label="Total principal disbursed" value={formatINR(totalPrincipal)} />
          <StatCard label="Total amount collected" value={formatINR(totalCollected)} />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-caption text-muted">Full history of all borrowers who have fully repaid their loan.</p>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, PAN or employment..." />
      </div>

      {error && <ErrorState message={error} />}
      {!error && applications === null && <LoadingState label="Loading completed loans..." />}
      {!error && applications !== null && filtered.length === 0 && (
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState
            title={applications.length === 0 ? 'No completed loans yet' : 'No borrowers match your search'}
            description={
              applications.length === 0 ? 'Loans will appear here once they are fully repaid and closed.' : undefined
            }
          />
        </div>
      )}

      {!error && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <Thead>
              <tr>
                <Th>#</Th>
                <Th>Borrower name</Th>
                <Th>Email</Th>
                <Th>PAN</Th>
                <Th>Date of birth</Th>
                <Th>Employment</Th>
                <Th>Monthly salary</Th>
                <Th>Principal</Th>
                <Th>Tenure (days)</Th>
                <Th>Interest rate</Th>
                <Th>Interest amount</Th>
                <Th>Total repayment</Th>
                <Th>Applied on</Th>
                <Th>Disbursed on</Th>
                <Th>Completed on</Th>
              </tr>
            </Thead>
            <tbody>
              {filtered.map((app, index) => (
                <Tr key={app._id} onClick={() => setSelected(app)}>
                  <Td className="text-muted tabular-nums">{index + 1}</Td>
                  <Td className="font-medium whitespace-nowrap">{borrowerName(app)}</Td>
                  <Td className="text-muted whitespace-nowrap">{borrowerEmail(app)}</Td>
                  <Td className="tabular-nums font-mono text-sm">{app.personalDetails.pan}</Td>
                  <Td className="tabular-nums text-muted whitespace-nowrap">
                    {formatDate(app.personalDetails.dateOfBirth)}
                  </Td>
                  <Td className="text-muted whitespace-nowrap">
                    {app.personalDetails.employmentMode.replace('_', ' ')}
                  </Td>
                  <Td className="tabular-nums">{formatINR(app.personalDetails.monthlySalary)}</Td>
                  <Td className="tabular-nums font-medium">{formatINR(app.loanConfig.principal)}</Td>
                  <Td className="tabular-nums text-center">{app.loanConfig.tenureDays}</Td>
                  <Td className="tabular-nums text-center">{app.loanConfig.interestRatePct}% p.a.</Td>
                  <Td className="tabular-nums">{formatINR(app.loanConfig.simpleInterest)}</Td>
                  <Td className="tabular-nums font-semibold text-[#15803D]">
                    {formatINR(app.loanConfig.totalRepayment)}
                  </Td>
                  <Td className="tabular-nums text-muted whitespace-nowrap">{formatDate(app.appliedAt)}</Td>
                  <Td className="tabular-nums text-muted whitespace-nowrap">
                    {app.disbursedAt ? formatDate(app.disbursedAt) : '—'}
                  </Td>
                  <Td className="tabular-nums text-muted whitespace-nowrap">
                    {app.closedAt ? formatDate(app.closedAt) : '—'}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {selected && <ApplicationDetailModal application={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default function CompletedPage(): JSX.Element {
  return (
    <DashboardShell requiredRole="ADMIN" title="Completed loans">
      <CompletedContent />
    </DashboardShell>
  );
}

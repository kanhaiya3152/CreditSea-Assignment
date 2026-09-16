'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Table, Thead, Th, Tr, Td } from '@/components/dashboard/Table';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Lead } from '@/types';

function SalesContent(): JSX.Element {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get<{ leads: Lead[] }>('/leads')
      .then((data) => setLeads(data.leads))
      .catch(() => setError('Could not load leads. Please refresh the page.'));
  }, []);

  const filtered = useMemo(() => {
    if (!leads) return [];
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) => l.fullName.toLowerCase().includes(q) || l.email.toLowerCase().includes(q));
  }, [leads, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-caption text-muted">
          Registered borrowers who have not yet started a loan application.
        </p>
        <SearchBar value={search} onChange={setSearch} placeholder="Search leads..." />
      </div>

      {error && <ErrorState message={error} />}
      {!error && leads === null && <LoadingState label="Loading leads..." />}
      {!error && leads !== null && filtered.length === 0 && (
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState
            title={leads.length === 0 ? 'No leads yet' : 'No leads match your search'}
            description={leads.length === 0 ? 'New sign-ups without an application will appear here.' : undefined}
          />
        </div>
      )}
      {!error && filtered.length > 0 && (
        <Table>
          <Thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Signed up</Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.map((lead) => (
              <Tr key={lead._id}>
                <Td className="font-medium">{lead.fullName}</Td>
                <Td className="text-muted">{lead.email}</Td>
                <Td className="tabular-nums text-muted">{formatDate(lead.createdAt)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default function SalesPage(): JSX.Element {
  return (
    <DashboardShell requiredRole="SALES" title="Leads">
      <SalesContent />
    </DashboardShell>
  );
}

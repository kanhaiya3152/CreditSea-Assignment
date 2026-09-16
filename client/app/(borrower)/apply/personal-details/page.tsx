'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { WizardShell } from '@/components/wizard/WizardShell';
import { Field, Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';
import { useApply, type WizardPersonalDetails } from '@/lib/ApplyContext';
import { api, ApiClientError } from '@/lib/api';
import type { BreResult, LoanApplication } from '@/types';
import { PAN_REGEX } from '@/lib/constants';

export default function PersonalDetailsPage(): JSX.Element {
  const router = useRouter();
  const { personalDetails, setPersonalDetails, setBreResult } = useApply();

  const [form, setForm] = useState<WizardPersonalDetails>(personalDetails);
  const [failMessages, setFailMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingActive, setCheckingActive] = useState(true);

  // A borrower with an application already in flight (not REJECTED/CLOSED) can't
  // submit another - this is enforced authoritatively server-side at final submit,
  // but checking here too means they don't waste time filling out 3 more steps
  // only to be blocked at the end.
  useEffect(() => {
    api
      .get<{ applications: LoanApplication[] }>('/applications/me')
      .then((data) => {
        const hasActive = data.applications.some((a) => a.status !== 'REJECTED' && a.status !== 'CLOSED');
        if (hasActive) {
          router.replace('/my-loan');
          return;
        }
        setCheckingActive(false);
      })
      .catch(() => setCheckingActive(false));
  }, [router]);

  const update = <K extends keyof WizardPersonalDetails>(key: K, value: WizardPersonalDetails[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFailMessages([]);

    if (!PAN_REGEX.test(form.pan.toUpperCase())) {
      setError('Enter a valid 10-character PAN (e.g. ABCDE1234F).');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: form.fullName,
        pan: form.pan.toUpperCase(),
        dateOfBirth: form.dateOfBirth,
        monthlySalary: Number(form.monthlySalary),
        employmentMode: form.employmentMode,
      };

      const data = await api.post<{ breResult: BreResult; failedRuleMessages: string[] }>(
        '/applications/bre-check',
        payload,
      );

      setPersonalDetails({ ...form, pan: payload.pan });

      if (!data.breResult.passed) {
        setBreResult(null);
        setFailMessages(data.failedRuleMessages);
        return;
      }

      setBreResult(data.breResult);
      router.push('/apply/upload');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingActive) {
    return (
      <WizardShell step={2} title="Personal details" subtitle="We use this to check your loan eligibility instantly.">
        <LoadingState label="Checking your account..." />
      </WizardShell>
    );
  }

  return (
    <WizardShell step={2} title="Personal details" subtitle="We use this to check your loan eligibility instantly.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Full name">
          <Input
            required
            value={form.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            placeholder="As per your PAN card"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="PAN">
            <Input
              required
              maxLength={10}
              value={form.pan}
              onChange={(e) => update('pan', e.target.value.toUpperCase())}
              placeholder="ABCDE1234F"
              className="uppercase tabular-nums"
            />
          </Field>
          <Field label="Date of birth">
            <Input
              type="date"
              required
              value={form.dateOfBirth}
              onChange={(e) => update('dateOfBirth', e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Monthly salary (₹)">
            <Input
              type="number"
              required
              min={0}
              value={form.monthlySalary}
              onChange={(e) => update('monthlySalary', e.target.value)}
              placeholder="45,000"
              className="tabular-nums"
            />
          </Field>
          <Field label="Employment mode">
            <Select
              required
              value={form.employmentMode}
              onChange={(e) => update('employmentMode', e.target.value as WizardPersonalDetails['employmentMode'])}
            >
              <option value="" disabled>
                Select
              </option>
              <option value="SALARIED">Salaried</option>
              <option value="SELF_EMPLOYED">Self-employed</option>
              <option value="UNEMPLOYED">Unemployed</option>
            </Select>
          </Field>
        </div>

        {failMessages.length > 0 && (
          <div className="rounded-md border border-[#FDE68A] bg-[#FEF3C7] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#B45309]">
              <AlertCircle className="h-4 w-4" />
              This application isn&apos;t eligible yet
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-caption text-[#92400E]">
              {failMessages.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
            <p className="mt-2 text-caption text-[#92400E]">Update the details above and check again.</p>
          </div>
        )}

        {error && <p className="text-caption text-[#B91C1C]">{error}</p>}

        <Button type="submit" loading={loading} className="mt-2 w-full">
          Check eligibility &amp; continue
        </Button>
      </form>
    </WizardShell>
  );
}

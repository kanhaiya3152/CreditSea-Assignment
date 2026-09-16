'use client';

import { useRouter } from 'next/navigation';
import { ChangeEvent, DragEvent, useEffect, useState } from 'react';
import { FileCheck2, UploadCloud } from 'lucide-react';
import { WizardShell } from '@/components/wizard/WizardShell';
import { Button } from '@/components/ui/Button';
import { useApply } from '@/lib/ApplyContext';
import { api, ApiClientError } from '@/lib/api';
import { ALLOWED_UPLOAD_MIMETYPES, MAX_UPLOAD_BYTES } from '@/lib/constants';
import type { SalarySlip } from '@/types';

export default function UploadPage(): JSX.Element {
  const router = useRouter();
  const { breResult, salarySlip, setSalarySlip } = useApply();

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!breResult?.passed) {
      router.replace('/apply/personal-details');
    }
  }, [breResult, router]);

  const validateAndSetFile = (candidate: File) => {
    setError(null);
    if (!ALLOWED_UPLOAD_MIMETYPES.includes(candidate.type)) {
      setError('Only PDF, JPG, or PNG files are accepted.');
      return;
    }
    if (candidate.size > MAX_UPLOAD_BYTES) {
      setError('File exceeds the 5MB size limit.');
      return;
    }
    setFile(candidate);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const candidate = e.target.files?.[0];
    if (candidate) validateAndSetFile(candidate);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const candidate = e.dataTransfer.files?.[0];
    if (candidate) validateAndSetFile(candidate);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('salarySlip', file);
      const data = await api.postForm<{ salarySlip: SalarySlip }>('/uploads/salary-slip', formData);
      setSalarySlip(data.salarySlip);
      router.push('/apply/configure');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <WizardShell step={3} title="Upload salary slip" subtitle="We accept your most recent PDF, JPG, or PNG payslip, up to 5MB.">
      <div className="flex flex-col gap-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
            dragActive ? 'border-brand bg-brand-light' : 'border-border bg-bg'
          }`}
        >
          {file || salarySlip ? (
            <>
              <FileCheck2 className="h-8 w-8 text-brand" />
              <div>
                <p className="text-body font-medium text-ink">{file?.name ?? salarySlip?.fileName}</p>
                <p className="text-caption text-muted">
                  {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Uploaded'}
                </p>
              </div>
            </>
          ) : (
            <>
              <UploadCloud className="h-8 w-8 text-muted" />
              <div>
                <p className="text-body font-medium text-ink">Drag and drop your salary slip</p>
                <p className="text-caption text-muted">or click below to browse</p>
              </div>
            </>
          )}
          <label className="cursor-pointer">
            <span className="inline-flex h-9 items-center rounded-md border border-border bg-white px-4 text-sm font-medium text-ink hover:bg-bg">
              {file || salarySlip ? 'Choose a different file' : 'Browse files'}
            </span>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              className="hidden"
              onChange={handleFileInput}
            />
          </label>
        </div>

        {error && <p className="text-caption text-[#B91C1C]">{error}</p>}

        <Button onClick={handleUpload} loading={loading} disabled={!file} className="w-full">
          Upload &amp; continue
        </Button>
      </div>
    </WizardShell>
  );
}

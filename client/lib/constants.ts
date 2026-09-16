import type { ApplicationStatus, BreRule } from '@/types';

export const INTEREST_RATE_PCT = 12;
export const LOAN_MIN_PRINCIPAL = 50_000;
export const LOAN_MAX_PRINCIPAL = 500_000;
export const LOAN_MIN_TENURE_DAYS = 30;
export const LOAN_MAX_TENURE_DAYS = 365;

export const MIN_AGE = 23;
export const MAX_AGE = 50;
export const MIN_MONTHLY_SALARY = 25_000;

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_UPLOAD_MIMETYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export const BRE_RULE_MESSAGES: Record<BreRule, string> = {
  AGE: `Applicant age must be between ${MIN_AGE} and ${MAX_AGE} years.`,
  SALARY: `Monthly salary must be at least ₹${MIN_MONTHLY_SALARY.toLocaleString('en-IN')}.`,
  PAN: 'PAN must be a valid 10-character PAN (e.g. ABCDE1234F).',
  EMPLOYMENT: 'Applicant must be currently employed (salaried or self-employed).',
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: 'Applied',
  SANCTIONED: 'Sanctioned',
  REJECTED: 'Rejected',
  DISBURSED: 'Disbursed',
  CLOSED: 'Closed',
};

export const WIZARD_STEPS = ['Sign Up', 'Personal Details', 'Upload', 'Configure'] as const;

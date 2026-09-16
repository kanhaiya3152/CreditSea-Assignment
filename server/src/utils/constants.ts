export const ROLES = ['ADMIN', 'SALES', 'SANCTION', 'DISBURSEMENT', 'COLLECTION', 'BORROWER'] as const;
export type Role = (typeof ROLES)[number];

export const EMPLOYMENT_MODES = ['SALARIED', 'SELF_EMPLOYED', 'UNEMPLOYED'] as const;
export type EmploymentMode = (typeof EMPLOYMENT_MODES)[number];

export const APPLICATION_STATUSES = ['APPLIED', 'SANCTIONED', 'REJECTED', 'DISBURSED', 'CLOSED'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const BRE_RULES = ['AGE', 'SALARY', 'PAN', 'EMPLOYMENT'] as const;
export type BreRule = (typeof BRE_RULES)[number];

export const INTEREST_RATE_PCT = 12;
export const LOAN_MIN_PRINCIPAL = 50_000;
export const LOAN_MAX_PRINCIPAL = 500_000;
export const LOAN_MIN_TENURE_DAYS = 30;
export const LOAN_MAX_TENURE_DAYS = 365;

export const MIN_AGE = 23;
export const MAX_AGE = 50;
export const MIN_MONTHLY_SALARY = 25_000;

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_UPLOAD_MIMETYPES = ['application/pdf', 'image/jpeg', 'image/png'];

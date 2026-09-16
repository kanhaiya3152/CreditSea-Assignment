import { z } from 'zod';
import {
  EMPLOYMENT_MODES,
  LOAN_MAX_PRINCIPAL,
  LOAN_MAX_TENURE_DAYS,
  LOAN_MIN_PRINCIPAL,
  LOAN_MIN_TENURE_DAYS,
} from './constants';

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const personalDetailsSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters.'),
  // Format is intentionally not enforced here - PAN format is one of the four BRE rules
  // (see bre.service.ts) and must be reportable as a rule failure alongside AGE/SALARY/EMPLOYMENT,
  // not pre-empted by a generic validation error.
  pan: z.string().trim().toUpperCase().min(1, 'Enter your PAN.').max(10, 'PAN must be at most 10 characters.'),
  dateOfBirth: z.coerce.date({ errorMap: () => ({ message: 'Enter a valid date of birth.' }) }),
  monthlySalary: z.coerce.number().positive('Monthly salary must be greater than 0.'),
  employmentMode: z.enum(EMPLOYMENT_MODES),
});

export const applicationSubmitSchema = z.object({
  personalDetails: personalDetailsSchema,
  salarySlip: z.object({
    fileName: z.string().min(1, 'Upload a salary slip before applying.'),
    filePath: z.string().min(1, 'Upload a salary slip before applying.'),
    mimeType: z.string().min(1),
    sizeBytes: z.coerce.number().positive(),
  }),
  loanConfig: z.object({
    principal: z.coerce.number().min(LOAN_MIN_PRINCIPAL).max(LOAN_MAX_PRINCIPAL),
    tenureDays: z.coerce.number().min(LOAN_MIN_TENURE_DAYS).max(LOAN_MAX_TENURE_DAYS),
  }),
});

export const rejectSchema = z.object({
  reason: z.string().trim().min(10, 'Rejection reason must be at least 10 characters.'),
});

export const recordPaymentSchema = z.object({
  utrNumber: z.string().trim().min(4, 'Enter a valid UTR number.'),
  amount: z.coerce.number().positive('Amount must be greater than 0.'),
  paymentDate: z.coerce.date({ errorMap: () => ({ message: 'Enter a valid payment date.' }) }),
});

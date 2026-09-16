import type { BreRule, EmploymentMode } from '@/types';
import { MAX_AGE, MIN_AGE, MIN_MONTHLY_SALARY, PAN_REGEX } from './constants';

export interface BreCheckInput {
  dateOfBirth: string;
  monthlySalary: number;
  pan: string;
  employmentMode: EmploymentMode;
}

function calculateAge(dateOfBirth: Date, asOf: Date): number {
  let age = asOf.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = asOf.getMonth() - dateOfBirth.getMonth();
  const dayDiff = asOf.getDate() - dateOfBirth.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age;
}

/**
 * Client-side mirror of the server BRE rules, for instant inline feedback only.
 * The server re-runs these authoritatively; this result is never trusted for persistence.
 */
export function runBreClientPreview(input: BreCheckInput): { passed: boolean; failedRules: BreRule[] } {
  const failedRules: BreRule[] = [];

  if (!input.dateOfBirth) {
    failedRules.push('AGE');
  } else {
    const age = calculateAge(new Date(input.dateOfBirth), new Date());
    if (age < MIN_AGE || age > MAX_AGE) failedRules.push('AGE');
  }

  if (!input.monthlySalary || input.monthlySalary < MIN_MONTHLY_SALARY) {
    failedRules.push('SALARY');
  }

  if (!PAN_REGEX.test(input.pan.toUpperCase())) {
    failedRules.push('PAN');
  }

  if (input.employmentMode === 'UNEMPLOYED') {
    failedRules.push('EMPLOYMENT');
  }

  return { passed: failedRules.length === 0, failedRules };
}

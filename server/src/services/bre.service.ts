import { BreRule, EmploymentMode, MAX_AGE, MIN_AGE, MIN_MONTHLY_SALARY, PAN_REGEX } from '../utils/constants';

export interface BreInput {
  dateOfBirth: Date;
  monthlySalary: number;
  pan: string;
  employmentMode: EmploymentMode;
}

export interface BreOutcome {
  passed: boolean;
  failedRules: BreRule[];
  evaluatedAt: Date;
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
 * Authoritative Business Rule Engine check. Runs the same four rules used for
 * both the inline "bre-check" call and the final application submission, so
 * a client can never bypass eligibility by skipping straight to submit.
 */
export function runBre(input: BreInput, asOf: Date = new Date()): BreOutcome {
  const failedRules: BreRule[] = [];

  const age = calculateAge(input.dateOfBirth, asOf);
  if (age < MIN_AGE || age > MAX_AGE) {
    failedRules.push('AGE');
  }

  if (input.monthlySalary < MIN_MONTHLY_SALARY) {
    failedRules.push('SALARY');
  }

  if (!PAN_REGEX.test(input.pan.toUpperCase())) {
    failedRules.push('PAN');
  }

  if (input.employmentMode === 'UNEMPLOYED') {
    failedRules.push('EMPLOYMENT');
  }

  return {
    passed: failedRules.length === 0,
    failedRules,
    evaluatedAt: asOf,
  };
}

export const BRE_RULE_MESSAGES: Record<BreRule, string> = {
  AGE: `Applicant age must be between ${MIN_AGE} and ${MAX_AGE} years.`,
  SALARY: `Monthly salary must be at least ₹${MIN_MONTHLY_SALARY.toLocaleString('en-IN')}.`,
  PAN: 'PAN must be a valid 10-character PAN (e.g. ABCDE1234F).',
  EMPLOYMENT: 'Applicant must be currently employed (salaried or self-employed).',
};

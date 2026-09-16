export type Role = 'ADMIN' | 'SALES' | 'SANCTION' | 'DISBURSEMENT' | 'COLLECTION' | 'BORROWER';

export type EmploymentMode = 'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED';

export type ApplicationStatus = 'APPLIED' | 'SANCTIONED' | 'REJECTED' | 'DISBURSED' | 'CLOSED';

export type BreRule = 'AGE' | 'SALARY' | 'PAN' | 'EMPLOYMENT';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}

export interface Lead {
  _id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface PersonalDetails {
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}

export interface BreResult {
  passed: boolean;
  failedRules: BreRule[];
  evaluatedAt: string;
}

export interface SalarySlip {
  fileName: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface LoanConfig {
  principal: number;
  tenureDays: number;
  interestRatePct: number;
  simpleInterest: number;
  totalRepayment: number;
}

export interface BorrowerRef {
  _id: string;
  fullName: string;
  email: string;
}

export interface LoanApplication {
  _id: string;
  borrower: string | BorrowerRef;
  personalDetails: PersonalDetails;
  breResult: BreResult;
  salarySlip: SalarySlip;
  loanConfig: LoanConfig;
  status: ApplicationStatus;
  rejectionReason?: string;
  appliedAt: string;
  sanctionedAt?: string;
  rejectedAt?: string;
  disbursedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Present only when the list endpoint returns DISBURSED applications (Collection module). */
  paidTotal?: number;
  outstandingBalance?: number;
}

export interface Payment {
  _id: string;
  loanApplication: string;
  utrNumber: string;
  amount: number;
  paymentDate: string;
  recordedBy: string;
  createdAt: string;
}

export interface ApiErrorShape {
  error: {
    message: string;
    code: string;
  };
}

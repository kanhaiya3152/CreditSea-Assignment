'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { BreResult, EmploymentMode, SalarySlip } from '@/types';
import { LOAN_MAX_PRINCIPAL, LOAN_MIN_PRINCIPAL, LOAN_MIN_TENURE_DAYS } from './constants';

export interface WizardPersonalDetails {
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: string;
  employmentMode: EmploymentMode | '';
}

interface ApplyState {
  personalDetails: WizardPersonalDetails;
  setPersonalDetails: (details: WizardPersonalDetails) => void;
  breResult: BreResult | null;
  setBreResult: (result: BreResult | null) => void;
  salarySlip: SalarySlip | null;
  setSalarySlip: (slip: SalarySlip | null) => void;
  principal: number;
  setPrincipal: (n: number) => void;
  tenureDays: number;
  setTenureDays: (n: number) => void;
  reset: () => void;
}

const EMPTY_DETAILS: WizardPersonalDetails = {
  fullName: '',
  pan: '',
  dateOfBirth: '',
  monthlySalary: '',
  employmentMode: '',
};

const ApplyContext = createContext<ApplyState | undefined>(undefined);

export function ApplyProvider({ children }: { children: ReactNode }): JSX.Element {
  const [personalDetails, setPersonalDetails] = useState<WizardPersonalDetails>(EMPTY_DETAILS);
  const [breResult, setBreResult] = useState<BreResult | null>(null);
  const [salarySlip, setSalarySlip] = useState<SalarySlip | null>(null);
  const [principal, setPrincipal] = useState<number>(LOAN_MIN_PRINCIPAL);
  const [tenureDays, setTenureDays] = useState<number>(LOAN_MIN_TENURE_DAYS);

  const reset = () => {
    setPersonalDetails(EMPTY_DETAILS);
    setBreResult(null);
    setSalarySlip(null);
    setPrincipal(LOAN_MIN_PRINCIPAL);
    setTenureDays(LOAN_MIN_TENURE_DAYS);
  };

  return (
    <ApplyContext.Provider
      value={{
        personalDetails,
        setPersonalDetails,
        breResult,
        setBreResult,
        salarySlip,
        setSalarySlip,
        principal,
        setPrincipal,
        tenureDays,
        setTenureDays,
        reset,
      }}
    >
      {children}
    </ApplyContext.Provider>
  );
}

export function useApply(): ApplyState {
  const ctx = useContext(ApplyContext);
  if (!ctx) throw new Error('useApply must be used within ApplyProvider');
  return ctx;
}

export { LOAN_MAX_PRINCIPAL, LOAN_MIN_PRINCIPAL };

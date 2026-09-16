import { INTEREST_RATE_PCT } from './constants';

export interface LoanFigures {
  simpleInterest: number;
  totalRepayment: number;
}

/**
 * SI = (P x R x T) / (365 x 100); Total Repayment = P + SI. Mirrors the server calc
 * for live UI feedback. Rounded to the nearest whole rupee, matching the server -
 * see loanMath.service.ts for why paisa precision isn't used.
 */
export function computeLoanFigures(principal: number, tenureDays: number): LoanFigures {
  const rawSimpleInterest = (principal * INTEREST_RATE_PCT * tenureDays) / (365 * 100);
  const simpleInterest = Math.round(rawSimpleInterest);
  const totalRepayment = principal + simpleInterest;
  return { simpleInterest, totalRepayment };
}

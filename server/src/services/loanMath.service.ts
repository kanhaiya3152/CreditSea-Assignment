import { INTEREST_RATE_PCT } from '../utils/constants';

export interface LoanFigures {
  principal: number;
  tenureDays: number;
  interestRatePct: number;
  simpleInterest: number;
  totalRepayment: number;
}

/**
 * SI = (P x R x T) / (365 x 100); Total Repayment = P + SI.
 * Always recomputed server-side - client-sent figures are never trusted.
 * Rounded to the nearest whole rupee, not paise: every amount shown to a user
 * (formatINR) and every amount they can type into the payment form is whole-rupee,
 * so the figures actually being tracked need to match exactly - otherwise a loan
 * "paid in full" per what's on screen can be left with an unpayable paisa residue.
 */
export function computeLoanFigures(principal: number, tenureDays: number): LoanFigures {
  const rawSimpleInterest = (principal * INTEREST_RATE_PCT * tenureDays) / (365 * 100);
  const simpleInterest = Math.round(rawSimpleInterest);
  const totalRepayment = principal + simpleInterest;

  return {
    principal,
    tenureDays,
    interestRatePct: INTEREST_RATE_PCT,
    simpleInterest,
    totalRepayment,
  };
}

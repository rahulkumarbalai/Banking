import type { Loan } from './types';

const MAX_SCHEDULE_MONTHS = 12_000;

export const roundCurrency = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const validDate = (value: string | Date): Date | null => {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Advances one calendar month while keeping the loan's original issue day.
 * A loan issued on January 31 therefore becomes due on February 28/29 and
 * returns to the 31st in March.
 */
export const nextLoanMonthDate = (value: string | Date, issueDay: number): Date => {
  const date = validDate(value);
  if (!date) throw new Error('Invalid loan interest date');

  const targetMonth = date.getMonth() + 1;
  const targetYear = date.getFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();

  return new Date(
    targetYear,
    normalizedMonth,
    Math.min(issueDay, lastDay),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
};

export interface LoanInterestAccrual {
  completedMonths: number;
  newlyCompletedInterest: number;
  totalCompletedInterestDue: number;
  monthlyInterest: number;
  incompleteMonthMaximum: number;
  hasIncompleteMonth: boolean;
  accruedThroughDate: string;
  nextInterestDate: string;
}

export const getLoanInterestAccrual = (
  loan: Pick<Loan, 'date' | 'lastInterestAppliedDate' | 'interestCycleDay' | 'outstandingPrincipal' | 'outstandingInterest' | 'interestRatePercent'>,
  asOf: string | Date = new Date(),
): LoanInterestAccrual => {
  const now = validDate(asOf) ?? new Date();
  const issueDate = validDate(loan.date) ?? now;
  const storedAnchor = validDate(loan.lastInterestAppliedDate ?? loan.date);
  let accruedThrough = storedAnchor && storedAnchor.getTime() >= issueDate.getTime() ? storedAnchor : issueDate;
  const issueDay = Number.isInteger(loan.interestCycleDay) && Number(loan.interestCycleDay) >= 1 && Number(loan.interestCycleDay) <= 31
    ? Number(loan.interestCycleDay)
    : issueDate.getDate();
  const monthlyInterest = roundCurrency(
    Math.max(loan.outstandingPrincipal, 0) * (Math.max(loan.interestRatePercent, 0) / 100),
  );
  let nextDue = nextLoanMonthDate(accruedThrough, issueDay);
  let completedMonths = 0;

  while (nextDue.getTime() <= now.getTime() && completedMonths < MAX_SCHEDULE_MONTHS) {
    accruedThrough = nextDue;
    completedMonths += 1;
    nextDue = nextLoanMonthDate(accruedThrough, issueDay);
  }

  const newlyCompletedInterest = roundCurrency(monthlyInterest * completedMonths);
  const hasIncompleteMonth = now.getTime() > accruedThrough.getTime() && now.getTime() < nextDue.getTime();

  return {
    completedMonths,
    newlyCompletedInterest,
    totalCompletedInterestDue: roundCurrency(Math.max(loan.outstandingInterest, 0) + newlyCompletedInterest),
    monthlyInterest,
    incompleteMonthMaximum: hasIncompleteMonth ? monthlyInterest : 0,
    hasIncompleteMonth,
    accruedThroughDate: accruedThrough.toISOString(),
    nextInterestDate: nextDue.toISOString(),
  };
};

export const normalizeIncompleteInterestAmount = (requested: number, maximum: number): number => {
  const amount = roundCurrency(requested);
  const limit = roundCurrency(Math.max(maximum, 0));
  if (!Number.isFinite(requested) || amount < 0 || amount > limit) {
    throw new Error('Invalid incomplete month interest amount');
  }
  return amount;
};

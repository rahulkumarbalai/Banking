export type MemberType = 'share' | 'borrower';

export interface User {
  id: string;
  name: string;
  mobile: string;
  memberType: MemberType;
  monthlyShareAmount: number; // 0 for borrower-type members
  totalDeposited: number;
  totalLent: number; // active outstanding loan balance
  totalWithdrawn: number; // shares returned to member
  interestEarned: number; // cumulative interest distributions received
}

export interface Loan {
  id: string;
  userId: string;
  principalAmount: number; // original borrowed amount
  outstandingPrincipal: number; // remaining principal
  interestRatePercent: number; // per-loan interest rate (set at borrow time)
  totalInterestPaid: number; // interest paid so far on this loan
  date: string; // date loan was issued
  status: 'active' | 'closed';
}

export interface Transaction {
  id: string;
  userId: string;
  loanId?: string; // links repayments to specific loans
  type:
    | 'deposit'
    | 'borrow'
    | 'repay_full'
    | 'repay_partial'
    | 'interest_only'
    | 'withdraw'
    | 'interest_distribution';
  amount: number;
  date: string;
  description: string; // human-readable log entry
  interestPaid?: number;
  principalPaid?: number;
}

export interface GlobalState {
  totalLendingPool: number;
  totalInterestCollected: number; // undistributed interest from loan repayments
  totalInterestDistributed: number; // cumulative distributed
  defaultInterestRatePercent: number; // global default (configurable in Settings)
}

export interface AppData {
  users: User[];
  loans: Loan[];
  transactions: Transaction[];
  globalState: GlobalState;
}

import { v4 as uuidv4 } from 'uuid';
import type { User, Loan, Transaction, GlobalState, AppData, MemberType } from './types';

const STORAGE_KEY = 'banking_app_data';

const defaultData: AppData = {
  users: [],
  loans: [],
  transactions: [],
  globalState: {
    totalLendingPool: 0,
    totalInterestCollected: 0,
    totalInterestDistributed: 0,
    defaultInterestRatePercent: 3,
  },
};

// ---------------------------------------------------------------------------
// Migration: upgrade old localStorage schema to new format
// ---------------------------------------------------------------------------
const migrateData = (raw: unknown): AppData => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = raw as any;

  // Ensure loans array exists and has new fields
  if (!data.loans) {
    data.loans = [];
  } else {
    data.loans = data.loans.map((l: any) => ({
      ...l,
      outstandingInterest: l.outstandingInterest || 0,
      lastInterestAppliedDate: l.lastInterestAppliedDate || l.date,
    }));
  }

  // Migrate globalState fields
  if (data.globalState) {
    if (data.globalState.totalInterestCollected === undefined) data.globalState.totalInterestCollected = 0;
    if (data.globalState.totalInterestDistributed === undefined) data.globalState.totalInterestDistributed = 0;
    if (data.globalState.defaultInterestRatePercent === undefined) data.globalState.defaultInterestRatePercent = 3;
  } else {
    data.globalState = { ...defaultData.globalState };
  }

  // Migrate users
  if (data.users) {
    data.users = data.users.map((u: any) => ({
      ...u,
      mobile: u.mobile || '',
      memberType: u.memberType || 'share',
      totalWithdrawn: u.totalWithdrawn || 0,
      interestEarned: u.interestEarned || 0,
    }));
  }

  // Migrate transactions — ensure description field
  if (data.transactions) {
    data.transactions = data.transactions.map((t: any) => ({
      ...t,
      description: t.description || `${t.type} of ₹${t.amount?.toLocaleString?.() ?? t.amount}`,
    }));
  }

  return data as AppData;
};

const getData = (): AppData => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...defaultData, users: [], loans: [], transactions: [] };
  try {
    const parsed = JSON.parse(raw);
    return migrateData(parsed);
  } catch {
    return { ...defaultData, users: [], loans: [], transactions: [] };
  }
};

type Listener = () => void;
const listeners = new Set<Listener>();

export const store = {
  get: getData,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

const notify = () => {
  listeners.forEach((fn) => fn());
};

const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  notify();
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const computeTotalShareDeposits = (data: AppData): number => {
  return data.users
    .filter(u => u.memberType === 'share')
    .reduce((sum, u) => sum + u.totalDeposited - u.totalWithdrawn, 0);
};

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
export const api = {
  // ---- Global State ----
  getGlobalState: (): GlobalState => {
    return getData().globalState;
  },

  applyMonthlyInterest: (): void => {
    const data = getData();
    const now = new Date().toISOString();
    let updated = false;

    for (const loan of data.loans) {
      if (loan.status === 'active') {
        const interest = loan.outstandingPrincipal * (loan.interestRatePercent / 100);
        loan.outstandingInterest += interest;
        loan.lastInterestAppliedDate = now;
        updated = true;
      }
    }
    
    if (updated) {
      saveData(data);
    }
  },

  setDefaultInterestRate: (rate: number): GlobalState => {
    if (!Number.isFinite(rate) || rate < 0) {
      throw new Error('Invalid interest rate');
    }
    const data = getData();
    data.globalState.defaultInterestRatePercent = rate;
    saveData(data);
    return data.globalState;
  },

  // ---- Users ----
  getUsers: (): User[] => {
    const users = getData().users;
    return users.sort((a, b) => b.totalDeposited - a.totalDeposited);
  },

  getUser: (id: string): User | undefined => {
    return getData().users.find(u => u.id === id);
  },

  addUser: (name: string, mobile: string, memberType: MemberType, monthlyShareAmount: number): User => {
    const data = getData();
    const newUser: User = {
      id: uuidv4(),
      name,
      mobile,
      memberType,
      monthlyShareAmount: memberType === 'borrower' ? 0 : monthlyShareAmount,
      totalDeposited: 0,
      totalLent: 0,
      totalWithdrawn: 0,
      interestEarned: 0,
    };
    data.users.push(newUser);
    saveData(data);
    return newUser;
  },

  // ---- Deposits (shares) ----
  depositShare: (userId: string, amount: number): Transaction => {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Invalid deposit amount');
    }
    const data = getData();
    const userIndex = data.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');

    const user = data.users[userIndex];
    if (user.memberType !== 'share') {
      throw new Error('Only share members can deposit share capital');
    }

    user.totalDeposited += amount;

    // Shares become capital — increase lending pool
    data.globalState.totalLendingPool += amount;

    const transaction: Transaction = {
      id: uuidv4(),
      userId,
      type: 'deposit',
      amount,
      date: new Date().toISOString(),
      description: `Monthly share deposit of ₹${fmt(amount)} by ${user.name}`,
    };

    data.transactions.push(transaction);
    saveData(data);
    return transaction;
  },

  // ---- Borrowing ----
  borrowMoney: (userId: string, amount: number, interestRateOverride?: number): { transaction: Transaction; loan: Loan } => {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Invalid borrow amount');
    }
    const data = getData();
    const rate = interestRateOverride ?? data.globalState.defaultInterestRatePercent;
    if (!Number.isFinite(rate) || rate < 0) {
      throw new Error('Invalid interest rate');
    }

    if (data.globalState.totalLendingPool < amount) {
      throw new Error('Not enough funds in the lending pool');
    }

    const userIndex = data.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');

    const user = data.users[userIndex];

    data.globalState.totalLendingPool -= amount;
    user.totalLent += amount;

    const initialInterest = amount * (rate / 100);

    const loan: Loan = {
      id: uuidv4(),
      userId,
      principalAmount: amount,
      outstandingPrincipal: amount,
      interestRatePercent: rate,
      totalInterestPaid: 0,
      outstandingInterest: initialInterest,
      lastInterestAppliedDate: new Date().toISOString(),
      date: new Date().toISOString(),
      status: 'active',
    };
    data.loans.push(loan);

    const transaction: Transaction = {
      id: uuidv4(),
      userId,
      loanId: loan.id,
      type: 'borrow',
      amount,
      date: new Date().toISOString(),
      description: `Borrowed ₹${fmt(amount)} at ${rate}% interest`,
    };

    data.transactions.push(transaction);
    saveData(data);
    return { transaction, loan };
  },

  // ---- Repayment: Full ----
  repayFull: (userId: string, loanId: string): Transaction => {
    const data = getData();
    const userIndex = data.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');

    const loanIndex = data.loans.findIndex(l => l.id === loanId && l.userId === userId);
    if (loanIndex === -1) throw new Error('Loan not found');

    const loan = data.loans[loanIndex];
    if (loan.status === 'closed') throw new Error('Loan is already closed');

    const principal = loan.outstandingPrincipal;
    const interest = loan.outstandingInterest;
    const totalPayment = principal + interest;

    // Update user
    data.users[userIndex].totalLent -= principal;

    // Principal returns to pool, interest goes to interest pool
    data.globalState.totalLendingPool += principal;
    data.globalState.totalInterestCollected += interest;

    // Close loan
    loan.outstandingPrincipal = 0;
    loan.outstandingInterest = 0;
    loan.totalInterestPaid += interest;
    loan.status = 'closed';

    const transaction: Transaction = {
      id: uuidv4(),
      userId,
      loanId,
      type: 'repay_full',
      amount: totalPayment,
      principalPaid: principal,
      interestPaid: interest,
      date: new Date().toISOString(),
      description: `Full repayment — ₹${fmt(principal)} principal + ₹${fmt(interest)} interest (${loan.interestRatePercent}%)`,
    };

    data.transactions.push(transaction);
    saveData(data);
    return transaction;
  },

  // ---- Repayment: Partial ----
  repayPartial: (userId: string, loanId: string, principalAmount: number, payInterest: boolean): Transaction => {
    if (!Number.isFinite(principalAmount) || principalAmount < 0) {
      throw new Error('Invalid repayment amount');
    }
    if (principalAmount === 0 && !payInterest) {
      throw new Error('Payment amount must be greater than 0');
    }

    const data = getData();
    const userIndex = data.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');

    const loanIndex = data.loans.findIndex(l => l.id === loanId && l.userId === userId);
    if (loanIndex === -1) throw new Error('Loan not found');

    const loan = data.loans[loanIndex];
    if (loan.status === 'closed') throw new Error('Loan is already closed');
    if (principalAmount > loan.outstandingPrincipal) throw new Error('Amount exceeds outstanding principal');

    const interest = payInterest ? loan.outstandingInterest : 0;
    const totalPayment = principalAmount + interest;

    if (totalPayment <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    data.users[userIndex].totalLent -= principalAmount;
    data.globalState.totalLendingPool += principalAmount;
    data.globalState.totalInterestCollected += interest;

    loan.outstandingPrincipal -= principalAmount;
    if (payInterest) {
      loan.outstandingInterest = 0;
      loan.totalInterestPaid += interest;
    }

    if (loan.outstandingPrincipal <= 0) {
      loan.outstandingPrincipal = 0;
      loan.status = 'closed';
    }

    let description = `Partial repayment — ₹${fmt(principalAmount)} principal`;
    if (payInterest) {
      description += ` + ₹${fmt(interest)} outstanding interest`;
    }
    description += `. Remaining Principal: ₹${fmt(loan.outstandingPrincipal)}`;

    const transaction: Transaction = {
      id: uuidv4(),
      userId,
      loanId,
      type: 'repay_partial',
      amount: totalPayment,
      principalPaid: principalAmount,
      interestPaid: interest,
      date: new Date().toISOString(),
      description,
    };

    data.transactions.push(transaction);
    saveData(data);
    return transaction;
  },

  // ---- Repayment: Interest Only ----
  payInterestOnly: (userId: string, loanId: string): Transaction => {
    const data = getData();
    const userIndex = data.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');

    const loanIndex = data.loans.findIndex(l => l.id === loanId && l.userId === userId);
    if (loanIndex === -1) throw new Error('Loan not found');

    const loan = data.loans[loanIndex];
    if (loan.status === 'closed') throw new Error('Loan is already closed');

    const interest = loan.outstandingInterest;
    if (interest <= 0) throw new Error('No outstanding interest to pay');

    data.globalState.totalInterestCollected += interest;
    loan.totalInterestPaid += interest;
    loan.outstandingInterest = 0;

    const transaction: Transaction = {
      id: uuidv4(),
      userId,
      loanId,
      type: 'interest_only',
      amount: interest,
      interestPaid: interest,
      principalPaid: 0,
      date: new Date().toISOString(),
      description: `Interest-only payment of ₹${fmt(interest)} on ₹${fmt(loan.outstandingPrincipal)} outstanding (${loan.interestRatePercent}%)`,
    };

    data.transactions.push(transaction);
    saveData(data);
    return transaction;
  },

  // ---- Withdraw Shares ----
  withdrawShares: (userId: string, amount: number): Transaction => {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Invalid withdrawal amount');
    }
    const data = getData();
    const userIndex = data.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');

    const user = data.users[userIndex];
    const availableEquity = user.totalDeposited - user.totalWithdrawn - user.totalLent;
    if (amount > availableEquity) {
      throw new Error(`Cannot withdraw ₹${fmt(amount)}. Available equity: ₹${fmt(availableEquity)}`);
    }
    if (amount > data.globalState.totalLendingPool) {
      throw new Error(`Cannot withdraw ₹${fmt(amount)}. Total lending pool balance: ₹${fmt(data.globalState.totalLendingPool)}`);
    }

    user.totalWithdrawn += amount;
    data.globalState.totalLendingPool -= amount;

    const transaction: Transaction = {
      id: uuidv4(),
      userId,
      type: 'withdraw',
      amount,
      date: new Date().toISOString(),
      description: `Share withdrawal of ₹${fmt(amount)} by ${user.name}`,
    };

    data.transactions.push(transaction);
    saveData(data);
    return transaction;
  },

  // ---- Loans ----
  getLoans: (userId?: string, status?: 'active' | 'closed'): Loan[] => {
    const data = getData();
    let loans = data.loans;
    if (userId) loans = loans.filter(l => l.userId === userId);
    if (status) loans = loans.filter(l => l.status === status);
    return loans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getLoan: (loanId: string): Loan | undefined => {
    return getData().loans.find(l => l.id === loanId);
  },

  // ---- Transactions ----
  getTransactions: (userId?: string): Transaction[] => {
    const data = getData();
    let txs = data.transactions;
    if (userId) txs = txs.filter(t => t.userId === userId);
    return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  // ---- Interest Distribution ----
  getInterestSummary: (): { userId: string; name: string; sharePercent: number; projectedAmount: number }[] => {
    const data = getData();
    const totalShares = computeTotalShareDeposits(data);
    const undistributed = data.globalState.totalInterestCollected;

    if (totalShares <= 0) return [];

    return data.users
      .filter(u => u.memberType === 'share')
      .map(u => {
        const netShares = u.totalDeposited - u.totalWithdrawn;
        const sharePercent = totalShares > 0 ? (netShares / totalShares) * 100 : 0;
        return {
          userId: u.id,
          name: u.name,
          sharePercent,
          projectedAmount: undistributed * (sharePercent / 100),
        };
      })
      .sort((a, b) => b.sharePercent - a.sharePercent);
  },

  distributeInterest: (): Transaction[] => {
    const data = getData();
    const totalShares = computeTotalShareDeposits(data);
    const undistributed = data.globalState.totalInterestCollected;

    if (undistributed <= 0) throw new Error('No interest to distribute');
    if (totalShares <= 0) throw new Error('No share members with active deposits');

    const transactions: Transaction[] = [];
    const shareMembers = data.users.filter(u => u.memberType === 'share');

    for (const user of shareMembers) {
      const userIndex = data.users.findIndex(u => u.id === user.id);
      const netShares = user.totalDeposited - user.totalWithdrawn;
      const sharePercent = (netShares / totalShares) * 100;
      const distributionAmount = undistributed * (sharePercent / 100);

      if (distributionAmount <= 0) continue;

      data.users[userIndex].interestEarned += distributionAmount;

      const tx: Transaction = {
        id: uuidv4(),
        userId: user.id,
        type: 'interest_distribution',
        amount: distributionAmount,
        date: new Date().toISOString(),
        description: `Interest distribution — ₹${fmt(distributionAmount)} (${sharePercent.toFixed(1)}% share of ₹${fmt(undistributed)} pool)`,
      };
      transactions.push(tx);
      data.transactions.push(tx);
    }

    data.globalState.totalInterestDistributed += undistributed;
    data.globalState.totalInterestCollected = 0;

    saveData(data);
    return transactions;
  },

  // ---- Utility ----
  getTotalShareDeposits: (): number => {
    return computeTotalShareDeposits(getData());
  },

  resetAllData: (): void => {
    localStorage.removeItem(STORAGE_KEY);
    notify();
  },
};

export interface User {
  id: string;
  name: string;
  monthlyShareAmount: number;
  totalDeposited: number;
  totalLent: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'borrow' | 'repay';
  amount: number;
  date: string;
  interestPaid?: number;
  principalPaid?: number;
}

export interface GlobalState {
  totalLendingPool: number;
}

export interface AppData {
  users: User[];
  transactions: Transaction[];
  globalState: GlobalState;
}

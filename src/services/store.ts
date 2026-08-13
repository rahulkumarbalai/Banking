import { v4 as uuidv4 } from 'uuid';
import type { User, Transaction, GlobalState, AppData } from './types';

const STORAGE_KEY = 'banking_app_data';

const defaultData: AppData = {
  users: [],
  transactions: [],
  globalState: {
    totalLendingPool: 0,
  }
};

const getData = (): AppData => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : defaultData;
};

const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const api = {
  // Global State
  getGlobalState: (): GlobalState => {
    return getData().globalState;
  },
  
  updateLendingPool: (amountToAdd: number): GlobalState => {
    const data = getData();
    data.globalState.totalLendingPool += amountToAdd;
    saveData(data);
    return data.globalState;
  },

  // Users
  getUsers: (): User[] => {
    // Sort users by shares highest to lowest
    const users = getData().users;
    return users.sort((a, b) => b.totalDeposited - a.totalDeposited);
  },
  
  getUser: (id: string): User | undefined => {
    return getData().users.find(u => u.id === id);
  },

  addUser: (name: string, monthlyShareAmount: number): User => {
    const data = getData();
    const newUser: User = {
      id: uuidv4(),
      name,
      monthlyShareAmount,
      totalDeposited: 0,
      totalLent: 0,
    };
    data.users.push(newUser);
    saveData(data);
    return newUser;
  },

  // Transactions
  getTransactions: (userId?: string): Transaction[] => {
    const data = getData();
    if (userId) {
      return data.transactions.filter(t => t.userId === userId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return data.transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  depositShare: (userId: string, amount: number): Transaction => {
    const data = getData();
    const userIndex = data.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) throw new Error('User not found');
    
    data.users[userIndex].totalDeposited += amount;
    
    // Create transaction record
    const transaction: Transaction = {
      id: uuidv4(),
      userId,
      type: 'deposit',
      amount,
      date: new Date().toISOString()
    };
    
    data.transactions.push(transaction);
    saveData(data);
    return transaction;
  },

  borrowMoney: (userId: string, amount: number): Transaction => {
    const data = getData();
    
    if (data.globalState.totalLendingPool < amount) {
      throw new Error('Not enough funds in the global pool');
    }
    
    const userIndex = data.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');
    
    data.globalState.totalLendingPool -= amount;
    data.users[userIndex].totalLent += amount;
    
    const transaction: Transaction = {
      id: uuidv4(),
      userId,
      type: 'borrow',
      amount,
      date: new Date().toISOString()
    };
    
    data.transactions.push(transaction);
    saveData(data);
    return transaction;
  },

  repayLoan: (userId: string, principalAmount: number, interestAmount: number): Transaction => {
    const data = getData();
    const userIndex = data.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) throw new Error('User not found');
    if (data.users[userIndex].totalLent < principalAmount) {
      throw new Error('Principal payment exceeds borrowed amount');
    }
    
    data.users[userIndex].totalLent -= principalAmount;
    data.globalState.totalLendingPool += principalAmount; // Principal goes back to pool
    // Interest is collected but where does it go? Usually back to pool or a separate profit pool.
    // For simplicity, let's say interest adds to the total lending pool.
    data.globalState.totalLendingPool += interestAmount;
    
    const transaction: Transaction = {
      id: uuidv4(),
      userId,
      type: 'repay',
      amount: principalAmount + interestAmount,
      principalPaid: principalAmount,
      interestPaid: interestAmount,
      date: new Date().toISOString()
    };
    
    data.transactions.push(transaction);
    saveData(data);
    return transaction;
  }
};

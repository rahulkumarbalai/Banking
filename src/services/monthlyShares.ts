import type { Transaction, User } from './types';

export const getLocalMonthKey = (value: string | Date = new Date()): string | null => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const hasMonthlyShareDeposit = (
  transactions: Pick<Transaction, 'userId' | 'type' | 'date'>[],
  userId: string,
  month: string | Date = new Date(),
): boolean => {
  const monthKey = getLocalMonthKey(month);
  if (!monthKey) return false;

  return transactions.some(
    (transaction) =>
      transaction.userId === userId &&
      transaction.type === 'deposit' &&
      getLocalMonthKey(transaction.date) === monthKey,
  );
};

export const getPendingShareMembers = <T extends Pick<User, 'id' | 'memberType'>>(
  users: T[],
  transactions: Pick<Transaction, 'userId' | 'type' | 'date'>[],
  month: string | Date = new Date(),
): T[] => users.filter(
  (user) => user.memberType === 'share' && !hasMonthlyShareDeposit(transactions, user.id, month),
);

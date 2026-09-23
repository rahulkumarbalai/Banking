import type { User } from './types';

/**
 * Ownership is based on the monthly share amount selected at member creation.
 * Payments and withdrawals affect fund balances, but never this percentage.
 */
export const getTotalMonthlyShareValue = (users: User[]): number =>
  users
    .filter((user) => user.memberType === 'share')
    .reduce((total, user) => {
      const monthlyShare = Number.isFinite(user.monthlyShareAmount)
        ? Math.max(user.monthlyShareAmount, 0)
        : 0;
      return total + monthlyShare;
    }, 0);

export const getFixedSharePercent = (user: User, users: User[]): number => {
  if (user.memberType !== 'share' || !Number.isFinite(user.monthlyShareAmount)) return 0;

  const totalMonthlyShareValue = getTotalMonthlyShareValue(users);
  if (totalMonthlyShareValue <= 0) return 0;

  return (Math.max(user.monthlyShareAmount, 0) / totalMonthlyShareValue) * 100;
};

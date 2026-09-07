import React, { useEffect, useState } from 'react';
import { api, store } from '../services/store';
import type { GlobalState, Transaction, User } from '../services/types';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DescriptionIcon from '@mui/icons-material/Description';
import GroupsIcon from '@mui/icons-material/Groups';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import PaymentsIcon from '@mui/icons-material/Payments';
import PercentIcon from '@mui/icons-material/Percent';
import StarIcon from '@mui/icons-material/Star';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [globalState, setGlobalState] = useState<GlobalState>({
    totalLendingPool: 0,
    totalInterestCollected: 0,
    totalInterestDistributed: 0,
    defaultInterestRatePercent: 3,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = () => {
      setGlobalState(api.getGlobalState());
      setTransactions(api.getTransactions().slice(0, 7));
      setUsers(api.getUsers());
    };
    fetchData();
    const unsubscribe = store.subscribe(fetchData);
    return () => unsubscribe();
  }, []);

  const shareMembers = users.filter((u) => u.memberType === 'share');
  const borrowerMembers = users.filter((u) => u.memberType === 'borrower');
  const topShareMembers = [...shareMembers]
    .sort((a, b) => (b.totalDeposited - b.totalWithdrawn) - (a.totalDeposited - a.totalWithdrawn))
    .slice(0, 5);
  const totalShareDeposits = shareMembers.reduce((s, u) => s + u.totalDeposited - u.totalWithdrawn, 0);
  const totalLentOut = users.reduce((s, u) => s + u.totalLent, 0);
  const activeLoans = api.getLoans(undefined, 'active');

  const getTxDetails = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return { icon: <ArrowDownwardIcon className="w-4 h-4 text-emerald-400" />, bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', sign: '+' };
      case 'borrow':
        return { icon: <ArrowUpwardIcon className="w-4 h-4 text-amber-400" />, bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400', sign: '-' };
      case 'repay_full':
      case 'repay_partial':
        return { icon: <PaymentsIcon className="w-4 h-4 text-blue-400" />, bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400', sign: '+' };
      case 'interest_only':
        return { icon: <PercentIcon className="w-4 h-4 text-purple-400" />, bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400', sign: '+' };
      case 'withdraw':
        return { icon: <ArrowUpwardIcon className="w-4 h-4 text-rose-400" />, bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400', sign: '-' };
      case 'interest_distribution':
        return { icon: <StarIcon className="w-4 h-4 text-yellow-400" />, bg: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400', sign: '+' };
      default:
        return { icon: <PaymentsIcon className="w-4 h-4 text-slate-400" />, bg: 'bg-slate-500/10 border-slate-500/20 text-slate-400', sign: '' };
    }
  };

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto">
      {/* Hero / Quick Header Banner */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Cooperative Financial Vault
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time liquidity, interest distribution pool & member equity metrics.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/add-user')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
          >
            <PersonAddIcon className="w-4 h-4" />
            <span>Add Member</span>
          </button>
          <button
            onClick={() => navigate('/users')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl glass-panel text-slate-800 dark:text-slate-200 hover:text-blue-400 font-medium text-xs sm:text-sm transition-all duration-200"
          >
            <GroupsIcon className="w-4 h-4" />
            <span>View All</span>
          </button>
        </div>
      </section>

      {/* METRICS STATS GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat 1: Available Lending Pool */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card rounded-3xl p-6 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Lending Pool
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <AccountBalanceWalletIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
              ₹{fmt(globalState.totalLendingPool)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-2">
              <span>Shares: ₹{fmt(totalShareDeposits)}</span>
              <span>•</span>
              <span className="text-amber-400">Lent: ₹{fmt(totalLentOut)}</span>
            </div>
          </div>
        </motion.div>

        {/* Stat 2: Undistributed Interest Pool */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-6 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Interest Pool
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUpIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 glow-emerald">
              ₹{fmt(globalState.totalInterestCollected)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Distributed: ₹{fmt(globalState.totalInterestDistributed)}
            </div>
          </div>
        </motion.div>

        {/* Stat 3: Active Loans */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-3xl p-6 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Loans
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <DescriptionIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
              {activeLoans.length}
            </div>
            <div className="text-[11px] text-amber-400 font-mono mt-1">
              Total Principal: ₹{fmt(totalLentOut)}
            </div>
          </div>
        </motion.div>

        {/* Stat 4: Members Count */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-3xl p-6 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Members
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <GroupsIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                {users.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {shareMembers.length} Share • {borrowerMembers.length} Borrower
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* MAIN TWO-COLUMN CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions Feed */}
        <section className="lg:col-span-2 glass-panel rounded-3xl p-6 md:p-7 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/30 dark:border-white/10">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Recent Audit Activity
              </h3>
              <p className="text-xs text-slate-400">Real-time ledger entries and logs</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live System
            </span>
          </div>

          <div className="space-y-3.5">
            <AnimatePresence>
              {transactions.map((t, index) => {
                const user = users.find((u) => u.id === t.userId);
                const txStyle = getTxDetails(t.type);
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    key={t.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${txStyle.bg}`}
                      >
                        {txStyle.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">
                          {t.type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <span className="font-medium text-slate-300">{user?.name || 'Member'}</span>
                          <span>•</span>
                          <span>{t.description || new Date(t.date).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-mono text-sm font-bold ${
                          txStyle.sign === '+' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {txStyle.sign}₹{fmt(t.amount)}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {new Date(t.date).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {transactions.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                No recent transaction logs.
              </div>
            )}
          </div>
        </section>

        {/* Top Shareholders / Equity Distribution */}
        <section className="glass-panel rounded-3xl p-6 md:p-7 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/30 dark:border-white/10">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Top Share Members
                </h3>
                <p className="text-xs text-slate-400">Equity distribution & share hold</p>
              </div>
              <Link
                to="/users"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-0.5 transition-colors"
              >
                <span>View All</span>
                <ChevronRightIcon className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4 mt-5">
              {topShareMembers.map((user, i) => {
                const netEquity = user.totalDeposited - user.totalWithdrawn;
                const sharePercent =
                  totalShareDeposits > 0 && user.memberType === 'share'
                    ? (netEquity / totalShareDeposits) * 100
                    : 0;

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    key={user.id}
                    onClick={() => navigate(`/users/${user.id}`)}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          user.memberType === 'share'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-400 transition-colors">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {user.memberType === 'share' ? 'Share Member' : 'Loan Borrower'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {user.memberType === 'share' ? (
                        <div>
                          <p className="text-xs font-mono font-bold text-blue-400">
                            {sharePercent.toFixed(1)}%
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            ₹{fmt(netEquity)}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-mono font-bold text-amber-400">
                            Owes ₹{fmt(user.totalLent)}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {shareMembers.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm">
                  No share members added yet.
                </div>
              )}
            </div>
          </div>

          {/* Quick Notice Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-500/20 text-xs text-blue-300">
            <p className="font-semibold text-blue-200">Year-End Distribution Rule:</p>
            <p className="mt-1 text-slate-300 leading-relaxed text-[11px]">
              Loan interest pool is distributed proportionally to share members based on equity % at end of period.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

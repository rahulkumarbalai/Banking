import { useLanguage } from '../i18n/LanguageContext';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, store } from '../services/store';
import type { Transaction, User } from '../services/types';
import { buildMemberLedgerRows, createMemberLedgerWorkbook } from '../services/memberLedgerExport';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import PaymentsIcon from '@mui/icons-material/Payments';
import PercentIcon from '@mui/icons-material/Percent';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import StarIcon from '@mui/icons-material/Star';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import CategoryIcon from '@mui/icons-material/Category';


export const Transactions: React.FC = () => {
  const { tr, fmt, formatDate, language, describeTransaction } = useLanguage();
  const navigate = useNavigate();
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // format: 'YYYY-MM' or 'all'
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'amount_desc'>('newest');
  const [isExporting, setIsExporting] = useState(false);

  const loadData = () => {
    setAllTransactions(api.getTransactions());
    setUsers(api.getUsers());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = store.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  // Extract list of unique months from transaction dates
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    allTransactions.forEach((t) => {
      if (t.date) {
        try {
          const monthKey = format(parseISO(t.date), 'yyyy-MM');
          monthsSet.add(monthKey);
        } catch {
          // ignore invalid date
        }
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [allTransactions]);

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return allTransactions
      .filter((t) => {
        // User Search / Name Search
        const user = users.find((u) => u.id === t.userId);
        const userName = user?.name.toLowerCase() || '';
        const desc = `${t.description || ''} ${describeTransaction(t.description || '')}`.toLowerCase();
        const searchLower = search.toLowerCase();
        const matchesSearch = userName.includes(searchLower) || desc.includes(searchLower) || t.id.includes(searchLower);

        // User Dropdown Filter
        const matchesUser = selectedUser === 'all' || t.userId === selectedUser;

        // Transaction Type Filter
        const matchesType = selectedType === 'all' || t.type === selectedType;

        // Month Filter
        let matchesMonth = true;
        if (selectedMonth !== 'all' && t.date) {
          try {
            const txMonthKey = format(parseISO(t.date), 'yyyy-MM');
            matchesMonth = txMonthKey === selectedMonth;
          } catch {
            matchesMonth = false;
          }
        }

        return matchesSearch && matchesUser && matchesType && matchesMonth;
      })
      .sort((a, b) => {
        if (sortOrder === 'oldest') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortOrder === 'amount_desc') {
          return b.amount - a.amount;
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [allTransactions, users, search, selectedUser, selectedType, selectedMonth, sortOrder, describeTransaction]);

  // Calculated Metrics for Filtered Set
  const filteredSummary = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    let interestCollected = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === 'deposit' || t.type === 'repay_full' || t.type === 'repay_partial' || t.type === 'interest_only') {
        inflow += t.amount;
      }
      if (t.type === 'borrow' || t.type === 'withdraw') {
        outflow += t.amount;
      }
      if (t.interestPaid) {
        interestCollected += t.interestPaid;
      }
    });

    return {
      totalCount: filteredTransactions.length,
      inflow,
      outflow,
      netFlow: inflow - outflow,
      interestCollected,
    };
  }, [filteredTransactions]);

  const getTxBadge = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return { label: tr("Share Deposit"), bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <ArrowDownwardIcon className="w-4 h-4" /> };
      case 'borrow':
        return { label: tr("Loan Disbursed"), bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: <ArrowUpwardIcon className="w-4 h-4" /> };
      case 'repay_full':
        return { label: tr("Full Repayment"), bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: <PaymentsIcon className="w-4 h-4" /> };
      case 'repay_partial':
        return { label: tr("Partial Repayment"), bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: <PaymentsIcon className="w-4 h-4" /> };
      case 'interest_only':
        return { label: tr("Interest Only"), bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: <PercentIcon className="w-4 h-4" /> };
      case 'withdraw':
        return { label: tr("Share Withdrawal"), bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <CallReceivedIcon className="w-4 h-4" /> };
      case 'interest_distribution':
        return { label: tr("Interest Distribution"), bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: <StarIcon className="w-4 h-4" /> };
      default:
        return { label: type, bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: <AccountBalanceIcon className="w-4 h-4" /> };
    }
  };

  const exportUsers = selectedUser === 'all' ? users : users.filter((user) => user.id === selectedUser);

  const handleExportExcel = async () => {
    if (exportUsers.length === 0 || isExporting) return;

    setIsExporting(true);
    try {
      const monthKey = selectedMonth === 'all' ? format(new Date(), 'yyyy-MM') : selectedMonth;
      const rows = buildMemberLedgerRows({
        users: exportUsers,
        loans: api.getLoans(),
        transactions: allTransactions,
        monthKey,
      });
      const workbook = await createMemberLedgerWorkbook(rows, monthKey, language);
      const downloadUrl = URL.createObjectURL(workbook);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `patil_bank_member_ledger_${monthKey}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch {
      alert(tr("Could not export Excel file"));
    } finally {
      setIsExporting(false);
    }
  };

  const resetAllFilters = () => {
    setSearch('');
    setSelectedUser('all');
    setSelectedType('all');
    setSelectedMonth('all');
    setSortOrder('newest');
  };

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">{tr("Fund Audit Ledger")}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{tr("Complete transaction history with multi-criteria filtering, monthly aggregation & export tools.")}</p>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={exportUsers.length === 0 || isExporting}
          className={`flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all ${
            exportUsers.length > 0 && !isExporting
              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25'
              : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
          }`}
        >
          <DownloadIcon className="w-4 h-4" />
          <span>{isExporting ? tr("Preparing Excel...") : tr("Export Excel ({count})", { count: exportUsers.length })}</span>
        </button>
      </div>

      {/* FILTERED SUMMARY STATS CARDS */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{tr("Filtered Entries")}</p>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
            {filteredSummary.totalCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{tr("out of {count} total logs", { count: allTransactions.length })}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-3xl p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{tr("Total Inflow")}</p>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 mt-1">
            ₹{fmt(filteredSummary.inflow)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{tr("Deposits & Repayments")}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-3xl p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{tr("Total Outflow")}</p>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-400 mt-1">
            ₹{fmt(filteredSummary.outflow)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{tr("Loans & Withdrawals")}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-3xl p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{tr("Interest Collected")}</p>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-400 mt-1">
            ₹{fmt(filteredSummary.interestCollected)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{tr("in selected range")}</p>
        </motion.div>
      </section>

      {/* FILTER TOOLBAR */}
      <section className="glass-panel rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/30 dark:border-white/10">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base">
            <FilterListIcon className="w-5 h-5 text-blue-400" />
            <span>{tr("Ledger Filters & Controls")}</span>
          </div>

          {(search || selectedUser !== 'all' || selectedType !== 'all' || selectedMonth !== 'all' || sortOrder !== 'newest') && (
            <button
              onClick={resetAllFilters}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1 transition-colors"
            >
              <RestartAltIcon className="w-4 h-4" />
              <span>{tr("Reset Filters")}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. User / Description Search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <SearchIcon className="w-3.5 h-3.5" />{tr("Search Query")}</label>
            <div className="relative">
              <input
                type="text"
                placeholder={tr("Search member, description...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs"
              />
            </div>
          </div>

          {/* 2. Monthly Filter Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <CalendarMonthIcon className="w-3.5 h-3.5 text-indigo-400" />{tr("Filter by Month")}</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs"
            >
              <option value="all" className="bg-slate-900 text-white">{tr("All Months")}</option>
              {availableMonths.map((m) => {
                let monthLabel = m;
                try {
                  monthLabel = formatDate(parseISO(`${m}-01`), { month: 'long', year: 'numeric' });
                } catch {
                  // fallback
                }
                return (
                  <option key={m} value={m} className="bg-slate-900 text-white">
                    {monthLabel}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 3. Member Filter Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <PersonIcon className="w-3.5 h-3.5 text-emerald-400" />{tr("Filter by Member")}</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs"
            >
              <option value="all" className="bg-slate-900 text-white">{tr("All Members ({count})", { count: users.length })}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                  {u.name} ({u.memberType === 'share' ? tr("Share") : tr("Borrower")})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Action Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <CategoryIcon className="w-3.5 h-3.5 text-amber-400" />{tr("Action Type")}</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs"
            >
              <option value="all" className="bg-slate-900 text-white">{tr("All Action Types")}</option>
              <option value="deposit" className="bg-slate-900 text-white">{tr("Share Deposit")}</option>
              <option value="borrow" className="bg-slate-900 text-white">{tr("Loan Disbursed")}</option>
              <option value="repay_full" className="bg-slate-900 text-white">{tr("Full Repayment")}</option>
              <option value="repay_partial" className="bg-slate-900 text-white">{tr("Partial Repayment")}</option>
              <option value="interest_only" className="bg-slate-900 text-white">{tr("Interest Only Payment")}</option>
              <option value="withdraw" className="bg-slate-900 text-white">{tr("Share Withdrawal")}</option>
              <option value="interest_distribution" className="bg-slate-900 text-white">{tr("Interest Distribution")}</option>
            </select>
          </div>
        </div>

        {/* Sort Bar */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
          <span>{tr("Showing {count} transaction logs", { count: filteredTransactions.length })}</span>
          <div className="flex items-center space-x-2">
            <span>{tr("Sort by:")}</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-transparent border border-white/10 text-slate-200 rounded-xl px-2.5 py-1 text-xs focus:outline-none"
            >
              <option value="newest" className="bg-slate-900 text-white">{tr("Newest First")}</option>
              <option value="oldest" className="bg-slate-900 text-white">{tr("Oldest First")}</option>
              <option value="amount_desc" className="bg-slate-900 text-white">{tr("Highest Amount")}</option>
            </select>
          </div>
        </div>
      </section>

      {/* TRANSACTIONS TABLE / CARDS */}
      <section className="glass-panel rounded-3xl p-6 space-y-4">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">{tr("Date & Time")}</th>
                <th className="py-3 px-3">{tr("Member")}</th>
                <th className="py-3 px-3">{tr("Action Type")}</th>
                <th className="py-3 px-3">{tr("Description")}</th>
                <th className="py-3 px-3 text-right">{tr("Principal / Interest")}</th>
                <th className="py-3 px-3 text-right">{tr("Amount")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              <AnimatePresence>
                {filteredTransactions.map((t, i) => {
                  const user = users.find((u) => u.id === t.userId);
                  const badge = getTxBadge(t.type);
                  const isNegative = t.type === 'borrow' || t.type === 'withdraw';

                  return (
                    <motion.tr
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      key={t.id}
                      className="hover:bg-white/5 transition-colors font-sans"
                    >
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-400">
                        {t.date ? formatDate(t.date, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : tr("N/A")}
                      </td>
                      <td className="py-3.5 px-3">
                        <button
                          onClick={() => navigate(`/users/${t.userId}`)}
                          className="font-bold text-slate-200 hover:text-blue-400 transition-colors flex items-center space-x-2"
                        >
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-[10px] font-bold">
                            {user?.name.charAt(0) || 'U'}
                          </div>
                          <span>{user?.name || tr("Unknown Member")}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center w-fit space-x-1.5 border ${badge.bg}`}>
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300 max-w-xs truncate text-xs">
                        {describeTransaction(t.description)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-[11px] text-slate-400">
                        {t.principalPaid !== undefined || t.interestPaid !== undefined ? (
                          <div>
                            {t.principalPaid ? <span className="text-slate-300">{tr("P: ₹")}{fmt(t.principalPaid)}</span> : null}
                            {t.interestPaid ? <span className="text-purple-400 ml-1">{tr("I: ₹")}{fmt(t.interestPaid)}</span> : null}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-sm font-bold">
                        <span className={isNegative ? 'text-rose-400' : 'text-emerald-400'}>
                          {isNegative ? '-' : '+'}₹{fmt(t.amount)}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden space-y-3">
          {filteredTransactions.map((t) => {
            const user = users.find((u) => u.id === t.userId);
            const badge = getTxBadge(t.type);
            const isNegative = t.type === 'borrow' || t.type === 'withdraw';

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => navigate(`/users/${t.userId}`)}
                className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center space-x-1 ${badge.bg}`}>
                    {badge.icon}
                    <span>{badge.label}</span>
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    {t.date ? formatDate(t.date, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-slate-100">{user?.name || tr("Unknown")}</p>
                    <p className="text-xs text-slate-400">{describeTransaction(t.description)}</p>
                  </div>
                  <p className={`font-mono text-base font-bold ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {isNegative ? '-' : '+'}₹{fmt(t.amount)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <FilterListIcon className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-base font-medium">{tr("No transactions match your active filters.")}</p>
            <button
              onClick={resetAllFilters}
              className="text-xs text-blue-400 hover:underline font-semibold"
            >{tr("Clear all filters")}</button>
          </div>
        )}
      </section>
    </div>
  );
};

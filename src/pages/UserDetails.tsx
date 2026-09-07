import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, store } from '../services/store';
import type { User, Transaction, Loan } from '../services/types';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PaymentIcon from '@mui/icons-material/Payment';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import PaymentsIcon from '@mui/icons-material/Payments';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import PercentIcon from '@mui/icons-material/Percent';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import StarIcon from '@mui/icons-material/Star';
import PhoneIcon from '@mui/icons-material/Phone';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import InfoIcon from '@mui/icons-material/Info';

const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const UserDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [allLoans, setAllLoans] = useState<Loan[]>([]);

  // Dialog states
  const [openShare, setOpenShare] = useState(false);
  const [openBorrow, setOpenBorrow] = useState(false);
  const [repayLoan, setRepayLoan] = useState<Loan | null>(null);
  const [repayMode, setRepayMode] = useState<'full' | 'partial' | 'interest'>('full');

  // Form states
  const [borrowAmount, setBorrowAmount] = useState('');
  const [borrowRate, setBorrowRate] = useState('');
  const [partialAmount, setPartialAmount] = useState('');

  const loadData = useCallback(() => {
    if (id) {
      const u = api.getUser(id);
      if (u) {
        setUser(u);
        setTransactions(api.getTransactions(id));
        setActiveLoans(api.getLoans(id, 'active'));
        setAllLoans(api.getLoans(id));
      } else {
        navigate('/users');
      }
    }
  }, [id, navigate]);

  useEffect(() => {
    loadData();
    const gs = api.getGlobalState();
    setBorrowRate(String(gs.defaultInterestRatePercent));

    const unsubscribe = store.subscribe(loadData);
    return () => unsubscribe();
  }, [loadData]);

  if (!user) return null;

  const netEquity = user.totalDeposited - user.totalWithdrawn;
  const totalShareDeposits = api.getTotalShareDeposits();
  const sharePercent = totalShareDeposits > 0 ? (netEquity / totalShareDeposits) * 100 : 0;
  const isShareMember = user.memberType === 'share';

  const handleDepositShare = () => {
    api.depositShare(user.id, user.monthlyShareAmount);
    setOpenShare(false);
    loadData();
  };

  const handleBorrow = () => {
    const val = parseFloat(borrowAmount);
    const rate = parseFloat(borrowRate);
    if (!Number.isFinite(val) || val <= 0 || !Number.isFinite(rate) || rate < 0) {
      alert('Please enter a valid loan amount and interest rate');
      return;
    }
    try {
      api.borrowMoney(user.id, val, rate);
      setOpenBorrow(false);
      setBorrowAmount('');
      loadData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleRepay = () => {
    if (!repayLoan) return;
    try {
      if (repayMode === 'full') {
        api.repayFull(user.id, repayLoan.id);
      } else if (repayMode === 'partial') {
        const val = parseFloat(partialAmount);
        if (!Number.isFinite(val) || val <= 0 || val > repayLoan.outstandingPrincipal) {
          alert('Enter a valid amount');
          return;
        }
        api.repayPartial(user.id, repayLoan.id, val);
      } else {
        api.payInterestOnly(user.id, repayLoan.id);
      }
      setRepayLoan(null);
      setPartialAmount('');
      loadData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const openRepayDialog = (loan: Loan, mode: 'full' | 'partial' | 'interest') => {
    setRepayLoan(loan);
    setRepayMode(mode);
    setPartialAmount('');
  };

  const getTxBadge = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return { label: 'Share Deposit', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <ArrowDownwardIcon className="w-4 h-4" /> };
      case 'borrow':
        return { label: 'Loan Disbursed', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: <ArrowUpwardIcon className="w-4 h-4" /> };
      case 'repay_full':
        return { label: 'Full Loan Repayment', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: <PaymentsIcon className="w-4 h-4" /> };
      case 'repay_partial':
        return { label: 'Partial Loan Repayment', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: <PaymentsIcon className="w-4 h-4" /> };
      case 'interest_only':
        return { label: 'Interest Only Paid', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: <PercentIcon className="w-4 h-4" /> };
      case 'withdraw':
        return { label: 'Share Withdrawal', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <CallReceivedIcon className="w-4 h-4" /> };
      case 'interest_distribution':
        return { label: 'Interest Distribution', bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: <StarIcon className="w-4 h-4" /> };
      default:
        return { label: type, bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: <AccountBalanceIcon className="w-4 h-4" /> };
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/users')}
        className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowBackIcon className="w-4 h-4" />
        <span>Back to Members Directory</span>
      </button>

      {/* Member Header Card */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center text-2xl font-extrabold shadow-xl ${
              isShareMember
                ? 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 text-white shadow-blue-500/20'
                : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/20'
            }`}
          >
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {user.name}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isShareMember
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {isShareMember ? 'Share Member' : 'Loan Borrower'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
              {user.mobile && (
                <span className="flex items-center space-x-1.5">
                  <PhoneIcon className="w-4 h-4 text-slate-400" />
                  <span>{user.mobile}</span>
                </span>
              )}
              {isShareMember && (
                <span>Monthly Share Commitment: <strong className="font-mono text-slate-200">₹{user.monthlyShareAmount.toLocaleString()}</strong></span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {isShareMember && (
            <button
              onClick={() => setOpenShare(true)}
              className="flex-1 md:flex-none px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <PaymentIcon className="w-4 h-4" />
              <span>Deposit Monthly Share</span>
            </button>
          )}
          <button
            onClick={() => setOpenBorrow(true)}
            className="flex-1 md:flex-none px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <RequestQuoteIcon className="w-4 h-4" />
            <span>Issue Loan</span>
          </button>
        </div>
      </motion.div>

      {/* Member Financial Metric Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {isShareMember && (
          <>
            <div className="glass-card rounded-3xl p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Deposited</p>
              <p className="text-xl sm:text-2xl font-extrabold font-mono text-blue-400 mt-2">₹{fmt(user.totalDeposited)}</p>
            </div>
            <div className="glass-card rounded-3xl p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Share Equity</p>
              <p className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-400 mt-2">₹{fmt(netEquity)}</p>
            </div>
            <div className="glass-card rounded-3xl p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Share Equity %</p>
              <p className="text-xl sm:text-2xl font-extrabold font-mono text-indigo-400 mt-2">{sharePercent.toFixed(1)}%</p>
            </div>
            <div className="glass-card rounded-3xl p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Interest Received</p>
              <p className="text-xl sm:text-2xl font-extrabold font-mono text-yellow-400 mt-2">₹{fmt(user.interestEarned)}</p>
            </div>
          </>
        )}

        <div className={`glass-card rounded-3xl p-5 ${!isShareMember ? 'col-span-2' : ''}`}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Loan Principal</p>
          <p className="text-xl sm:text-2xl font-extrabold font-mono text-rose-400 mt-2">₹{fmt(user.totalLent)}</p>
          <p className="text-[11px] text-slate-500 mt-1">{activeLoans.length} active loan issue(s)</p>
        </div>

        {!isShareMember && (
          <div className="glass-card rounded-3xl p-5 col-span-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Interest Paid</p>
            <p className="text-xl sm:text-2xl font-extrabold font-mono text-amber-400 mt-2">
              ₹{fmt(allLoans.reduce((s, l) => s + l.totalInterestPaid, 0))}
            </p>
          </div>
        )}
      </section>

      {/* Active Loans Section */}
      {activeLoans.length > 0 && (
        <section className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/30 dark:border-white/10">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Loan Outstanding</h3>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {activeLoans.length} Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-2">Issue Date</th>
                  <th className="py-3 px-2">Original Principal</th>
                  <th className="py-3 px-2">Outstanding Principal</th>
                  <th className="py-3 px-2">Interest Rate</th>
                  <th className="py-3 px-2">Interest Paid</th>
                  <th className="py-3 px-2 text-right">Repayment Options</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {activeLoans.map((loan) => {
                  const interestDue = loan.outstandingPrincipal * (loan.interestRatePercent / 100);
                  return (
                    <tr key={loan.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-2 text-slate-300">
                        {new Date(loan.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 text-slate-300">₹{fmt(loan.principalAmount)}</td>
                      <td className="py-3 px-2 font-bold text-rose-400">₹{fmt(loan.outstandingPrincipal)}</td>
                      <td className="py-3 px-2 text-indigo-400">{loan.interestRatePercent}%</td>
                      <td className="py-3 px-2 text-emerald-400">₹{fmt(loan.totalInterestPaid)}</td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end space-x-1.5 font-sans">
                          <button
                            onClick={() => openRepayDialog(loan, 'full')}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px]"
                          >
                            Full (₹{fmt(loan.outstandingPrincipal + interestDue)})
                          </button>
                          <button
                            onClick={() => openRepayDialog(loan, 'partial')}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-[11px]"
                          >
                            Partial
                          </button>
                          <button
                            onClick={() => openRepayDialog(loan, 'interest')}
                            className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-semibold text-[11px]"
                          >
                            Interest (₹{fmt(interestDue)})
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Member Transaction Ledger Timeline */}
      <section className="glass-panel rounded-3xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-700/30 dark:border-white/10">
          Member Transaction Timeline
        </h3>

        <div className="space-y-3">
          {transactions.map((t) => {
            const badge = getTxBadge(t.type);
            const isNegative = t.type === 'borrow' || t.type === 'withdraw';
            return (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${badge.bg}`}>
                    {badge.icon}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{badge.label}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`font-mono text-sm font-bold ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {isNegative ? '-' : '+'}₹{fmt(t.amount)}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {formatDistanceToNow(new Date(t.date), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
          {transactions.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              No transactions recorded for this member yet.
            </div>
          )}
        </div>
      </section>

      {/* ======== MODALS ======== */}

      {/* Deposit Monthly Share Modal */}
      {openShare && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center">
          <div className="glass-panel rounded-3xl p-6 max-w-md w-full space-y-4 border border-white/20">
            <h3 className="text-lg font-bold text-white">Deposit Monthly Share Capital</h3>
            <p className="text-xs text-slate-300">
              Deposit recurring share amount of <strong className="font-mono text-blue-400">₹{user.monthlyShareAmount.toLocaleString()}</strong> for {user.name}?
            </p>
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start space-x-2">
              <InfoIcon className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
              <span>This deposit increases member share equity and adds liquidity to the lending pool.</span>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
              <button onClick={() => setOpenShare(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white">
                Cancel
              </button>
              <button onClick={handleDepositShare} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20">
                Confirm Share Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Borrow Funds Modal */}
      {openBorrow && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center">
          <div className="glass-panel rounded-3xl p-6 max-w-md w-full space-y-4 border border-white/20">
            <h3 className="text-lg font-bold text-white">Issue Loan to {user.name}</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Principal Amount (₹)</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl glass-input font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Interest Rate (%)</label>
              <input
                type="number"
                placeholder="3"
                value={borrowRate}
                onChange={(e) => setBorrowRate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl glass-input font-mono text-sm"
              />
              <p className="text-[10px] text-slate-400 mt-1">Default rate: {api.getGlobalState().defaultInterestRatePercent}%</p>
            </div>

            {borrowAmount && parseFloat(borrowAmount) > 0 && borrowRate && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                Projected Interest: <strong className="font-mono text-emerald-400">₹{fmt(parseFloat(borrowAmount) * (parseFloat(borrowRate) / 100))}</strong> ({borrowRate}%)
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
              <button onClick={() => setOpenBorrow(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white">
                Cancel
              </button>
              <button onClick={handleBorrow} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20">
                Disburse Loan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repay Loan Modal */}
      {repayLoan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center">
          <div className="glass-panel rounded-3xl p-6 max-w-md w-full space-y-4 border border-white/20">
            <h3 className="text-lg font-bold text-white">
              {repayMode === 'full' ? 'Full Loan Repayment' : repayMode === 'partial' ? 'Partial Principal Repayment' : 'Interest Only Payment'}
            </h3>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1 font-mono text-xs text-slate-300">
              <p>Outstanding Principal: <strong className="text-rose-400">₹{fmt(repayLoan.outstandingPrincipal)}</strong></p>
              <p>Interest Rate: <strong className="text-indigo-400">{repayLoan.interestRatePercent}%</strong></p>
              <p>Interest Due: <strong className="text-purple-400">₹{fmt(repayLoan.outstandingPrincipal * (repayLoan.interestRatePercent / 100))}</strong></p>
            </div>

            {repayMode === 'full' && (
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                Total Payment: <strong className="font-mono text-emerald-400">₹{fmt(repayLoan.outstandingPrincipal + repayLoan.outstandingPrincipal * (repayLoan.interestRatePercent / 100))}</strong>
                <p className="text-[10px] text-slate-400 mt-1">(₹{fmt(repayLoan.outstandingPrincipal)} Principal + ₹{fmt(repayLoan.outstandingPrincipal * (repayLoan.interestRatePercent / 100))} Interest)</p>
              </div>
            )}

            {repayMode === 'partial' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Principal Amount to Repay (₹)</label>
                <input
                  type="number"
                  placeholder={`Max ₹${fmt(repayLoan.outstandingPrincipal)}`}
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-input font-mono text-sm"
                />
                {partialAmount && parseFloat(partialAmount) > 0 && (
                  <p className="text-[11px] font-mono text-emerald-400 mt-1.5">
                    Total: ₹{fmt(parseFloat(partialAmount) + parseFloat(partialAmount) * (repayLoan.interestRatePercent / 100))} (₹{fmt(parseFloat(partialAmount))} + ₹{fmt(parseFloat(partialAmount) * (repayLoan.interestRatePercent / 100))} Interest)
                  </p>
                )}
              </div>
            )}

            {repayMode === 'interest' && (
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                Interest Payment: <strong className="font-mono text-purple-300">₹{fmt(repayLoan.outstandingPrincipal * (repayLoan.interestRatePercent / 100))}</strong>
                <p className="text-[10px] text-slate-400 mt-1">Principal remains unchanged at ₹{fmt(repayLoan.outstandingPrincipal)}.</p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
              <button onClick={() => setRepayLoan(null)} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white">
                Cancel
              </button>
              <button onClick={handleRepay} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20">
                {repayMode === 'full' ? 'Repay Full Amount' : repayMode === 'partial' ? 'Repay Partial Principal' : 'Pay Interest Only'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

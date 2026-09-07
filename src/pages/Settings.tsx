import React, { useState, useEffect } from 'react';
import { api, store } from '../services/store';
import type { GlobalState } from '../services/types';
import { motion } from 'framer-motion';
import PercentIcon from '@mui/icons-material/Percent';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SavingsIcon from '@mui/icons-material/Savings';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const Settings: React.FC = () => {
  const [globalState, setGlobalState] = useState<GlobalState | null>(null);
  const [interestRate, setInterestRate] = useState('');
  const [rateSaved, setRateSaved] = useState(false);
  const [showDistribute, setShowDistribute] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [distributed, setDistributed] = useState(false);

  const loadData = () => {
    const gs = api.getGlobalState();
    setGlobalState(gs);
    setInterestRate(String(gs.defaultInterestRatePercent));
  };

  useEffect(() => {
    loadData();
    const unsubscribe = store.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  if (!globalState) return null;

  const users = api.getUsers();
  const totalDeposits = users
    .filter((u) => u.memberType === 'share')
    .reduce((s, u) => s + u.totalDeposited - u.totalWithdrawn, 0);
  const totalLentOut = users.reduce((s, u) => s + u.totalLent, 0);
  const summary = api.getInterestSummary();

  const handleSaveRate = () => {
    const rate = parseFloat(interestRate);
    if (!isNaN(rate) && rate >= 0) {
      api.setDefaultInterestRate(rate);
      setRateSaved(true);
      setTimeout(() => setRateSaved(false), 2500);
      loadData();
    }
  };

  const handleDistribute = () => {
    try {
      api.distributeInterest();
      setShowDistribute(false);
      setDistributed(true);
      setTimeout(() => setDistributed(false), 4000);
      loadData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleReset = () => {
    api.resetAllData();
    setShowReset(false);
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          System Settings & Vault Control
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure default loan interest rate, manage fund distribution & system reset.
        </p>
      </div>

      {/* 1. Default Interest Rate Settings */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-3xl p-6 space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-700/30 dark:border-white/10">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <PercentIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Global Interest Rate</h3>
            <p className="text-xs text-slate-400">Default APR percentage applied on new loan issues</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <input
              type="number"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className="w-full pl-4 pr-10 py-3 rounded-2xl glass-input font-mono text-sm font-bold"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
              %
            </span>
          </div>

          <button
            onClick={handleSaveRate}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20"
          >
            <SaveIcon className="w-4 h-4" />
            <span>Save Rate</span>
          </button>
        </div>

        {rateSaved && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center space-x-2">
            <CheckCircleIcon className="w-4 h-4" />
            <span>Default loan interest rate updated successfully!</span>
          </div>
        )}
      </motion.div>

      {/* 2. Fund Overview */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-panel rounded-3xl p-6 space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-700/30 dark:border-white/10">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <AccountBalanceIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Fund Balance Overview</h3>
            <p className="text-xs text-slate-400">Total capital, active loans out, and available liquidity</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
            <p className="text-xs text-slate-400 uppercase font-mono">Total Capital</p>
            <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">₹{fmt(totalDeposits)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">from share deposits</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
            <p className="text-xs text-slate-400 uppercase font-mono">Lent Out</p>
            <p className="text-xl font-bold font-mono text-amber-400 mt-1">₹{fmt(totalLentOut)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">active principal loans</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
            <p className="text-xs text-slate-400 uppercase font-mono">Available Pool</p>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-1">₹{fmt(globalState.totalLendingPool)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">ready for lending</p>
          </div>
        </div>
      </motion.div>

      {/* 3. Interest Distribution */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-3xl p-6 space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-700/30 dark:border-white/10">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <SavingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Interest Pool Distribution</h3>
            <p className="text-xs text-slate-400">Distribute earned loan interest to share members</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <p className="text-xs text-slate-400 uppercase font-mono">Undistributed Interest Pool</p>
            <p className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">₹{fmt(globalState.totalInterestCollected)}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
            <p className="text-xs text-slate-400 uppercase font-mono">All-Time Distributed</p>
            <p className="text-2xl font-extrabold font-mono text-slate-300 mt-1">₹{fmt(globalState.totalInterestDistributed)}</p>
          </div>
        </div>

        <button
          disabled={globalState.totalInterestCollected <= 0 || summary.length === 0}
          onClick={() => setShowDistribute(true)}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center space-x-2 ${
            globalState.totalInterestCollected > 0 && summary.length > 0
              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25'
              : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
          }`}
        >
          <VolunteerActivismIcon className="w-5 h-5" />
          <span>Distribute Interest to Share Members</span>
        </button>

        {distributed && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center space-x-2">
            <CheckCircleIcon className="w-4 h-4" />
            <span>Interest distributed successfully across all share members!</span>
          </div>
        )}
      </motion.div>

      {/* 4. Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-panel rounded-3xl p-6 space-y-4 border-rose-500/30">
        <div className="flex items-center space-x-3 pb-3 border-b border-rose-500/20">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <WarningAmberIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-400">Danger Zone — Reset Database</h3>
            <p className="text-xs text-slate-400">Wipe all members, transaction histories, and fund logs</p>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Permanently erases all cooperative data from local storage and restores empty system defaults. This action cannot be undone.
        </p>

        <button
          onClick={() => setShowReset(true)}
          className="px-5 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-600 text-rose-400 hover:text-white font-bold text-xs transition-all flex items-center space-x-2"
        >
          <DeleteForeverIcon className="w-4 h-4" />
          <span>Reset All Data</span>
        </button>
      </motion.div>

      {/* DISTRIBUTE PREVIEW MODAL */}
      {showDistribute && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center">
          <div className="glass-panel rounded-3xl p-6 max-w-lg w-full space-y-5 border border-white/20">
            <h3 className="text-lg font-bold text-white">Preview Interest Distribution</h3>
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              Distributing <strong className="font-mono text-emerald-400">₹{fmt(globalState.totalInterestCollected)}</strong> across {summary.length} share member(s) based on equity %.
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {summary.map((s) => (
                <div key={s.userId} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-200">{s.name}</p>
                    <p className="text-slate-400 text-[10px]">{s.sharePercent.toFixed(1)}% Share</p>
                  </div>
                  <p className="font-mono font-bold text-emerald-400">+₹{fmt(s.projectedAmount)}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
              <button onClick={() => setShowDistribute(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white">
                Cancel
              </button>
              <button onClick={handleDistribute} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20">
                Confirm Distribution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET CONFIRMATION MODAL */}
      {showReset && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center">
          <div className="glass-panel rounded-3xl p-6 max-w-md w-full space-y-4 border border-rose-500/30">
            <h3 className="text-lg font-bold text-rose-400">Confirm Reset Data</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete all members, loans, transaction logs, and global vault balances?
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
              <button onClick={() => setShowReset(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white">
                Cancel
              </button>
              <button onClick={handleReset} className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20">
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

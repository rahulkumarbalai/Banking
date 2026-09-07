import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/store';
import type { MemberType } from '../services/types';
import { motion } from 'framer-motion';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupIcon from '@mui/icons-material/Group';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export const AddUser: React.FC = () => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [memberType, setMemberType] = useState<MemberType>('share');
  const [monthlyShare, setMonthlyShare] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter the member's name");
      return;
    }
    if (!mobile.trim()) {
      setError('Please enter a mobile number');
      return;
    }
    if (memberType === 'share') {
      const shareAmount = parseFloat(monthlyShare);
      if (isNaN(shareAmount) || shareAmount <= 0) {
        setError('Please enter a valid monthly share amount');
        return;
      }
    }

    try {
      const shareAmount = memberType === 'share' ? parseFloat(monthlyShare) : 0;
      api.addUser(name.trim(), mobile.trim(), memberType, shareAmount);
      setSuccess(true);
      setTimeout(() => navigate('/users'), 1200);
    } catch (err) {
      setError((err as Error).message || 'Failed to add member');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Add New Cooperative Member
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Register share member (equity owner) or borrower-only member.
        </p>
      </div>

      {/* Form Glass Panel */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Member Type Selection Cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Member Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMemberType('share')}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  memberType === 'share'
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                <GroupIcon
                  className={`w-6 h-6 mb-2 ${
                    memberType === 'share' ? 'text-blue-400' : 'text-slate-400'
                  }`}
                />
                <div>
                  <p className="text-sm font-bold">Share Member</p>
                  <p className="text-[11px] opacity-75 mt-0.5">Pays monthly share & earns interest</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMemberType('borrower')}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  memberType === 'borrower'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                <AccountBalanceWalletIcon
                  className={`w-6 h-6 mb-2 ${
                    memberType === 'borrower' ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <div>
                  <p className="text-sm font-bold">Borrower Only</p>
                  <p className="text-[11px] opacity-75 mt-0.5">Borrows funds without share equity</p>
                </div>
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <PersonIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-sm"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Mobile Number
            </label>
            <div className="relative">
              <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="tel"
                placeholder="e.g. +91 9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-sm"
              />
            </div>
          </div>

          {/* Monthly Share Amount (If Share Member) */}
          {memberType === 'share' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Monthly Share Amount (₹)
              </label>
              <div className="relative">
                <CurrencyRupeeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={monthlyShare}
                  onChange={(e) => setMonthlyShare(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input font-mono text-sm"
                />
              </div>
            </div>
          )}

          {/* Notice info for Borrower */}
          {memberType === 'borrower' && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start space-x-2.5">
              <InfoIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Borrower-only members do not deposit monthly share capital. All loans and repayments are logged under their account.
              </span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center space-x-2">
              <CheckCircleIcon className="w-4 h-4" />
              <span>Member registered successfully! Redirecting...</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
          >
            <PersonAddIcon className="w-5 h-5" />
            <span>Create Member Account</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};

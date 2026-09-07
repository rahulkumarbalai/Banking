import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/store';
import type { User } from '../services/types';
import { motion } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PhoneIcon from '@mui/icons-material/Phone';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import GroupsIcon from '@mui/icons-material/Groups';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'share' | 'borrower'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    setUsers(api.getUsers());
  }, []);

  const totalShareDeposits = users
    .filter((u) => u.memberType === 'share')
    .reduce((s, u) => s + u.totalDeposited - u.totalWithdrawn, 0);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.mobile && u.mobile.includes(search));
    const matchesFilter = filterType === 'all' || u.memberType === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Members Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage share members, borrowers, equity distribution and loans.
          </p>
        </div>

        <button
          onClick={() => navigate('/add-user')}
          className="flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-blue-500/25 transition-all"
        >
          <PersonAddIcon className="w-5 h-5" />
          <span>New Member</span>
        </button>
      </div>

      {/* Controls: Search Bar & Tabs */}
      <div className="glass-panel rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search member by name or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass-input text-sm"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-white/5 border border-white/10 w-full md:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({users.length})
          </button>
          <button
            onClick={() => setFilterType('share')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'share'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Share Members ({users.filter((u) => u.memberType === 'share').length})
          </button>
          <button
            onClick={() => setFilterType('borrower')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'borrower'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Borrowers Only ({users.filter((u) => u.memberType === 'borrower').length})
          </button>
        </div>
      </div>

      {/* Members Cards / List */}
      <div className="space-y-3">
        {filteredUsers.map((user, index) => {
          const netEquity = user.totalDeposited - user.totalWithdrawn;
          const sharePercent =
            totalShareDeposits > 0 && user.memberType === 'share'
              ? (netEquity / totalShareDeposits) * 100
              : 0;
          const isShareMember = user.memberType === 'share';

          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              key={user.id}
              onClick={() => navigate(`/users/${user.id}`)}
              className="glass-card rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group hover:border-blue-500/40"
            >
              {/* Member Basic Info */}
              <div className="flex items-center space-x-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shadow-md ${
                    isShareMember
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-blue-500/20'
                      : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/20'
                  }`}
                >
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-400 transition-colors">
                      {user.name}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        isShareMember
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {isShareMember ? 'Share Member' : 'Loan Borrower'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                    {user.mobile && (
                      <span className="flex items-center space-x-1">
                        <PhoneIcon className="w-3.5 h-3.5" />
                        <span>{user.mobile}</span>
                      </span>
                    )}
                    {isShareMember && (
                      <span className="flex items-center space-x-1">
                        <AccountBalanceIcon className="w-3.5 h-3.5" />
                        <span>Equity: ₹{fmt(netEquity)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Metrics & Arrow */}
              <div className="flex items-center justify-between sm:justify-end space-x-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700/30 dark:border-white/10">
                <div className="flex items-center space-x-2">
                  {isShareMember && sharePercent > 0 && (
                    <div className="px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-semibold">
                      {sharePercent.toFixed(1)}% Share
                    </div>
                  )}
                  {user.totalLent > 0 && (
                    <div className="px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs font-semibold">
                      Owes ₹{fmt(user.totalLent)}
                    </div>
                  )}
                </div>

                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-blue-600 transition-all">
                  <ChevronRightIcon className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="glass-panel rounded-3xl p-12 text-center text-slate-400">
            <GroupsIcon className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-base font-medium">No members found matching your search.</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting the filter tabs or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useContext, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SecurityIcon from '@mui/icons-material/Security';
import { ColorModeContext } from '../App';
import { store } from '../services/store';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [appData, setAppData] = useState(() => store.get());

  useEffect(() => {
    const unsubscribe = store.subscribe(() => setAppData(store.get()));
    return () => unsubscribe();
  }, []);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <DashboardIcon className="w-5 h-5" /> },
    { label: 'Members', path: '/users', icon: <PeopleIcon className="w-5 h-5" /> },
    { label: 'Add Member', path: '/add-user', icon: <PersonAddIcon className="w-5 h-5" /> },
    { label: 'Fund Ledger', path: '/transactions', icon: <ReceiptLongIcon className="w-5 h-5" /> },
    { label: 'Settings', path: '/settings', icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  const activeNav = navItems.find(
    (item) =>
      location.pathname === item.path ||
      (item.path !== '/' && location.pathname.startsWith(item.path))
  );

  return (
    <div className="relative min-h-screen w-full flex flex-col md:flex-row text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-x-hidden">
      {/* Ambient Atmospheric Lighting Orbs */}
      <div className="atmospheric-orb-1" />
      <div className="atmospheric-orb-2" />

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 p-5 fixed top-0 bottom-0 left-0 z-40">
        <div className="glass-panel w-full h-full rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
          {/* Top Brand Logo */}
          <div>
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <AccountBalanceWalletIcon className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-wider text-slate-900 dark:text-white font-sans bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                  Patil's Bank
                </h1>
                <p className="text-[11px] text-slate-400 uppercase tracking-widest font-mono">
                  Vivek Patil
                </p>
              </div>
            </div>

            {/* Nav Menu Items */}
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${isActive
                      ? 'bg-blue-500/20 text-blue-400 dark:text-blue-300 border border-blue-500/30 shadow-md shadow-blue-500/10 font-semibold translate-x-1'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/5 hover:translate-x-1'
                      }`}
                  >
                    <span className={`${isActive ? 'text-blue-400 glow-icon-primary' : ''}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Card / System Status */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            {/* Quick Balance Preview Pill */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">
                  Lending Pool
                </p>
                <p className="text-sm font-bold font-mono text-emerald-400">
                  ₹{appData.globalState.totalLendingPool.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
            </div>

            {/* Dark / Light Mode Switcher */}
            <button
              onClick={colorMode.toggleColorMode}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-800/40 dark:bg-white/5 border border-slate-700/50 dark:border-white/10 hover:border-blue-500/40 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all"
            >
              <span className="flex items-center space-x-2">
                {theme.palette.mode === 'dark' ? (
                  <Brightness7Icon className="w-4 h-4 text-amber-400" />
                ) : (
                  <Brightness4Icon className="w-4 h-4 text-indigo-400" />
                )}
                <span>{theme.palette.mode === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </span>
              <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                {theme.palette.mode}
              </span>
            </button>

            <div className="flex items-center space-x-2 text-[11px] text-slate-500 px-1">
              <SecurityIcon className="w-3.5 h-3.5" />
              <span>Encrypted Member Vault</span>
            </div>
          </div>
        </div>
      </aside>

      {/* TOP FLOATING HEADER (Mobile & Desktop) */}
      <header className="fixed top-0 left-0 right-0 md:left-72 z-30 p-4 md:p-5 pointer-events-none">
        <div className="pointer-events-auto max-w-7xl mx-auto glass-panel rounded-2xl md:rounded-3xl px-5 py-3.5 flex items-center justify-between shadow-xl">
          {/* Title & Mobile Toggle */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-white/10 text-slate-200 hover:bg-white/20 transition-all"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
            <h2 className="text-base md:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {activeNav?.label || 'Dashboard'}
            </h2>
          </div>

          {/* Quick Header Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Dark Mode Button Header */}
            <button
              onClick={colorMode.toggleColorMode}
              className="p-2 rounded-xl bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-white/20 transition-all flex items-center justify-center"
              title="Toggle Light / Dark Mode"
            >
              {theme.palette.mode === 'dark' ? (
                <Brightness7Icon className="text-amber-300 w-5 h-5" />
              ) : (
                <Brightness4Icon className="text-indigo-600 w-5 h-5" />
              )}
            </button>

            {/* Quick Member Counter Badge */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-400">
              <PeopleIcon className="w-4 h-4 text-blue-400" />
              <span>{appData.users.length} Members</span>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE FULLSCREEN MENU OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl md:hidden p-6 flex flex-col justify-between animate-fadeIn">
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <AccountBalanceWalletIcon className="text-white w-6 h-6" />
              </div>
              <span className="text-lg font-bold text-white tracking-wider">COOP BANK</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-full bg-white/10 text-white"
            >
              <CloseIcon />
            </button>
          </div>

          <nav className="space-y-3 my-auto">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl text-base font-medium transition-all ${isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30'
                    : 'text-slate-300 hover:bg-white/10'
                    }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-white/10">
            <button
              onClick={colorMode.toggleColorMode}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl bg-white/10 text-white text-sm font-medium"
            >
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              <span>Switch to {theme.palette.mode === 'dark' ? 'Light' : 'Dark'} Mode</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 md:ml-72 pt-24 md:pt-28 pb-24 md:pb-12 px-4 md:px-8 max-w-7xl w-full mx-auto relative z-10">
        <Outlet />
      </main>

      {/* MOBILE BOTTOM FLOATING DOCK */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 pointer-events-none">
        <div className="pointer-events-auto glass-panel rounded-full py-2.5 px-6 flex items-center justify-around shadow-2xl border border-white/20 backdrop-blur-2xl">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                aria-label={item.label}
                onClick={() => navigate(item.path)}
                className={`relative p-2.5 rounded-full transition-all duration-200 flex flex-col items-center ${isActive
                  ? 'text-blue-400 bg-blue-500/20 scale-110'
                  : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                {item.icon}
                {isActive && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#60a5fa]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

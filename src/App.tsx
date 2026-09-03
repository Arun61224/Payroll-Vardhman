/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PayrollProvider, usePayroll } from './context/PayrollContext';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { AttendanceTracker } from './components/AttendanceTracker';
import { PayrollGenerator } from './components/PayrollGenerator';
import { PayrollStats } from './components/PayrollStats';
import { Users, CalendarDays, ReceiptIndianRupee, BarChart3, Menu, X, Briefcase, ChevronRight, Activity, Trash2, Undo2, History, Lock, Eye, EyeOff, LogIn, LogOut, ShieldCheck, Calendar, Check } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
import { motion, AnimatePresence } from 'motion/react';

type TabId = 'directory' | 'attendance' | 'payroll' | 'analytics';

function LoginForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVibrating, setIsVibrating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'Vardhmanpay@44' && password === 'ABAFV0462G1') {
      localStorage.setItem('payroll_mgmt_logged_in', 'true');
      onLoginSuccess();
    } else {
      setError('Invalid User ID or Passkey. Please check your credentials and try again.');
      setIsVibrating(true);
      setTimeout(() => setIsVibrating(false), 500);
    }
  };

  const autofillCredentials = () => {
    setUsername('Vardhmanpay@44');
    setPassword('ABAFV0462G1');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center p-4 antialiased">
      <motion.div
        animate={isVibrating ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
      >
        {/* Banner */}
        <div className="bg-indigo-600 px-6 py-6 border-b-4 border-black text-white flex items-center gap-4">
          <div className="h-12 w-12 bg-white/15 border-2 border-white/30 rounded-2xl flex items-center justify-center">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-black text-2xl tracking-tighter uppercase leading-none">PAY/ROLL.HUB</h2>
            <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 inline" /> SECURE GATEWAY ACCESS
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 border-2 border-rose-500 rounded-xl p-3 text-xs text-rose-800 font-bold leading-normal"
            >
              ⚠️ {error}
            </motion.div>
          )}

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Secure User ID</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                placeholder="Enter User ID"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-black rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600 transition"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 select-none font-bold text-sm">@</span>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Secret Passkey</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border-2 border-black rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600 transition"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-black transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-6 border-2 border-black bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            Authenticate & Enter
          </button>
        </form>

        {/* Credentials Box */}
        <div className="bg-indigo-50/70 border-t-2 border-indigo-100 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between text-indigo-900 font-bold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              Default Access Credentials
            </span>
            <button
              type="button"
              onClick={autofillCredentials}
              className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg font-extrabold transition cursor-pointer"
            >
              Auto-fill Credentials
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono text-[11px]">
            <div className="bg-white p-2 rounded-lg border border-indigo-200">
              <span className="text-[10px] text-slate-400 font-sans block font-semibold uppercase">User ID</span>
              <span className="font-bold text-slate-800">Vardhmanpay@44</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-indigo-200">
              <span className="text-[10px] text-slate-400 font-sans block font-semibold uppercase">Passkey</span>
              <span className="font-bold text-slate-800">ABAFV0462G1</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t-2 border-slate-100 p-3 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Enterprise Grade Security Active
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function PayrollAppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('payroll_mgmt_logged_in') === 'true';
  });
  const [activeTab, setActiveTab] = useState<TabId>('directory');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { 
    activeMonth, 
    activeYear, 
    setActiveMonth, 
    setActiveYear, 
    setActiveDate, 
    deletedLogs, 
    restoreEmployee, 
    clearDeletedLogs 
  } = usePayroll();

  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [clearPassword, setClearPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Runtime Cycle Change Modal state
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [tempMonth, setTempMonth] = useState(activeMonth);
  const [tempYear, setTempYear] = useState(activeYear);

  const tabs = [
    { id: 'directory', label: 'Employee Directory', shortLabel: 'Directory', icon: Users, description: 'Manage personnel & salaries' },
    { id: 'attendance', label: 'Attendance Tracker', shortLabel: 'Attendance', icon: CalendarDays, description: 'Punch logs & grace periods' },
    { id: 'payroll', label: 'Payroll Ledger', shortLabel: 'Payroll', icon: ReceiptIndianRupee, description: 'Generate monthly payouts' },
    { id: 'analytics', label: 'Analytics & Insights', shortLabel: 'Analytics', icon: BarChart3, description: 'Visual stats & trends' },
  ];

  const activeTabDetails = tabs.find((t) => t.id === activeTab) || tabs[0];

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'directory':
        return <EmployeeDashboard />;
      case 'attendance':
        return <AttendanceTracker />;
      case 'payroll':
        return <PayrollGenerator />;
      case 'analytics':
        return <PayrollStats />;
      default:
        return <EmployeeDashboard />;
    }
  };

  if (!isLoggedIn) {
    return <LoginForm onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 font-sans flex flex-col lg:flex-row antialiased">
        
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b-2 border-black sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2">
            <span className="font-black text-2xl tracking-tighter text-indigo-600">PAY/ROLL.</span>
            <span className="text-[9px] font-bold bg-black text-white px-1.5 py-0.5 rounded uppercase tracking-wider">HUB</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTempMonth(activeMonth);
                setTempYear(activeYear);
                setIsCycleModalOpen(true);
              }}
              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 border-2 border-black rounded-lg text-xs font-black uppercase text-amber-950 flex items-center gap-1 cursor-pointer transition-colors"
              title="Change active runtime cycle"
            >
              <Calendar className="h-3.5 w-3.5 text-amber-900" />
              <span>{MONTH_NAMES[activeMonth].slice(0, 3)} {activeYear}</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border-2 border-black rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors focus:outline-none cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {/* Sidebar Navigation */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white border-r-4 border-black p-6 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:h-screen lg:top-0 shrink-0
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="space-y-8">
            {/* Sidebar Branding */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 bg-indigo-600 border-2 border-black rounded-lg flex items-center justify-center text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-black text-3xl tracking-tighter text-indigo-600 block leading-none">PAY/ROLL.</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mt-1">Enterprise Hub</span>
                </div>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden p-1.5 border-2 border-black rounded-md hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Current Cycle Box (Clickable interactive indicator) */}
            <button
              onClick={() => {
                setTempMonth(activeMonth);
                setTempYear(activeYear);
                setIsCycleModalOpen(true);
              }}
              className="w-full text-left bg-gradient-to-br from-amber-100 to-amber-200/90 border-2 border-black p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group relative overflow-hidden"
              title="Click to change active runtime cycle (month & year)"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-amber-900 tracking-wider uppercase block flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-amber-900 group-hover:rotate-12 transition-transform" />
                  CURRENT RUNTIME CYCLE
                </span>
                <span className="text-[9px] font-black bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-black group-hover:bg-black group-hover:text-amber-400 transition-colors">
                  CHANGE ✎
                </span>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xl font-black text-black uppercase tracking-tight">
                  {MONTH_NAMES[activeMonth]} {activeYear}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-black text-emerald-400 px-2 py-0.5 rounded-full uppercase shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>
              <div className="text-[10px] font-bold text-amber-900/80 mt-1.5 flex items-center gap-1 opacity-90 group-hover:opacity-100">
                <span>Click to change month or year</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Navigation Tabs */}
            <nav className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block px-1 mb-3">WORKSPACE NAV</span>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as TabId);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                      isActive
                        ? 'bg-indigo-600 text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-slate-700 border-transparent hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg border ${isActive ? 'bg-indigo-700 border-indigo-500 text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-tight">{tab.shortLabel}</div>
                        <div className={`text-[10px] ${isActive ? 'text-indigo-200' : 'text-slate-400'} leading-none mt-0.5`}>{tab.description}</div>
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 opacity-50 transition-transform ${isActive ? 'translate-x-1 opacity-100' : ''}`} />
                  </button>
                );
              })}
            </nav>

            {/* Deletion Log Tracker */}
            <div className="space-y-3 pt-4 border-t-2 border-dashed border-slate-200">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-rose-600 tracking-widest uppercase flex items-center gap-1">
                  <Trash2 className="h-3.5 w-3.5 animate-pulse" />
                  Deleted Logs
                </span>
                {deletedLogs.length > 0 && !showPasswordPrompt && (
                  <button
                    onClick={() => {
                      setShowPasswordPrompt(true);
                      setClearPassword('');
                      setPasswordError(false);
                    }}
                    className="text-[9px] font-extrabold text-slate-400 hover:text-rose-600 uppercase cursor-pointer transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              {showPasswordPrompt ? (
                <div className="p-3 bg-slate-50 border-2 border-black rounded-xl space-y-2.5 shadow-sm">
                  <div className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                    <Lock className="h-3 w-3 text-rose-500" />
                    Enter Admin Password to Clear Logs
                  </div>
                  <input
                    type="password"
                    placeholder="Password..."
                    value={clearPassword}
                    onChange={(e) => {
                      setClearPassword(e.target.value);
                      setPasswordError(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (clearPassword === 'Arun@2008') {
                          clearDeletedLogs();
                          setShowPasswordPrompt(false);
                          setClearPassword('');
                          setPasswordError(false);
                        } else {
                          setPasswordError(true);
                        }
                      }
                    }}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                    autoFocus
                  />
                  {passwordError && (
                    <div className="text-[9px] font-bold text-rose-500 leading-none">Incorrect password. Try again!</div>
                  )}
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => {
                        setShowPasswordPrompt(false);
                        setClearPassword('');
                        setPasswordError(false);
                      }}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[9px] font-bold cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (clearPassword === 'Arun@2008') {
                          clearDeletedLogs();
                          setShowPasswordPrompt(false);
                          setClearPassword('');
                          setPasswordError(false);
                        } else {
                          setPasswordError(true);
                        }
                      }}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-bold cursor-pointer transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {deletedLogs.length === 0 ? (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center text-[10px] text-slate-400 font-semibold italic">
                      No recently deleted employees
                    </div>
                  ) : (
                    deletedLogs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 bg-rose-50/50 hover:bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between text-[11px] group transition"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[9px] font-bold text-rose-700 bg-rose-100 px-1 rounded shrink-0">
                              {log.id}
                            </span>
                            <span className="font-black text-slate-950 truncate block">
                              {log.name}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            Removed at {log.deletedAt} ({log.type})
                          </span>
                        </div>
                        
                        <button
                          onClick={() => restoreEmployee(log.id)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition shrink-0 ml-1.5"
                          title="Restore Employee to directory"
                        >
                          <Undo2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                  {deletedLogs.length > 5 && (
                    <div className="text-center text-[9px] text-slate-400 font-bold">
                      + {deletedLogs.length - 5} more entries
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t-2 border-slate-100 pt-6 space-y-3">
            <button
              onClick={() => {
                localStorage.removeItem('payroll_mgmt_logged_in');
                setIsLoggedIn(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-black rounded-xl font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out Securely
            </button>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Live Workspace
              </span>
              <span>Port 3000</span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold tracking-tight">© 2026 Payroll Hub. Built with React & Tailwind CSS.</p>
          </div>
        </aside>

        {/* Mobile menu backdrop */}
        {mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)} 
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#fafbfc]">
          {/* Top Banner / Breadcrumb block */}
          <section className="bg-white border-b-4 border-black p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-[0_4px_0px_0px_rgba(0,0,0,0.03)] shrink-0">
            <div>
              <span className="text-xs font-black tracking-widest text-indigo-600 uppercase block mb-1">
                Payroll Management System
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase text-black">
                {activeTabDetails.label}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right hidden sm:block">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">LOGGED IN AS</span>
                <span className="text-xs font-black uppercase">Vardhmanpay</span>
              </div>
              <div className="h-10 w-10 rounded-full border-2 border-black bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                VP
              </div>
            </div>
          </section>

          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
              >
                {renderActiveContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Change Runtime Cycle Modal */}
        <AnimatePresence>
          {isCycleModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full overflow-hidden"
              >
                {/* Header */}
                <div className="bg-amber-100 border-b-4 border-black p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-amber-400 border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <Calendar className="h-5 w-5 text-black" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-black uppercase tracking-tight">Change Runtime Cycle</h3>
                      <p className="text-xs text-amber-900 font-semibold">Select active month and year for payroll processing</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCycleModalOpen(false)}
                    className="p-1.5 border-2 border-black rounded-xl hover:bg-amber-200 transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Year Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Select Financial Year</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[2024, 2025, 2026, 2027].map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => setTempYear(y)}
                          className={`py-2 px-3 rounded-xl border-2 font-black text-sm transition-all cursor-pointer ${
                            tempYear === y
                              ? 'bg-black text-amber-300 border-black shadow-[3px_3px_0px_0px_rgba(245,158,11,1)]'
                              : 'bg-slate-50 text-slate-700 border-slate-300 hover:border-black hover:bg-amber-50'
                          }`}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Month Selector Grid */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Select Month</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {MONTH_NAMES.map((name, idx) => {
                        const isSelected = tempMonth === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setTempMonth(idx)}
                            className={`py-2.5 px-3 rounded-xl border-2 text-xs font-black uppercase transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                                : 'bg-white text-slate-800 border-slate-200 hover:border-black hover:bg-slate-50'
                            }`}
                          >
                            <span>{name.slice(0, 3)}</span>
                            <span className={`text-[9px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>Month {idx + 1}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cycle Preview Box */}
                  <div className="bg-amber-50 border-2 border-amber-300 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-800 uppercase block">Selected Cycle Preview</span>
                      <span className="text-lg font-black text-amber-950 uppercase tracking-tight">
                        {MONTH_NAMES[tempMonth]} {tempYear}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (tempMonth === 0) {
                            setTempMonth(11);
                            setTempYear(tempYear - 1);
                          } else {
                            setTempMonth(tempMonth - 1);
                          }
                        }}
                        className="p-1.5 bg-white border border-black rounded-lg hover:bg-slate-100 font-bold text-xs cursor-pointer"
                        title="Previous Month"
                      >
                        ← Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (tempMonth === 11) {
                            setTempMonth(0);
                            setTempYear(tempYear + 1);
                          } else {
                            setTempMonth(tempMonth + 1);
                          }
                        }}
                        className="p-1.5 bg-white border border-black rounded-lg hover:bg-slate-100 font-bold text-xs cursor-pointer"
                        title="Next Month"
                      >
                        Next →
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCycleModalOpen(false)}
                      className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 border-2 border-black rounded-2xl font-bold text-xs text-slate-800 uppercase tracking-wide cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMonth(tempMonth);
                        setActiveYear(tempYear);
                        // Update activeDate to 1st of selected month/year
                        const newDate = `${tempYear}-${String(tempMonth + 1).padStart(2, '0')}-01`;
                        setActiveDate(newDate);
                        setIsCycleModalOpen(false);
                      }}
                      className="flex-1 py-3 px-4 bg-amber-400 hover:bg-amber-500 border-2 border-black rounded-2xl font-black text-xs text-black uppercase tracking-wide shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:translate-y-[1px] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Set Active Cycle
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
  );
}

export default function App() {
  return (
    <PayrollProvider>
      <PayrollAppContent />
    </PayrollProvider>
  );
}


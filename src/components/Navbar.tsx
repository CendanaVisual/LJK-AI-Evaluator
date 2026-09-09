import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  ScanLine,
  LayoutTemplate,
  Code2,
  Database,
  CheckCircle2,
  AlertCircle,
  Printer,
  Sparkles,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onQuickPrint?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onQuickPrint }) => {
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; serverTime?: string; checking: boolean }>({
    connected: false,
    checking: true,
  });

  useEffect(() => {
    checkDbStatus();
    const interval = setInterval(checkDbStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  const checkDbStatus = async () => {
    try {
      const res = await fetch('/api/db/status');
      const data = await res.json();
      setDbStatus({
        connected: Boolean(data.ok || data.connected),
        serverTime: data.timestamp || data.server_time,
        checking: false,
      });
    } catch (err) {
      setDbStatus({ connected: false, checking: false });
    }
  };

  return (
    <header className="no-print sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Description */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('generator')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/25 ring-2 ring-teal-400/20">
              <ScanLine className="w-6 h-6 text-slate-950 font-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent">
                  SmartLJK <span className="text-teal-400">AI</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center space-x-1">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" /> SDN 7 Pedungan
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block font-medium">
                Sistem Cetak &amp; Evaluator LJK OMR Digital
              </p>
            </div>
          </div>

          {/* Center Tabs Navigation */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              id="tab-generator-btn"
              onClick={() => setActiveTab('generator')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === 'generator'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutTemplate className="w-4 h-4" />
              <span className="hidden md:inline">Pembuat LJK</span>
            </button>

            <button
              id="tab-scanner-btn"
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === 'scanner'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ScanLine className="w-4 h-4" />
              <span>Pemeriksa OMR</span>
            </button>

            <button
              id="tab-dashboard-btn"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === 'dashboard'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden md:inline">Dashboard &amp; Nilai</span>
            </button>

            <button
              id="tab-docs-btn"
              onClick={() => setActiveTab('docs')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === 'docs'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span className="hidden lg:inline">FastAPI &amp; Docs</span>
            </button>
          </nav>

          {/* Right Status: Neon DB Status & Print */}
          <div className="flex items-center space-x-3">
            {/* Database connection badge */}
            <div
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 border border-slate-700/80"
              title={dbStatus.connected ? 'Terhubung ke Neon PostgreSQL Cloud' : 'Mengecek koneksi database Neon...'}
            >
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 text-[11px]">Neon DB:</span>
              {dbStatus.checking ? (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              ) : dbStatus.connected ? (
                <span className="flex items-center text-emerald-400 font-semibold space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  <span>Online</span>
                </span>
              ) : (
                <span className="flex items-center text-rose-400 font-semibold space-x-1">
                  <AlertCircle className="w-3 h-3 inline" />
                  <span>Offline</span>
                </span>
              )}
            </div>

            {onQuickPrint && (
              <button
                id="quick-print-navbar-btn"
                onClick={onQuickPrint}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cetak LJK</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

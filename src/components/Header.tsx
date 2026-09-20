import React from 'react';
import { Shield, Menu, Sparkles, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
  activeTabTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, activeTabTitle }) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-md shadow-emerald-500/20 text-white">
            <Shield className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-white flex items-center gap-1.5">
                ModerationGate AI
                <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active Shield
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Protected by AI-powered content moderation
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {activeTabTitle && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/60 text-xs font-medium text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{activeTabTitle}</span>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Pre-moderation Active</span>
          <span className="sm:hidden">Protected</span>
        </div>
      </div>
    </header>
  );
};

export default Header;

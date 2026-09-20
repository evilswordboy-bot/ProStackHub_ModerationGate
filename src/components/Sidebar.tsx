import React from 'react';
import {
  MessageSquare,
  Activity,
  LayoutDashboard,
  ShieldAlert,
  TestTube2,
  Settings,
  X,
  ShieldCheck
} from 'lucide-react';

export type NavTab = 'chat' | 'activity' | 'dashboard' | 'flags' | 'tests' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
  pendingReviewCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  pendingReviewCount = 0,
}) => {
  const navItems = [
    {
      id: 'chat' as NavTab,
      label: 'Safe Chat',
      icon: MessageSquare,
      badge: null,
      desc: 'User chat protected by moderation gate'
    },
    {
      id: 'activity' as NavTab,
      label: 'Live Activity',
      icon: Activity,
      badge: null,
      desc: 'Session moderation audit events'
    },
    {
      id: 'dashboard' as NavTab,
      label: 'Admin Dashboard',
      icon: LayoutDashboard,
      badge: null,
      desc: 'Aggregated analytics & metrics'
    },
    {
      id: 'flags' as NavTab,
      label: 'Flagged Content',
      icon: ShieldAlert,
      badge: pendingReviewCount > 0 ? pendingReviewCount : null,
      desc: 'Review and triage violations'
    },
    {
      id: 'tests' as NavTab,
      label: 'Test Center',
      icon: TestTube2,
      badge: 'Evaluation',
      desc: 'Benign suites & false-positive stats'
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: Settings,
      badge: null,
      desc: 'AI provider & system controls'
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 lg:w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              MG
            </div>
            <div>
              <span className="font-semibold text-sm text-white tracking-tight">ModerationGate</span>
              <p className="text-[11px] text-slate-400">Intelligent Safety Gate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mission / Tagline Card */}
        <div className="px-4 py-3 m-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs">
          <p className="font-medium text-slate-200 leading-snug">
            Safer conversations through intelligent moderation.
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            An AI-powered moderation layer that checks, protects, and audits every message.
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <div className="text-left">
                    <div>{item.label}</div>
                  </div>
                </div>

                {item.badge !== null && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      typeof item.badge === 'number'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info & privacy hint */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-medium">Strict Pre-Delivery Gate</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Task 5 • ProStackHub AI Internship
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

import React, { useState, useEffect } from 'react';
import type { AdminStats, ModerationEvent } from '../types/moderation';
import { api } from '../services/api';
import StatsCard from '../components/StatsCard';
import ModerationBadge from '../components/ModerationBadge';
import {
  LayoutDashboard,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  TestTube2,
  RefreshCw,
  ArrowUpRight,
  BarChart3
} from 'lucide-react';

interface DashboardProps {
  onNavigateToFlags: () => void;
  onNavigateToTests: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigateToFlags,
  onNavigateToTests
}) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ModerationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, activityRes] = await Promise.all([
        api.getAdminStats(),
        api.getActivity(8)
      ]);
      setStats(statsRes);
      setRecentActivity(activityRes.events || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalFlaggedCount = stats ? stats.messagesFlagged : 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-emerald-400" />
            <span>Moderation Intelligence Dashboard</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic, real-time safety metrics computed directly from SQLite database audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateToTests}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs font-medium transition-colors"
          >
            <TestTube2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Run Test Suite</span>
          </button>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Messages Checked"
          value={stats ? stats.messagesChecked : '—'}
          subtitle="Total messages processed"
          icon={ShieldCheck}
          variant="blue"
        />

        <StatsCard
          title="Messages Allowed"
          value={stats ? stats.messagesAllowed : '—'}
          subtitle="Passed safety criteria"
          icon={CheckCircle2}
          variant="emerald"
        />

        <StatsCard
          title="Messages Flagged"
          value={stats ? stats.messagesFlagged : '—'}
          subtitle="Blocked by policy"
          icon={ShieldAlert}
          variant="rose"
        />

        <StatsCard
          title="Pending Reviews"
          value={stats ? stats.pendingReviews : '—'}
          subtitle="Awaiting human review"
          icon={Clock}
          variant="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Flag Categories</span>
            </h3>
            <span className="text-[11px] text-slate-400">{stats?.categoryBreakdown.length || 0} active</span>
          </div>

          <div className="space-y-3 pt-1">
            {!stats || stats.categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No policy violations logged yet.
              </p>
            ) : (
              stats.categoryBreakdown.map((cat) => {
                const percentage = totalFlaggedCount > 0
                  ? Math.round((cat.count / totalFlaggedCount) * 100)
                  : 0;

                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-200 uppercase text-[11px]">
                        {cat.category}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {cat.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={onNavigateToFlags}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              <span>View Flagged Content Queue</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Recent Decision Audit</span>
            </h3>
            <span className="text-[11px] text-slate-400">Latest events</span>
          </div>

          <div className="space-y-2.5">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No activity records available.
              </p>
            ) : (
              recentActivity.map((evt) => {
                const isAllowed = evt.decision === 'allowed';
                return (
                  <div
                    key={evt.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isAllowed ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <span className="font-mono text-slate-200 truncate block">
                          "{evt.messageSnippet}"
                        </span>
                        <p className="text-[11px] text-slate-400 truncate">
                          {evt.reason || (isAllowed ? 'Message approved' : 'Flagged')}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <ModerationBadge
                        decision={evt.decision}
                        category={evt.category}
                        size="sm"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

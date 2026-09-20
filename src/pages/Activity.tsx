import React, { useState, useEffect } from 'react';
import type { ModerationEvent } from '../types/moderation';
import { api } from '../services/api';
import { Activity, ShieldCheck, ShieldAlert, RefreshCw, Clock } from 'lucide-react';

export const ActivityPage: React.FC = () => {
  const [events, setEvents] = useState<ModerationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'allowed' | 'flagged'>('all');

  const fetchActivity = async () => {
    setIsLoading(true);
    try {
      const res = await api.getActivity(40);
      setEvents(res.events || []);
    } catch (err) {
      console.error('Failed to load activity:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const filteredEvents = events.filter(e => {
    if (filter === 'allowed') return e.decision === 'allowed';
    if (filter === 'flagged') return e.decision === 'flagged';
    return true;
  });

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>Moderation Activity Stream</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time audit record of all moderation gate evaluations for this session.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${filter === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('allowed')}
              className={`px-3 py-1 rounded-md transition-colors ${filter === 'allowed' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Allowed
            </button>
            <button
              onClick={() => setFilter('flagged')}
              className={`px-3 py-1 rounded-md transition-colors ${filter === 'flagged' ? 'bg-rose-500/20 text-rose-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Flagged
            </button>
          </div>

          <button
            onClick={fetchActivity}
            disabled={isLoading}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700 disabled:opacity-50"
            aria-label="Refresh activity feed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Activity Timeline List (Section 18 format) */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs">
            No moderation activity events found.
          </div>
        ) : (
          filteredEvents.map((event) => {
            const isAllowed = event.decision === 'allowed';

            return (
              <div
                key={event.id}
                className={`p-4 rounded-xl border transition-all ${
                  isAllowed
                    ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/30'
                    : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg border ${
                        isAllowed
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}
                    >
                      {isAllowed ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : (
                        <ShieldAlert className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${isAllowed ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {isAllowed ? '✓ Message allowed' : '⚠ Message flagged'}
                        </span>
                        {event.category && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Category: {event.category}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 mt-1 max-w-xl truncate">
                        {event.reason || (isAllowed ? 'Safe conversation inquiry' : 'Policy violation detected')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(event.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActivityPage;

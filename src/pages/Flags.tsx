import React, { useState, useEffect } from 'react';
import type { FlaggedContent } from '../types/moderation';
import { api } from '../services/api';
import FlagTable from '../components/FlagTable';
import Review from './Review';
import { ShieldAlert, Search, RefreshCw } from 'lucide-react';

interface FlagsPageProps {
  onReviewCompleted?: () => void;
}

export const FlagsPage: React.FC<FlagsPageProps> = ({ onReviewCompleted }) => {
  const [flags, setFlags] = useState<FlaggedContent[]>([]);
  const [selectedFlag, setSelectedFlag] = useState<FlaggedContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFlags = async () => {
    setIsLoading(true);
    try {
      const res = await api.getFlags({
        status: statusFilter,
        category: categoryFilter,
        search: searchQuery.trim(),
      });
      setFlags(res.flags || []);
    } catch (err) {
      console.error('Failed to load flags:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFlags();
  };

  if (selectedFlag) {
    return (
      <Review
        flag={selectedFlag}
        onBack={() => setSelectedFlag(null)}
        onUpdated={(updated) => {
          setSelectedFlag(updated);
          fetchFlags();
          onReviewCompleted?.();
        }}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>Flagged Content Queue</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review and adjudicate violations detected by the moderation classifier.
          </p>
        </div>

        <button
          onClick={fetchFlags}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <form onSubmit={handleSearchSubmit} className="relative sm:col-span-2 lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search flagged text or reason..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </form>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="confirmed">Confirmed</option>
            <option value="allowed">Marked Allowed</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Categories</option>
            <option value="harassment">Harassment</option>
            <option value="hate">Hate Speech</option>
            <option value="threats">Threats</option>
            <option value="dangerous_activity">Dangerous Activity</option>
            <option value="self-harm">Self-Harm</option>
            <option value="sexual">Sexual</option>
            <option value="spam">Spam</option>
            <option value="violence">Violence</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <FlagTable
        flags={flags}
        onSelectFlag={(flag) => setSelectedFlag(flag)}
        isLoading={isLoading}
      />
    </div>
  );
};

export default FlagsPage;

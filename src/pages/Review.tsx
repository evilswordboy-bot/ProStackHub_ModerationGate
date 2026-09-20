import React, { useState } from 'react';
import type { FlaggedContent } from '../types/moderation';
import { ModerationBadge } from '../components/ModerationBadge';
import { api } from '../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  XCircle,
  Clock,
  UserCheck,
  ArrowLeft,
  FileText
} from 'lucide-react';

interface ReviewProps {
  flag: FlaggedContent;
  onBack: () => void;
  onUpdated: (updatedFlag: FlaggedContent) => void;
}

export const Review: React.FC<ReviewProps> = ({ flag, onBack, onUpdated }) => {
  const [currentFlag, setCurrentFlag] = useState<FlaggedContent>(flag);
  const [reviewerName, setReviewerName] = useState('Human Safety Analyst');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleAction = async (action: 'confirm' | 'allow' | 'dismiss') => {
    setIsSubmitting(true);
    setNotice(null);
    try {
      const res = await api.reviewFlag(currentFlag.id, action, reviewerName);
      if (res.success && res.flag) {
        setCurrentFlag(res.flag);
        onUpdated(res.flag);
        const actionLabels = {
          confirm: 'Flag confirmed as legitimate policy violation.',
          allow: 'Message marked as allowed by human reviewer.',
          dismiss: 'Flag dismissed without violation penalty.'
        };
        setNotice(actionLabels[action]);
      }
    } catch (err: any) {
      setNotice(`Review submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Flagged Content</span>
        </button>

        <ModerationBadge status={currentFlag.status} size="lg" />
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white tracking-tight">Moderation Review</h2>
        <p className="text-xs text-slate-400">
          Case ID: <span className="font-mono text-slate-300">{currentFlag.id}</span>
        </p>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-emerald-400 hover:text-emerald-200 font-semibold ml-2">
            ×
          </button>
        </div>
      )}

      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-6 shadow-sm">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Message Content
          </label>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">
            {currentFlag.message}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              AI Classification
            </span>
            <div className="flex items-center gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-semibold uppercase tracking-wider">
                {currentFlag.category}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Timestamp
            </span>
            <p className="text-xs text-slate-300 pt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {formatTimestamp(currentFlag.createdAt)}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            AI Reason
          </span>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed pt-1">
            {currentFlag.reason}
          </p>
        </div>

        {currentFlag.reviewer && (
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs space-y-1 text-slate-300">
            <div className="flex items-center gap-2 font-semibold text-white">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Prior Human Review Decision: {currentFlag.status.toUpperCase()}</span>
            </div>
            <p className="text-slate-400">
              Reviewed by <span className="text-slate-200 font-medium">{currentFlag.reviewer}</span> on {formatTimestamp(currentFlag.reviewedAt)}
            </p>
          </div>
        )}

        <div className="space-y-1.5 pt-2">
          <label htmlFor="reviewer" className="text-xs font-semibold text-slate-300">
            Reviewer Identity
          </label>
          <input
            id="reviewer"
            type="text"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            placeholder="e.g. Lead Safety Reviewer"
            className="w-full sm:w-80 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleAction('confirm')}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-md shadow-rose-950/40 disabled:opacity-50 transition-all"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Confirm Flag</span>
          </button>

          <button
            onClick={() => handleAction('allow')}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-950/40 disabled:opacity-50 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Mark Allowed</span>
          </button>

          <button
            onClick={() => handleAction('dismiss')}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 disabled:opacity-50 transition-all"
          >
            <XCircle className="w-4 h-4" />
            <span>Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Review;

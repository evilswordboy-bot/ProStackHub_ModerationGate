import React from 'react';
import type { FlaggedContent } from '../types/moderation';
import { ModerationBadge } from './ModerationBadge';
import { Eye, CheckCircle2 } from 'lucide-react';

interface FlagTableProps {
  flags: FlaggedContent[];
  onSelectFlag: (flag: FlaggedContent) => void;
  isLoading?: boolean;
}

export const FlagTable: React.FC<FlagTableProps> = ({
  flags,
  onSelectFlag,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs">Loading flagged records...</span>
      </div>
    );
  }

  if (flags.length === 0) {
    return (
      <div className="py-16 text-center rounded-xl bg-slate-900/40 border border-slate-800 p-8">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-80" />
        <h3 className="text-sm font-semibold text-slate-200">No Flagged Messages Found</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          There are no flagged records matching your current filter criteria.
        </p>
      </div>
    );
  }

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <div>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-medium uppercase tracking-wider">
              <th className="py-3 px-4">Message</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {flags.map((flag) => (
              <tr
                key={flag.id}
                className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                onClick={() => onSelectFlag(flag)}
              >
                <td className="py-3.5 px-4 font-mono text-slate-200 max-w-xs truncate">
                  <span title={flag.message}>{flag.message}</span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium">
                    {flag.category}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate" title={flag.reason}>
                  {flag.reason}
                </td>
                <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                  {formatTimestamp(flag.createdAt)}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <ModerationBadge status={flag.status} size="sm" />
                </td>
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectFlag(flag);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 hover:bg-emerald-600 hover:text-white transition-colors border border-slate-700 hover:border-emerald-500 text-xs font-medium"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Review</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {flags.map((flag) => (
          <div
            key={flag.id}
            onClick={() => onSelectFlag(flag)}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors space-y-3 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-medium">
                {flag.category}
              </span>
              <ModerationBadge status={flag.status} size="sm" />
            </div>

            <p className="text-xs font-mono text-slate-200 line-clamp-2">
              "{flag.message}"
            </p>

            <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
              <span className="font-semibold text-slate-300">Reason: </span>
              {flag.reason}
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
              <span>{formatTimestamp(flag.createdAt)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFlag(flag);
                }}
                className="inline-flex items-center gap-1 text-emerald-400 font-medium hover:underline"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View & Review</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlagTable;

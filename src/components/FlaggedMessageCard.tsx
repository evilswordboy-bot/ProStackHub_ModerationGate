import React from 'react';
import { ShieldAlert, X } from 'lucide-react';
import type { ModerationCategory } from '../types/moderation';

interface FlaggedMessageCardProps {
  category: ModerationCategory | string | null;
  reason: string | null;
  onDismiss?: () => void;
  messagePreview?: string;
}

export const FlaggedMessageCard: React.FC<FlaggedMessageCardProps> = ({
  category,
  reason,
  onDismiss,
  messagePreview
}) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="p-4 my-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 shadow-lg shadow-rose-950/20 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-rose-100">Message blocked</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-medium uppercase tracking-wider border border-rose-500/30">
                {category || 'Safety Violation'}
              </span>
            </div>

            <p className="text-xs text-rose-200/90 leading-relaxed">
              Your message wasn't sent because it was flagged by the moderation system.
            </p>

            {messagePreview && (
              <div className="p-2 rounded bg-rose-950/60 border border-rose-500/20 text-xs text-rose-300/80 italic line-clamp-2">
                "{messagePreview}"
              </div>
            )}

            {reason && (
              <div className="pt-1 text-xs">
                <span className="font-semibold text-rose-300">Reason: </span>
                <span className="text-rose-200">{reason}</span>
              </div>
            )}
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 text-rose-400 hover:text-rose-200 hover:bg-rose-900/40 rounded-lg transition-colors"
            aria-label="Dismiss message notification"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FlaggedMessageCard;

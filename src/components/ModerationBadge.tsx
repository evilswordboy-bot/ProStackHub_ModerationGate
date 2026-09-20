import React from 'react';
import { ShieldCheck, ShieldAlert, Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { ReviewStatus } from '../types/moderation';

interface ModerationBadgeProps {
  status?: ReviewStatus;
  decision?: 'allowed' | 'flagged';
  category?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const ModerationBadge: React.FC<ModerationBadgeProps> = ({
  status,
  decision,
  category,
  size = 'md',
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-medium px-3 py-1.5 gap-2',
  };

  if (status) {
    switch (status) {
      case 'pending':
        return (
          <span
            className={`inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 ${sizeClasses[size]}`}
            role="status"
            aria-label="Pending Review"
          >
            {showIcon && <Clock className="w-3.5 h-3.5" />}
            <span>Pending Review</span>
          </span>
        );
      case 'confirmed':
        return (
          <span
            className={`inline-flex items-center rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 ${sizeClasses[size]}`}
            role="status"
            aria-label="Flag Confirmed"
          >
            {showIcon && <ShieldAlert className="w-3.5 h-3.5" />}
            <span>Confirmed Violation</span>
          </span>
        );
      case 'allowed':
        return (
          <span
            className={`inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 ${sizeClasses[size]}`}
            role="status"
            aria-label="Human Approved"
          >
            {showIcon && <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>Marked Allowed</span>
          </span>
        );
      case 'dismissed':
        return (
          <span
            className={`inline-flex items-center rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 ${sizeClasses[size]}`}
            role="status"
            aria-label="Dismissed"
          >
            {showIcon && <XCircle className="w-3.5 h-3.5" />}
            <span>Dismissed</span>
          </span>
        );
    }
  }

  if (decision === 'flagged') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 ${sizeClasses[size]}`}
        role="status"
        aria-label={`Flagged: ${category || 'Violation'}`}
      >
        {showIcon && <ShieldAlert className="w-3.5 h-3.5" />}
        <span>Flagged {category ? `(${category})` : ''}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 ${sizeClasses[size]}`}
      role="status"
      aria-label="Message Approved"
    >
      {showIcon && <ShieldCheck className="w-3.5 h-3.5" />}
      <span>Approved</span>
    </span>
  );
};

export default ModerationBadge;

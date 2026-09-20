import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'rose' | 'amber' | 'blue' | 'slate';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'slate',
}) => {
  const variantStyles = {
    emerald: {
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      valueColor: 'text-emerald-300',
    },
    rose: {
      bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
      valueColor: 'text-rose-300',
    },
    amber: {
      bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      valueColor: 'text-amber-300',
    },
    blue: {
      bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      valueColor: 'text-blue-300',
    },
    slate: {
      bg: 'bg-slate-800/60 border-slate-700/60 text-slate-300',
      valueColor: 'text-white',
    },
  };

  const style = variantStyles[variant];

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl lg:text-3xl font-bold tracking-tight ${style.valueColor}`}>
              {value}
            </span>
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>

        <div className={`p-3 rounded-xl border ${style.bg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;

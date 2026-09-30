import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  variant?: 'default' | 'danger' | 'warning' | 'info' | 'success';
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
  trend,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          border: 'border-rose-900/40 hover:border-rose-700/60',
          iconBg: 'bg-rose-500/10 text-rose-400',
          accent: 'text-rose-400',
        };
      case 'warning':
        return {
          border: 'border-amber-900/40 hover:border-amber-700/60',
          iconBg: 'bg-amber-500/10 text-amber-400',
          accent: 'text-amber-400',
        };
      case 'info':
        return {
          border: 'border-indigo-900/40 hover:border-indigo-700/60',
          iconBg: 'bg-indigo-500/10 text-indigo-400',
          accent: 'text-indigo-400',
        };
      case 'success':
        return {
          border: 'border-emerald-900/40 hover:border-emerald-700/60',
          iconBg: 'bg-emerald-500/10 text-emerald-400',
          accent: 'text-emerald-400',
        };
      case 'default':
      default:
        return {
          border: 'border-white/[0.08] hover:border-white/[0.15]',
          iconBg: 'bg-slate-800 text-slate-300',
          accent: 'text-white',
        };
    }
  };

  const { border, iconBg, accent } = getVariantStyles();

  return (
    <div
      className={`bg-[#111827] rounded-lg p-5 border transition-all duration-150 ${border}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <h3 className={`text-2xl font-bold font-metric mt-1 tracking-tight ${accent}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
        </div>
        <div className={`p-2.5 rounded-md ${iconBg}`}>
          <Icon size={20} />
        </div>
      </div>

      {(subtext || trend) && (
        <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-slate-400">
          {subtext && <span>{subtext}</span>}
          {trend && (
            <span
              className={`font-medium ${
                trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

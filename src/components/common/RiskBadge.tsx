import React from 'react';
import type { RiskLevel } from '../../types/fraud';
import { AlertOctagon, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  score?: number;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  showIcon = true,
  size = 'md',
  score,
}) => {
  const getStyles = () => {
    switch (level) {
      case 'CRITICAL':
        return {
          container: 'bg-rose-950/40 text-rose-400 border-rose-500/40 shadow-sm',
          dot: 'bg-rose-500',
          icon: AlertOctagon,
        };
      case 'HIGH':
        return {
          container: 'bg-orange-950/40 text-orange-400 border-orange-500/40 shadow-sm',
          dot: 'bg-orange-500',
          icon: AlertTriangle,
        };
      case 'MEDIUM':
        return {
          container: 'bg-amber-950/40 text-amber-400 border-amber-500/40 shadow-sm',
          dot: 'bg-amber-500',
          icon: Info,
        };
      case 'LOW':
      default:
        return {
          container: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40 shadow-sm',
          dot: 'bg-emerald-500',
          icon: ShieldCheck,
        };
    }
  };

  const { container, dot, icon: Icon } = getStyles();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      className={`inline-flex items-center rounded border font-mono tracking-wide uppercase ${sizeClasses[size]} ${container}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0 animate-pulse`} />
      {showIcon && <Icon size={iconSizes[size]} className="shrink-0" />}
      <span>{level}</span>
      {score !== undefined && (
        <span className="opacity-80 font-normal pl-0.5">({score})</span>
      )}
    </span>
  );
};

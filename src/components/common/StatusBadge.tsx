import React from 'react';
import type { ReviewStatus } from '../../types/fraud';
import { Clock, CheckCircle2, ShieldCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: ReviewStatus | 'PENDING';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyles = () => {
    switch (status) {
      case 'PENDING_REVIEW':
      case 'PENDING':
        return {
          container: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: Clock,
          label: 'Pending Review',
        };
      case 'REVIEWED':
        return {
          container: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
          icon: CheckCircle2,
          label: 'Reviewed',
        };
      case 'CLEARED':
      default:
        return {
          container: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: ShieldCheck,
          label: 'Cleared',
        };
    }
  };

  const { container, icon: Icon, label } = getStyles();
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5 font-medium';

  return (
    <span className={`inline-flex items-center rounded border tracking-normal ${sizeClasses} ${container}`}>
      <Icon size={size === 'sm' ? 12 : 14} className="shrink-0" />
      <span>{label}</span>
    </span>
  );
};

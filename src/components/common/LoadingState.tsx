import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading fraud intelligence stream...',
  size = 'md',
}) => {
  const iconSizes = {
    sm: 18,
    md: 26,
    lg: 36,
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-[#111827] border border-white/[0.08] rounded-lg">
      <Loader2 size={iconSizes[size]} className="animate-spin text-indigo-500 mb-3" />
      <p className="text-xs uppercase tracking-wider font-mono text-slate-400">{message}</p>
    </div>
  );
};

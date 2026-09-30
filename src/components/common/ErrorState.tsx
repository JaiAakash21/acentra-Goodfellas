import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load telemetry',
  message = 'An unexpected error occurred while communicating with the decision engine.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-rose-950/20 border border-rose-900/40 rounded-lg">
      <div className="p-3 bg-rose-500/10 rounded-full text-rose-400 mb-3">
        <AlertCircle size={26} />
      </div>
      <h4 className="text-sm font-semibold text-rose-300">{title}</h4>
      <p className="mt-1 text-xs text-rose-400/80 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-900/50 hover:bg-rose-800 text-rose-200 text-xs font-medium rounded border border-rose-700/50 transition-colors"
        >
          <RotateCcw size={14} />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
};

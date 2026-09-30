import React, { useState } from 'react';
import type { ReviewStatus } from '../../types/fraud';
import { CheckCircle2, ShieldCheck, MessageSquare, Loader2, Check } from 'lucide-react';

interface ReviewDecisionBoxProps {
  currentStatus: ReviewStatus;
  onSubmitDecision: (status: ReviewStatus, comment: string) => Promise<void>;
}

export const ReviewDecisionBox: React.FC<ReviewDecisionBoxProps> = ({
  currentStatus,
  onSubmitDecision,
}) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleSubmit = async (status: ReviewStatus) => {
    setIsSubmitting(true);
    setActionSuccess(null);
    try {
      await onSubmitDecision(status, comment);
      setActionSuccess(`Case successfully updated to ${status}`);
      setTimeout(() => setActionSuccess(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#111827] border border-white/[0.08] rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider font-mono">
            Reviewer Decision & Adjudication
          </h3>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Current State:{' '}
          <strong className="text-slate-200 uppercase font-semibold">{currentStatus}</strong>
        </span>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded text-xs text-emerald-300 flex items-center gap-2 font-mono">
          <Check size={14} className="text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Reviewer Comment Textarea */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
          Reviewer Justification / Analyst Notes
        </label>
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Enter investigation notes, callback confirmation details, or justification for clearance..."
          className="w-full bg-[#0B0F17] border border-white/[0.08] rounded-md p-3 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500/60 font-mono"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-white/[0.05]">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSubmit('REVIEWED')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow-sm transition-colors uppercase font-mono tracking-wider"
        >
          {isSubmitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <CheckCircle2 size={15} />
          )}
          <span>MARK AS REVIEWED</span>
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSubmit('CLEARED')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow-sm transition-colors uppercase font-mono tracking-wider"
        >
          {isSubmitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ShieldCheck size={15} />
          )}
          <span>CLEAR CASE</span>
        </button>
      </div>
    </div>
  );
};

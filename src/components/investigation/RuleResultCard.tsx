import React from 'react';
import type { RuleResult } from '../../types/fraud';
import { AlertCircle, CheckCircle, Zap, TrendingUp, Compass, Smartphone, Shield } from 'lucide-react';

interface RuleResultCardProps {
  ruleResult: RuleResult;
}

export const RuleResultCard: React.FC<RuleResultCardProps> = ({ ruleResult }) => {
  const getRuleIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('velocity')) return Zap;
    if (lower.includes('amount')) return TrendingUp;
    if (lower.includes('travel') || lower.includes('geo') || lower.includes('location')) return Compass;
    if (lower.includes('device')) return Smartphone;
    return Shield;
  };

  const Icon = getRuleIcon(ruleResult.ruleName);
  const isTriggered = ruleResult.triggered;

  return (
    <div
      className={`rounded-lg p-5 border transition-all ${
        isTriggered
          ? 'bg-[#131B2E] border-rose-500/30 shadow-card'
          : 'bg-[#111827] border-white/[0.06] opacity-80'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-md ${
              isTriggered
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            <Icon size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-wide uppercase font-mono text-slate-100">
              {ruleResult.ruleName}
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              Rule ID: {ruleResult.ruleId}
            </span>
          </div>
        </div>

        {/* Score Impact Pill */}
        <div className="text-right">
          <span
            className={`inline-flex items-center font-mono font-bold text-sm px-2.5 py-0.5 rounded border ${
              isTriggered
                ? 'bg-rose-950/60 text-rose-400 border-rose-500/40'
                : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {isTriggered ? `+${ruleResult.score}` : '0'} pts
          </span>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            {isTriggered ? 'Flagged Impact' : 'Passed'}
          </p>
        </div>
      </div>

      {/* Main Evidence Statement */}
      <div className="mt-3.5 pt-3 border-t border-white/[0.06]">
        <p className="text-xs text-slate-200 font-medium leading-relaxed">
          {ruleResult.evidence}
        </p>

        {/* Rich Structured Details Breakdown if available */}
        {ruleResult.details?.locations && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0B0F17] p-2.5 rounded border border-white/[0.05] text-[11px] font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Previous Location</span>
              <span className="text-slate-200 font-semibold">{ruleResult.details.locations.prevLocation}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Current Location</span>
              <span className="text-slate-200 font-semibold">{ruleResult.details.locations.currLocation}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Elapsed Time</span>
              <span className="text-amber-400 font-semibold">{ruleResult.details.locations.timeDiffMinutes} minutes</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Required Transit Speed</span>
              <span className="text-rose-400 font-bold">{ruleResult.details.locations.speedKmh.toLocaleString()} km/h</span>
            </div>
          </div>
        )}

        {ruleResult.details?.amountData && (
          <div className="mt-3 grid grid-cols-3 gap-2 bg-[#0B0F17] p-2.5 rounded border border-white/[0.05] text-[11px] font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Attempted Amount</span>
              <span className="text-slate-200 font-semibold">₹{ruleResult.details.amountData.amount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Customer Historical Avg</span>
              <span className="text-slate-200 font-semibold">₹{ruleResult.details.amountData.historicalAvg.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Deviation Multiplier</span>
              <span className="text-rose-400 font-bold">{ruleResult.details.amountData.multiplier}x Average</span>
            </div>
          </div>
        )}

        {ruleResult.details?.velocityData && (
          <div className="mt-3 grid grid-cols-3 gap-2 bg-[#0B0F17] p-2.5 rounded border border-white/[0.05] text-[11px] font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Time Window</span>
              <span className="text-slate-200 font-semibold">{ruleResult.details.velocityData.windowMinutes} minutes</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Transactions Executed</span>
              <span className="text-rose-400 font-bold">{ruleResult.details.velocityData.txCount} txs</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Velocity Threshold</span>
              <span className="text-slate-400 font-semibold">&le; {ruleResult.details.velocityData.threshold} txs</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import type { RuleResult } from '../../types/fraud';
import { Zap, TrendingUp, Compass, Smartphone, Shield } from 'lucide-react';

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

  // Extract evidence description and nested evidence metadata
  const evidenceObj = (typeof ruleResult.evidence === 'object' && ruleResult.evidence !== null)
    ? ruleResult.evidence
    : {};
  const evidenceText = (evidenceObj.description as string) ||
    (typeof ruleResult.evidence === 'string' ? ruleResult.evidence : JSON.stringify(ruleResult.evidence));

  const locations = evidenceObj.locations as {
    prevLocation?: string;
    currLocation?: string;
    timeDiffMinutes?: number;
    speedKmh?: number;
  } | undefined;

  const amountData = evidenceObj.amountData as {
    amount?: number;
    historicalAvg?: number;
    multiplier?: number;
  } | undefined;

  const velocityData = evidenceObj.velocityData as {
    windowMinutes?: number;
    txCount?: number;
    threshold?: number;
  } | undefined;

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
        <p className="text-xs text-slate-200 font-medium leading-relaxed font-mono">
          {evidenceText}
        </p>

        {/* Rich Structured Details Breakdown if available */}
        {locations && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0B0F17] p-2.5 rounded border border-white/[0.05] text-[11px] font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Previous Location</span>
              <span className="text-slate-200 font-semibold">{locations.prevLocation || 'Chennai'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Current Location</span>
              <span className="text-slate-200 font-semibold">{locations.currLocation || 'London'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Elapsed Time</span>
              <span className="text-amber-400 font-semibold">{locations.timeDiffMinutes || 25} minutes</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Required Transit Speed</span>
              <span className="text-rose-400 font-bold">{locations.speedKmh?.toLocaleString() || '5,420'} km/h</span>
            </div>
          </div>
        )}

        {amountData && (
          <div className="mt-3 grid grid-cols-3 gap-2 bg-[#0B0F17] p-2.5 rounded border border-white/[0.05] text-[11px] font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Attempted Amount</span>
              <span className="text-slate-200 font-semibold">₹{amountData.amount?.toLocaleString() || '87,500'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Customer Historical Avg</span>
              <span className="text-slate-200 font-semibold">₹{amountData.historicalAvg?.toLocaleString() || '12,000'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Deviation Multiplier</span>
              <span className="text-rose-400 font-bold">{amountData.multiplier || 7.3}x Average</span>
            </div>
          </div>
        )}

        {velocityData && (
          <div className="mt-3 grid grid-cols-3 gap-2 bg-[#0B0F17] p-2.5 rounded border border-white/[0.05] text-[11px] font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Time Window</span>
              <span className="text-slate-200 font-semibold">{velocityData.windowMinutes || 10} minutes</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Transactions Executed</span>
              <span className="text-rose-400 font-bold">{velocityData.txCount || 6} txs</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Velocity Threshold</span>
              <span className="text-slate-400 font-semibold">&le; {velocityData.threshold || 4} txs</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

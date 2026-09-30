import React from 'react';
import type { RiskLevel } from '../../types/fraud';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface RiskScoreCardProps {
  score: number;
  level: RiskLevel;
  triggeredCount: number;
  totalEvaluatedRules?: number;
}

export const RiskScoreCard: React.FC<RiskScoreCardProps> = ({
  score,
  level,
  triggeredCount,
  totalEvaluatedRules = 5,
}) => {
  const getLevelConfig = () => {
    switch (level) {
      case 'CRITICAL':
        return {
          textColor: 'text-rose-500',
          borderColor: 'border-rose-500/30',
          badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/40',
          barColor: 'bg-rose-500',
          icon: ShieldAlert,
          recommendation: 'Immediate Intervention Required. Freeze high-risk channels and initiate manual caller verification.',
        };
      case 'HIGH':
        return {
          textColor: 'text-orange-500',
          borderColor: 'border-orange-500/30',
          badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/40',
          barColor: 'bg-orange-500',
          icon: AlertTriangle,
          recommendation: 'Priority Review. Significant deviation from baseline user behavioral patterns.',
        };
      case 'MEDIUM':
        return {
          textColor: 'text-amber-500',
          borderColor: 'border-amber-500/30',
          badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/40',
          barColor: 'bg-amber-500',
          icon: AlertTriangle,
          recommendation: 'Moderate Anomaly. Step-up authentication or secondary validation advised.',
        };
      case 'LOW':
      default:
        return {
          textColor: 'text-emerald-500',
          borderColor: 'border-emerald-500/30',
          badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40',
          barColor: 'bg-emerald-500',
          icon: ShieldCheck,
          recommendation: 'Standard risk profile. Auto-approved within tolerance limits.',
        };
    }
  };

  const { textColor, borderColor, badgeBg, barColor, icon: Icon, recommendation } = getLevelConfig();

  return (
    <div className={`bg-[#111827] rounded-lg p-6 border ${borderColor} shadow-card`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Big Score & Level */}
        <div className="flex items-center gap-6">
          <div className="relative flex flex-col items-center justify-center w-28 h-28 rounded-full border-2 border-white/10 bg-[#0B0F17]">
            <span className={`text-4xl font-extrabold font-metric ${textColor}`}>
              {score}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              out of 100
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <span className={`px-3 py-1 rounded text-sm font-bold tracking-wider uppercase border ${badgeBg}`}>
                {level} RISK
              </span>
              <span className="text-xs text-slate-400">
                Decision Engine Confidence: <strong className="text-slate-200">99.4%</strong>
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-300 max-w-xl">
              {recommendation}
            </p>
          </div>
        </div>

        {/* Right: Quick Signal Breakdown */}
        <div className="border-t md:border-t-0 md:border-l border-white/[0.08] pt-4 md:pt-0 md:pl-6 flex flex-col justify-center min-w-[200px]">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Triggered Rules</span>
              <span className="font-mono font-semibold text-slate-200">
                <span className="text-rose-400 font-bold">{triggeredCount}</span> / {totalEvaluatedRules}
              </span>
            </div>
            
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full ${barColor} transition-all duration-300`}
                style={{ width: `${Math.min(100, (score / 100) * 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
              <span>Risk Threshold: &ge;80 (Critical)</span>
              <Icon size={14} className={textColor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

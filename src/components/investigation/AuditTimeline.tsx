import React from 'react';
import type { AuditEvent } from '../../types/fraud';
import { CheckCircle2, AlertTriangle, Eye, ShieldAlert, Cpu, UserCheck } from 'lucide-react';

interface AuditTimelineProps {
  events: AuditEvent[];
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ events }) => {
  const getEventIcon = (type: string, message: string) => {
    if (type === 'DECISION_SUBMITTED' || message.includes('Reviewer updated') || message.includes('CLEAR')) {
      return { icon: UserCheck, color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40' };
    }
    if (type === 'CASE_VIEWED' || message.includes('opened investigation')) {
      return { icon: Eye, color: 'text-indigo-400 bg-indigo-950/60 border-indigo-500/40' };
    }
    if (type === 'ALERT_GENERATED') {
      return { icon: ShieldAlert, color: 'text-rose-400 bg-rose-950/60 border-rose-500/40' };
    }
    if (type === 'SCORE_CALCULATION') {
      return { icon: AlertTriangle, color: 'text-amber-400 bg-amber-950/60 border-amber-500/40' };
    }
    if (type === 'RULE_EVALUATION') {
      return { icon: Cpu, color: 'text-indigo-300 bg-indigo-950/50 border-indigo-500/30' };
    }
    return { icon: CheckCircle2, color: 'text-slate-400 bg-slate-900 border-white/10' };
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const d = new Date(timestamp);
      return `${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}.${d.getMilliseconds().toString().padStart(3, '0')}`;
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="bg-[#111827] border border-white/[0.08] rounded-lg p-5">
      <div className="flow-root">
        <ul className="-mb-8">
          {events.map((event, idx) => {
            const { icon: Icon, color } = getEventIcon(event.type, event.message);
            const isLast = idx === events.length - 1;

            return (
              <li key={event.id || idx}>
                <div className="relative pb-8">
                  {!isLast && (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-white/[0.08]"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex items-start space-x-3">
                    {/* Event Circle / Icon */}
                    <div
                      className={`relative w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${color}`}
                    >
                      <Icon size={14} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-xs text-slate-200 leading-relaxed font-mono">
                          {event.message}
                        </p>
                      </div>
                      <div className="text-right text-[11px] whitespace-nowrap text-slate-400 font-mono">
                        {formatTimestamp(event.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

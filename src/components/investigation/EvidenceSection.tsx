import React from 'react';
import type { Transaction } from '../../types/transaction';
import type { RuleResult } from '../../types/fraud';
import { Network, Laptop, Plane, MapPin, Gauge, ShieldCheck, ArrowRight } from 'lucide-react';

interface EvidenceSectionProps {
  transaction: Transaction;
  ruleResults: RuleResult[];
}

export const EvidenceSection: React.FC<EvidenceSectionProps> = ({
  transaction,
  ruleResults,
}) => {
  const geoRule = ruleResults.find(r => r.ruleId.includes('GEO') || r.ruleName.includes('TRAVEL'));
  const velocityRule = ruleResults.find(r => r.ruleId.includes('VEL'));
  const amountRule = ruleResults.find(r => r.ruleId.includes('AMT'));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Device & Network Telemetry */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            <Laptop size={15} className="text-indigo-400" />
            <span>Device & Network Intelligence</span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded bg-[#0B0F17] border border-white/[0.04]">
              <span className="text-slate-400">Device Hardware ID</span>
              <span className="text-slate-200 font-semibold">{transaction.deviceId}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#0B0F17] border border-white/[0.04]">
              <span className="text-slate-400">Origin IP Address</span>
              <span className="text-indigo-300">{transaction.ipAddress}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#0B0F17] border border-white/[0.04]">
              <span className="text-slate-400">Network Routing</span>
              <span className="text-amber-400 font-medium">Datacenter / Tor Exit Relay Detected</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#0B0F17] border border-white/[0.04]">
              <span className="text-slate-400">Device Integrity Status</span>
              <span className="text-rose-400 font-medium">Unknown Fingerprint (Zero Prior Txs)</span>
            </div>
          </div>
        </div>

        {/* Behavioral Velocity & Amount Profile */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            <Gauge size={15} className="text-indigo-400" />
            <span>Historical Spending & Velocity Profile</span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded bg-[#0B0F17] border border-white/[0.04]">
              <span className="text-slate-400">Customer 90-Day Avg Ticket</span>
              <span className="text-slate-200">₹12,000</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#0B0F17] border border-white/[0.04]">
              <span className="text-slate-400">Current Authorization Ticket</span>
              <span className="text-rose-400 font-bold">₹{transaction.amount.toLocaleString()} (7.3x Avg)</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#0B0F17] border border-white/[0.04]">
              <span className="text-slate-400">10-Minute Velocity Window</span>
              <span className="text-rose-400 font-bold">6 attempts (Threshold: &le;4)</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#0B0F17] border border-white/[0.04]">
              <span className="text-slate-400">Cardholder Behavior Deviation</span>
              <span className="text-rose-400 font-semibold">+340% Variance from Median</span>
            </div>
          </div>
        </div>
      </div>

      {/* Impossible Travel Vector Diagram */}
      <div className="bg-[#111827] border border-white/[0.08] rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            <Plane size={15} className="text-rose-400" />
            <span>Impossible Geographic Vector Analysis</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            Speed Anomaly Exceeded
          </span>
        </div>

        <div className="bg-[#0B0F17] border border-white/[0.05] rounded-lg p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Origin */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-mono">Previous Authorization (T - 25m)</p>
                <p className="text-sm font-bold text-slate-200 font-mono">
                  {geoRule?.details?.locations?.prevLocation || 'Chennai, India'}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">Lat: 13.0827, Lon: 80.2707</p>
              </div>
            </div>

            {/* Flight Vector indicator */}
            <div className="flex flex-col items-center justify-center px-4 w-full md:w-auto">
              <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-xs">
                <span>Distance: ~8,200 km</span>
                <ArrowRight size={14} className="text-rose-500 animate-pulse" />
              </div>
              <div className="w-full md:w-48 h-0.5 bg-rose-500/30 my-1 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-500 rounded-full w-2 h-2" />
              </div>
              <p className="text-[10px] text-rose-400 font-mono">
                Required transit speed: <strong>5,420 km/h</strong> (Max Commercial: 900 km/h)
              </p>
            </div>

            {/* Destination */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-mono">Current Attempt (Now)</p>
                <p className="text-sm font-bold text-slate-200 font-mono">
                  {geoRule?.details?.locations?.currLocation || transaction.locationName}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">Lat: {transaction.latitude}, Lon: {transaction.longitude}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <Plane size={18} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { runSimulation } from '../services/api';
import { RiskBadge } from '../components/common/RiskBadge';
import { RuleResultCard } from '../components/investigation/RuleResultCard';
import { BackendNoticeBanner } from '../components/common/BackendNoticeBanner';
import type { RuleResult, RiskLevel } from '../types/fraud';
import type { Transaction } from '../types/transaction';
import {
  Cpu,
  Play,
  Loader2,
} from 'lucide-react';

interface ScenarioPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  expectedScore: string;
  expectedDecision: string;
}

interface SimulationOutput {
  scenarioName: string;
  transaction: Transaction;
  breakdown: {
    velocity: number;
    amount: number;
    location: number;
    total: number;
  };
  ruleResults: RuleResult[];
  riskScore: number;
  riskLevel: RiskLevel;
  decision: string;
  explanation: string;
}

export const Simulator: React.FC = () => {
  const presets: ScenarioPreset[] = [
    {
      id: 'multi-signal-critical',
      name: '5. Multi-Signal Critical Fraud',
      badge: 'CRITICAL (85)',
      description: 'Simultaneous Velocity burst (+30), High Amount multiplier (+25), and Impossible Travel tele-transport (+30).',
      expectedScore: '85 / 100',
      expectedDecision: 'MANUAL REVIEW',
    },
    {
      id: 'velocity-attack',
      name: '3. Velocity Attack Burst',
      badge: 'HIGH (65)',
      description: '14 rapid micro-authorizations within 3 minutes indicating automated credential testing script.',
      expectedScore: '65 / 100',
      expectedDecision: 'STEP-UP AUTH (OTP / BIOMETRIC)',
    },
    {
      id: 'impossible-travel',
      name: '4. Impossible Travel Anomaly',
      badge: 'HIGH (70)',
      description: 'Geographic speed anomaly between consecutive authorizations requiring >10,000 km/h flight speed.',
      expectedScore: '70 / 100',
      expectedDecision: 'HOLD & CALL CARDHOLDER',
    },
    {
      id: 'high-amount',
      name: '2. High Amount Outlier',
      badge: 'MEDIUM (55)',
      description: 'Single large authorization 12.5x above cardholder historical median ticket size.',
      expectedScore: '55 / 100',
      expectedDecision: 'APPROVAL REQUIRED',
    },
    {
      id: 'normal-transaction',
      name: '1. Normal Transaction',
      badge: 'LOW (6)',
      description: 'Standard domestic daily spending ticket matching cardholder historical habits and registered device.',
      expectedScore: '6 / 100',
      expectedDecision: 'AUTO-APPROVE',
    },
  ];

  const [selectedScenario, setSelectedScenario] = useState<string>('multi-signal-critical');
  const [simulationState, setSimulationState] = useState<'IDLE' | 'INGESTING' | 'EVALUATING' | 'SCORING' | 'COMPLETED'>('IDLE');
  const [simulationResult, setSimulationResult] = useState<SimulationOutput | null>(null);

  const handleRunSimulation = async () => {
    setSimulationState('INGESTING');
    setSimulationResult(null);

    // Realistic step progression
    setTimeout(() => {
      setSimulationState('EVALUATING');
    }, 500);

    setTimeout(() => {
      setSimulationState('SCORING');
    }, 1100);

    setTimeout(async () => {
      const res = (await runSimulation(selectedScenario)) as SimulationOutput;
      setSimulationResult(res);
      setSimulationState('COMPLETED');
    }, 1700);
  };

  return (
    <div className="space-y-6">
      {/* Backend Integration Notice */}
      <BackendNoticeBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Cpu size={20} className="text-indigo-400" />
            <span>Fraud Engine Live Simulator</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            FastAPI endpoint: <code className="text-indigo-400">POST /api/simulator/run</code> &bull; Real-time policy pipeline test
          </p>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={simulationState !== 'IDLE' && simulationState !== 'COMPLETED'}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-mono font-bold tracking-wider rounded transition-colors shadow-glow-indigo uppercase self-start sm:self-auto"
        >
          {simulationState === 'IDLE' || simulationState === 'COMPLETED' ? (
            <>
              <Play size={14} className="fill-white" />
              <span>RUN FRAUD SIMULATION</span>
            </>
          ) : (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>EVALUATING PIPELINE...</span>
            </>
          )}
        </button>
      </div>

      {/* Preset Scenario Selector Buttons */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
          Select Fraud Attack Vector Scenario
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {presets.map((preset) => {
            const isSelected = selectedScenario === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedScenario(preset.id);
                  if (simulationState === 'COMPLETED') {
                    setSimulationResult(null);
                    setSimulationState('IDLE');
                  }
                }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                    : 'bg-[#111827] border-white/[0.06] hover:border-white/[0.15]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-xs font-bold font-mono truncate ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>
                    {preset.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 block mb-1">
                  Expected: <strong className="text-slate-300">{preset.badge}</strong>
                </span>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Pipeline Stepper Indicator */}
      <div className="bg-[#111827] border border-white/[0.08] rounded-lg p-4">
        <div className="grid grid-cols-4 gap-2 text-xs font-mono">
          <div className={`p-2.5 rounded border flex items-center gap-2 ${
            simulationState !== 'IDLE' ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-300' : 'bg-[#0B0F17] border-white/[0.04] text-slate-400'
          }`}>
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px]">1</span>
            <span className="truncate">Transaction Ingestion</span>
          </div>

          <div className={`p-2.5 rounded border flex items-center gap-2 ${
            simulationState === 'EVALUATING' || simulationState === 'SCORING' || simulationState === 'COMPLETED'
              ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-300'
              : 'bg-[#0B0F17] border-white/[0.04] text-slate-400'
          }`}>
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px]">2</span>
            <span className="truncate">Rules Evaluating</span>
          </div>

          <div className={`p-2.5 rounded border flex items-center gap-2 ${
            simulationState === 'SCORING' || simulationState === 'COMPLETED'
              ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-300'
              : 'bg-[#0B0F17] border-white/[0.04] text-slate-400'
          }`}>
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px]">3</span>
            <span className="truncate">Score Computation</span>
          </div>

          <div className={`p-2.5 rounded border flex items-center gap-2 ${
            simulationState === 'COMPLETED'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold'
              : 'bg-[#0B0F17] border-white/[0.04] text-slate-400'
          }`}>
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px]">4</span>
            <span className="truncate">Adjudication Decision</span>
          </div>
        </div>
      </div>

      {/* Main Simulation Output Display */}
      {simulationResult ? (
        <div className="space-y-5 animate-in fade-in">
          {/* Top Decision & Score Banner */}
          <div className={`rounded-lg p-6 border ${
            simulationResult.riskLevel === 'CRITICAL'
              ? 'bg-[#150F18] border-rose-500/40 shadow-glow-red'
              : simulationResult.riskLevel === 'HIGH'
              ? 'bg-[#151218] border-orange-500/40'
              : simulationResult.riskLevel === 'MEDIUM'
              ? 'bg-[#151418] border-amber-500/40'
              : 'bg-[#0D1815] border-emerald-500/40'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-[#0B0F17] border-2 border-white/10 flex flex-col items-center justify-center shrink-0">
                  <span className={`text-3xl font-extrabold font-metric ${
                    simulationResult.riskLevel === 'CRITICAL' ? 'text-rose-500' :
                    simulationResult.riskLevel === 'HIGH' ? 'text-orange-500' :
                    simulationResult.riskLevel === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {simulationResult.riskScore}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">/ 100</span>
                </div>

                <div>
                  <div className="flex items-center gap-2.5">
                    <RiskBadge level={simulationResult.riskLevel} size="lg" />
                    <span className="px-3 py-1 rounded bg-slate-800 border border-white/10 font-mono font-bold text-xs text-white">
                      DECISION: {simulationResult.decision}
                    </span>
                  </div>
                  <h3 className="text-base font-bold font-mono text-white mt-2">
                    {simulationResult.scenarioName}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl font-mono leading-relaxed">
                    {simulationResult.explanation}
                  </p>
                </div>
              </div>

              {/* Point Breakdown Table */}
              <div className="border-t md:border-t-0 md:border-l border-white/[0.1] pt-3 md:pt-0 md:pl-6 text-xs font-mono min-w-[220px]">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-2 font-semibold">
                  Signal Accumulator
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Velocity Signal:</span>
                    <span className={simulationResult.breakdown.velocity > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                      +{simulationResult.breakdown.velocity} pts
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount Signal:</span>
                    <span className={simulationResult.breakdown.amount > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                      +{simulationResult.breakdown.amount} pts
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Impossible Travel:</span>
                    <span className={simulationResult.breakdown.location > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                      +{simulationResult.breakdown.location} pts
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/[0.08] font-bold text-white">
                    <span>Total Calculated Risk:</span>
                    <span className="text-rose-400 font-mono">{simulationResult.riskScore} / 100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Simulated Ingested Transaction Details */}
          <div className="bg-[#111827] border border-white/[0.08] rounded-lg p-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-3">
              Simulated Ingestion Payload Attributes (PostgreSQL Record)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-[#0B0F17] rounded border border-white/[0.04]">
                <span className="text-[10px] text-slate-400 block mb-0.5">Transaction ID</span>
                <span className="text-indigo-400 font-semibold">{simulationResult.transaction.id}</span>
              </div>
              <div className="p-3 bg-[#0B0F17] rounded border border-white/[0.04]">
                <span className="text-[10px] text-slate-400 block mb-0.5">Account / Target</span>
                <span className="text-slate-200">{simulationResult.transaction.accountId}</span>
              </div>
              <div className="p-3 bg-[#0B0F17] rounded border border-white/[0.04]">
                <span className="text-[10px] text-slate-400 block mb-0.5">Amount Ticket</span>
                <span className="text-slate-200 font-bold">
                  ₹{simulationResult.transaction.amount.toLocaleString()} ({simulationResult.transaction.currency})
                </span>
              </div>
              <div className="p-3 bg-[#0B0F17] rounded border border-white/[0.04]">
                <span className="text-[10px] text-slate-400 block mb-0.5">Location & Merchant</span>
                <span className="text-slate-200 truncate block">
                  {simulationResult.transaction.locationName}
                </span>
              </div>
            </div>
          </div>

          {/* Triggered Rule Explainability Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Evaluated Rule Assertions & Explainable Evidence
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {simulationResult.ruleResults.map((r) => (
                <RuleResultCard key={r.id} ruleResult={r} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#111827] border border-white/[0.08] rounded-lg p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-indigo-950/50 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-3">
            <Cpu size={22} />
          </div>
          <h3 className="text-sm font-bold font-mono text-slate-200">
            Engine Ready for Simulation
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4 font-mono">
            Select an attack scenario above and click &quot;RUN FRAUD SIMULATION&quot; to execute real-time policy evaluation.
          </p>
          <button
            onClick={handleRunSimulation}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold tracking-wider rounded transition-colors shadow-sm"
          >
            <Play size={14} className="fill-white" />
            <span>RUN FRAUD SIMULATION NOW</span>
          </button>
        </div>
      )}
    </div>
  );
};

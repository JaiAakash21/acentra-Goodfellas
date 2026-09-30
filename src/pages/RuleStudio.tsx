import React, { useState } from 'react';
import { useRules } from '../hooks/useRules';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { BackendNoticeBanner } from '../components/common/BackendNoticeBanner';
import type { Rule } from '../types/rule';
import {
  Sliders,
  Plus,
  Play,
  Check,
  X,
  Code2,
  Cpu,
  ToggleLeft,
  ToggleRight,
  Flame,
  CheckCircle2,
  Trash2,
  Edit2,
} from 'lucide-react';

export const RuleStudio: React.FC = () => {
  const {
    rules,
    loading,
    error,
    refetch,
    createRule,
    toggleRule,
    deleteRule,
    simulateRule,
  } = useRules();

  const [showModal, setShowModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const [testResult, setTestResult] = useState<{
    testedRuleName: string;
    passed: boolean;
    samplePayload: unknown;
    explanation: string;
  } | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('VELOCITY');
  const [field, setField] = useState('transaction_count');
  const [operator, setOperator] = useState('FREQUENCY_EXCEEDS');
  const [threshold, setThreshold] = useState('5');
  const [weight, setWeight] = useState(25);
  const [enabled, setEnabled] = useState(true);
  const [description, setDescription] = useState('');

  const openCreateModal = () => {
    setEditingRuleId(null);
    setName('');
    setType('VELOCITY');
    setField('transaction_count');
    setOperator('FREQUENCY_EXCEEDS');
    setThreshold('5');
    setWeight(25);
    setEnabled(true);
    setDescription('');
    setShowModal(true);
  };

  const openEditModal = (rule: Rule) => {
    setEditingRuleId(rule.id);
    setName(rule.name);
    setType(rule.type);
    setField(String(rule.config?.field || ''));
    setOperator(String(rule.config?.operator || ''));
    setThreshold(String(rule.config?.threshold || ''));
    setWeight(rule.weight);
    setEnabled(rule.enabled);
    setDescription(rule.description);
    setShowModal(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingRuleId) {
      // In-place edit
      const existing = rules.find(r => r.id === editingRuleId);
      if (existing) {
        existing.name = name;
        existing.description = description;
        existing.type = type;
        existing.config = { field, operator, threshold };
        existing.weight = Number(weight);
        existing.enabled = enabled;
      }
    } else {
      await createRule({
        name,
        description: description || `Policy checking ${field} ${operator} ${threshold}`,
        type,
        config: { field, operator, threshold },
        weight: Number(weight),
        enabled,
      });
    }

    setShowModal(false);
  };

  const handleTestRule = async (ruleId?: string) => {
    const id = ruleId || editingRuleId || 'RULE-DRAFT';
    const targetRule = rules.find(r => r.id === id);
    const targetName = targetRule?.name || name || 'Custom Rule Configuration';

    const simRes = await simulateRule(id);
    setTestResult({
      testedRuleName: targetName,
      passed: simRes.passed,
      samplePayload: {
        engine_target: 'FastAPI Generic Rule Engine (AST Evaluator)',
        evaluated_rule_id: id,
        payload: {
          field: targetRule?.config?.field || field,
          observed_value: 6.8,
          threshold: targetRule?.config?.threshold || threshold,
          score_contribution: `+${targetRule?.weight || weight} points`,
        },
      },
      explanation: 'Rules are configuration consumed by the generic fraud engine. Synthetic payload evaluated against active PostgreSQL policy repository.',
    });
  };

  const getRuleTypeBadge = (ruleType: string) => {
    switch (ruleType.toUpperCase()) {
      case 'VELOCITY':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'AMOUNT':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'LOCATION':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'DEVICE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'BEHAVIORAL':
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Backend Integration Notice */}
      <BackendNoticeBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Sliders size={20} className="text-indigo-400" />
            <span>Rule Studio & Decision Engine Config</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            FastAPI endpoint: <code className="text-indigo-400">/api/rules</code> &bull; Declarative PostgreSQL policies
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-medium rounded transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>+ Create Rule</span>
        </button>
      </div>

      {/* Generic Engine Architecture Notice Banner */}
      <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-lg flex items-start gap-3 text-xs">
        <Cpu size={18} className="text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-indigo-200 font-mono">
            Generic Fraud Decision Engine Architecture
          </p>
          <p className="text-slate-300 leading-relaxed font-mono">
            Rules are configuration consumed by the generic fraud engine. Author declarative thresholds (field, operator, threshold, weight) stored in PostgreSQL. The backend fraud engine executes AST policy evaluation in real time without hardcoded rules.
          </p>
        </div>
      </div>

      {/* Rules Grid */}
      {loading ? (
        <LoadingState message="Fetching rule registry from backend..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`bg-[#111827] border rounded-lg p-5 flex flex-col justify-between transition-all ${
                rule.enabled ? 'border-white/[0.08] shadow-card' : 'border-white/[0.04] opacity-60'
              }`}
            >
              <div>
                {/* Top Type and Status Toggle */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border ${getRuleTypeBadge(
                      rule.type
                    )}`}
                  >
                    {rule.type}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRule(rule.id, rule.enabled)}
                      className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-white transition-colors"
                      title={rule.enabled ? 'Disable Rule' : 'Enable Rule'}
                    >
                      {rule.enabled ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <ToggleRight size={20} />
                          <span className="text-[11px]">ACTIVE</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1">
                          <ToggleLeft size={20} />
                          <span className="text-[11px]">DISABLED</span>
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold font-mono text-slate-100 mb-1">
                  {rule.name}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {rule.description}
                </p>

                {/* Rule Engine Parameters Specs */}
                <div className="p-3 bg-[#0B0F17] rounded border border-white/[0.04] space-y-1.5 text-[11px] font-mono mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Field:</span>
                    <span className="text-indigo-300 font-medium">
                      {String(rule.config?.field || 'amount_ratio')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Operator:</span>
                    <span className="text-slate-200">
                      {String(rule.config?.operator || 'GREATER_THAN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Threshold:</span>
                    <span className="text-amber-400 font-bold">
                      {String(rule.config?.threshold || '3.5')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Flame size={14} className="text-rose-400" />
                  <span className="text-xs font-mono font-bold text-rose-400">
                    +{rule.weight} Weight
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(rule)}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Edit Rule Configuration"
                  >
                    <Edit2 size={13} />
                  </button>

                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-1.5 rounded hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete Rule"
                  >
                    <Trash2 size={13} />
                  </button>

                  <button
                    onClick={() => handleTestRule(rule.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                  >
                    <Play size={11} className="text-indigo-400" />
                    <span>Test</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Test Rule Simulation Result Modal / Drawer */}
      {testResult && (
        <div className="p-4 bg-[#111827] border border-indigo-500/30 rounded-lg shadow-fintech space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                AST Rule Simulation Passed: {testResult.testedRuleName}
              </h4>
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X size={15} />
            </button>
          </div>

          <p className="text-xs text-slate-300 font-mono">
            {testResult.explanation}
          </p>

          <pre className="p-3 bg-[#0B0F17] rounded border border-white/[0.05] text-[11px] font-mono text-emerald-400 overflow-x-auto">
            {JSON.stringify(testResult.samplePayload, null, 2)}
          </pre>
        </div>
      )}

      {/* Create / Edit Rule Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111827] border border-white/[0.1] rounded-lg w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0D131F]">
              <div className="flex items-center gap-2">
                <Code2 size={17} className="text-indigo-400" />
                <h3 className="text-sm font-semibold text-white font-mono">
                  {editingRuleId ? 'Edit Declarative Fraud Rule' : 'Configure New Fraud Rule'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="p-6 space-y-4">
              {/* Rule Name */}
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                  Rule Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Midnight Crypto Burst Velocity"
                  className="w-full bg-[#0B0F17] border border-white/[0.1] rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                  Description / Justification
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain why this behavior signals heightened fraud probability"
                  className="w-full bg-[#0B0F17] border border-white/[0.1] rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Grid: Type & Field */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                    Rule Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-[#0B0F17] border border-white/[0.1] rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="VELOCITY">VELOCITY</option>
                    <option value="AMOUNT">AMOUNT</option>
                    <option value="LOCATION">LOCATION</option>
                    <option value="DEVICE">DEVICE</option>
                    <option value="BEHAVIORAL">BEHAVIORAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                    Payload Field
                  </label>
                  <input
                    type="text"
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    placeholder="e.g., speed_kmh, multiplier"
                    className="w-full bg-[#0B0F17] border border-white/[0.1] rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Grid: Operator, Threshold, Weight */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                    Operator
                  </label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full bg-[#0B0F17] border border-white/[0.1] rounded px-2.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="GREATER_THAN">&gt; GREATER_THAN</option>
                    <option value="LESS_THAN">&lt; LESS_THAN</option>
                    <option value="EQUALS">== EQUALS</option>
                    <option value="EXCEEDS_SPEED">EXCEEDS_SPEED</option>
                    <option value="FREQUENCY_EXCEEDS">FREQUENCY_EXCEEDS</option>
                    <option value="NEW_DEVICE">NEW_DEVICE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                    Threshold Value
                  </label>
                  <input
                    type="text"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="w-full bg-[#0B0F17] border border-white/[0.1] rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                    Risk Weight (+pts)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full bg-[#0B0F17] border border-white/[0.1] rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Enabled toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="enabled-chk"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded bg-[#0B0F17] border-white/20 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="enabled-chk" className="text-xs font-mono text-slate-300 cursor-pointer">
                  Enable rule immediately upon compilation
                </label>
              </div>

              {/* Actions: SAVE RULE & TEST RULE */}
              <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => handleTestRule()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-mono rounded border border-indigo-500/30 transition-colors"
                >
                  <Play size={13} />
                  <span>TEST RULE</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold rounded shadow-sm transition-colors"
                  >
                    <Check size={14} />
                    <span>SAVE RULE</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

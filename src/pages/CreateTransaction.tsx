import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTransaction } from '../services/api';
import type { TransactionCreatePayload, TransactionWithFraud } from '../types/transaction';
import { BackendNoticeBanner } from '../components/common/BackendNoticeBanner';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Send,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  HelpCircle,
  Clock,
  DollarSign,
  User,
  Building,
  Tag,
  MapPin,
  Globe,
} from 'lucide-react';

export const CreateTransaction: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const initialForm: TransactionCreatePayload = {
    customer_id: '',
    amount: '' as unknown as number,
    currency: 'INR',
    merchant: '',
    category: '',
    city: '',
    country: 'India',
    latitude: '' as unknown as number,
    longitude: '' as unknown as number,
    timestamp: new Date().toISOString().slice(0, 19),
  };

  const [formData, setFormData] = useState<TransactionCreatePayload>(initialForm);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TransactionWithFraud | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'amount' || name === 'latitude' || name === 'longitude'
          ? value === ''
            ? ''
            : Number(value)
          : value,
    }));
  };

  const handleReset = () => {
    setFormData({
      ...initialForm,
      timestamp: new Date().toISOString().slice(0, 19),
    });
    setError(null);
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!formData.customer_id.trim()) {
      setError('Customer ID is required.');
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    // Latitude & Longitude must both be provided if one is given
    const hasLat = formData.latitude !== '' && formData.latitude !== undefined;
    const hasLon = formData.longitude !== '' && formData.longitude !== undefined;
    if (hasLat !== hasLon) {
      setError('Both Latitude and Longitude must be provided together, or leave both empty.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: TransactionCreatePayload = {
        customer_id: formData.customer_id.trim(),
        amount: Number(formData.amount),
        currency: formData.currency || 'INR',
        merchant: formData.merchant?.trim() || undefined,
        category: formData.category?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        country: formData.country?.trim() || undefined,
        latitude: hasLat ? Number(formData.latitude) : undefined,
        longitude: hasLon ? Number(formData.longitude) : undefined,
        timestamp: formData.timestamp ? new Date(formData.timestamp).toISOString() : new Date().toISOString(),
      };

      const res = await createTransaction(payload);
      setResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to evaluate transaction';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Backend Integration Banner */}
      <BackendNoticeBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <PlusCircle size={22} className="text-indigo-400" />
            <h1 className="text-xl font-bold tracking-tight text-white font-mono">
              Create & Evaluate Transaction
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Direct ingestion route &bull; Evaluated synchronously via Member 1 Fraud Engine &amp; PostgreSQL policies
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs font-mono text-rose-300">
          <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block text-rose-200">Evaluation Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Result Card (When evaluated) */}
      {result && (
        <div className="bg-[#111827] border border-white/[0.12] rounded-lg p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              {result.riskLevel === 'CRITICAL' || result.riskLevel === 'HIGH' ? (
                <ShieldAlert size={20} className="text-rose-400" />
              ) : result.riskLevel === 'MEDIUM' ? (
                <AlertTriangle size={20} className="text-amber-400" />
              ) : (
                <ShieldCheck size={20} className="text-emerald-400" />
              )}
              <h2 className="text-sm font-bold font-mono text-white">
                Engine Decision: {result.riskLevel} RISK ({result.riskScore} / 100)
              </h2>
              <StatusBadge status={result.status} size="sm" />
            </div>

            <button
              onClick={() => navigate(`/investigation/${result.id}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              <span>Open Investigation Docket</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 bg-[#0B0F17] rounded border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 block mb-0.5">Transaction ID</span>
              <span className="font-bold text-slate-200">{result.id}</span>
            </div>
            <div className="p-2.5 bg-[#0B0F17] rounded border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 block mb-0.5">Risk Score</span>
              <span className={`font-bold ${result.riskScore >= 80 ? 'text-rose-400' : result.riskScore >= 25 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {result.riskScore} / 100
              </span>
            </div>
            <div className="p-2.5 bg-[#0B0F17] rounded border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 block mb-0.5">Triggered Rules</span>
              <span className="font-bold text-slate-200">{result.triggeredRuleCount}</span>
            </div>
            <div className="p-2.5 bg-[#0B0F17] rounded border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 block mb-0.5">Status</span>
              <span className="font-bold text-slate-200">{result.status}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-[#111827] border border-white/[0.08] rounded-lg p-6 space-y-6">
        {/* Required Fields Section */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-3">
            <User size={14} className="text-indigo-400" />
            <span>Required Attributes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Customer ID <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                placeholder="e.g. CUST-9821, DEMO-NORMAL-001"
                required
                className="w-full bg-[#0B0F17] border border-white/[0.1] rounded px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Amount <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="e.g. 2500.00"
                  required
                  className="w-full bg-[#0B0F17] border border-white/[0.1] rounded px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Optional Fields Section */}
        <div className="pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-3">
            <Building size={14} className="text-indigo-400" />
            <span>Optional Metadata Attributes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">Currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full bg-[#0B0F17] border border-white/[0.1] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">Merchant</label>
              <input
                type="text"
                name="merchant"
                value={formData.merchant}
                onChange={handleChange}
                placeholder="e.g. Amazon, Swiggy, Apple"
                className="w-full bg-[#0B0F17] border border-white/[0.1] rounded px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. retail, travel, electronics"
                className="w-full bg-[#0B0F17] border border-white/[0.1] rounded px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Location & Coordinates */}
        <div className="pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-3">
            <MapPin size={14} className="text-indigo-400" />
            <span>Geographic & Spatial Attributes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Chennai, London"
                className="w-full bg-[#0B0F17] border border-white/[0.1] rounded px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="e.g. India, UK"
                className="w-full bg-[#0B0F17] border border-white/[0.1] rounded px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">Latitude</label>
              <input
                type="number"
                step="0.0001"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="e.g. 13.0827"
                className="w-full bg-[#0B0F17] border border-white/[0.1] rounded px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">Longitude</label>
              <input
                type="number"
                step="0.0001"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="e.g. 80.2707"
                className="w-full bg-[#0B0F17] border border-white/[0.1] rounded px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Timestamp */}
        <div className="pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-3">
            <Clock size={14} className="text-indigo-400" />
            <span>Timestamp</span>
          </div>

          <div className="max-w-xs">
            <input
              type="datetime-local"
              name="timestamp"
              value={formData.timestamp}
              onChange={handleChange}
              className="w-full bg-[#0B0F17] border border-white/[0.1] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded text-xs font-mono font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 shadow-sm"
          >
            <Send size={13} />
            <span>{submitting ? 'Evaluating Pipeline...' : 'Evaluate Transaction'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

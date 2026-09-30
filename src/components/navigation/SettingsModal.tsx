import React, { useState } from 'react';
import { X, Server, Database, Shield, Sliders, Check } from 'lucide-react';
import { isFirebaseConfigured } from '../../services/firebase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [fastApiEndpoint, setFastApiEndpoint] = useState('http://localhost:8000/api/v1');
  const [autoRefreshSecs, setAutoRefreshSecs] = useState('15');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#111827] border border-white/[0.1] rounded-lg w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0D131F]">
          <div className="flex items-center gap-2.5">
            <Sliders size={18} className="text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Console & Integration Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/[0.05] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Architecture Decoupling Note */}
          <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-md text-xs text-indigo-300 flex items-start gap-2.5">
            <Shield size={16} className="text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-indigo-200">Decoupled Architecture Ready</p>
              <p className="text-indigo-300/80 mt-0.5 leading-relaxed">
                The frontend communicates exclusively via the abstraction layer in <code className="font-mono text-[11px] text-white">src/services/api.ts</code>. Swapping mock data with live FastAPI endpoints requires zero UI component changes.
              </p>
            </div>
          </div>

          {/* FastAPI Endpoint Config */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Server size={14} className="text-slate-400" />
              <span>FastAPI Backend URL (Target Engine)</span>
            </label>
            <input
              type="text"
              value={fastApiEndpoint}
              onChange={(e) => setFastApiEndpoint(e.target.value)}
              className="w-full bg-[#0B0F17] border border-white/[0.1] rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="http://localhost:8000/api/v1"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Currently running in local mock simulation mode for frontend review.
            </p>
          </div>

          {/* Firebase Status */}
          <div className="pt-2 border-t border-white/[0.06]">
            <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
              <Database size={14} className="text-slate-400" />
              <span>Firebase Cloud Telemetry</span>
            </label>
            <div className="flex items-center justify-between p-3 bg-[#0B0F17] rounded border border-white/[0.08]">
              <div>
                <p className="text-xs font-medium text-slate-200">Firebase Initialization</p>
                <p className="text-[11px] text-slate-400">
                  {isFirebaseConfigured ? 'Connected to live Firebase project' : 'Running in offline fallback mode (Mock Safe)'}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                isFirebaseConfigured
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {isFirebaseConfigured ? 'Active' : 'Offline/Mock'}
              </span>
            </div>
          </div>

          {/* Review Stream Refresh Interval */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Telemetry Polling Frequency
            </label>
            <select
              value={autoRefreshSecs}
              onChange={(e) => setAutoRefreshSecs(e.target.value)}
              className="w-full bg-[#0B0F17] border border-white/[0.1] rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="5">Every 5 seconds (High Intensity)</option>
              <option value="15">Every 15 seconds (Standard)</option>
              <option value="60">Every 60 seconds (Conserve)</option>
              <option value="0">Manual Refresh Only</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.05] rounded transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded transition-colors"
            >
              {saved ? (
                <>
                  <Check size={14} />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Preferences</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

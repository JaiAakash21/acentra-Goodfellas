import React, { useState } from 'react';
import { X, Server, Database, Shield, Sliders, Check, BellRing } from 'lucide-react';
import { config } from '../../config/env';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [fastApiEndpoint, setFastApiEndpoint] = useState(config.apiBaseUrl);
  const [useMockMode, setUseMockMode] = useState(config.useMockData);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    config.apiBaseUrl = fastApiEndpoint;
    config.useMockData = useMockMode;
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
            <h3 className="text-sm font-semibold text-white font-mono">Backend Integration Switchboard</h3>
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
              <p className="font-semibold text-indigo-200 font-mono">FastAPI + PostgreSQL Architecture</p>
              <p className="text-indigo-300/80 mt-0.5 leading-relaxed">
                The frontend communicates exclusively via the abstraction layer in <code className="font-mono text-[11px] text-white">src/services/api.ts</code>. Connecting to the live FastAPI backend or running offline in mock demo mode requires zero changes to React pages.
              </p>
            </div>
          </div>

          {/* FastAPI Endpoint Config */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5 font-mono">
              <Server size={14} className="text-slate-400" />
              <span>FastAPI Backend Base URL</span>
            </label>
            <input
              type="text"
              value={fastApiEndpoint}
              onChange={(e) => setFastApiEndpoint(e.target.value)}
              className="w-full bg-[#0B0F17] border border-white/[0.1] rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="http://localhost:8000"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Controlled by <code className="text-indigo-400">VITE_API_BASE_URL</code> environment variable.
            </p>
          </div>

          {/* Data Source Mode Toggle */}
          <div className="p-3 bg-[#0B0F17] rounded border border-white/[0.08] flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-200 font-mono">Data Source Mode</p>
              <p className="text-[11px] text-slate-400">
                {useMockMode ? 'Using in-memory mock dataset' : 'Sending live HTTP calls to FastAPI'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUseMockMode(!useMockMode)}
              className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                useMockMode
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {useMockMode ? 'MOCK MODE' : 'LIVE API'}
            </button>
          </div>

          {/* PostgreSQL & AWS Notifications Specs */}
          <div className="pt-2 border-t border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between p-2.5 bg-[#0B0F17] rounded border border-white/[0.05] text-xs font-mono">
              <div className="flex items-center gap-2">
                <Database size={14} className="text-indigo-400" />
                <span className="text-slate-300">Persistence Store:</span>
              </div>
              <span className="text-slate-200 font-semibold">PostgreSQL (SQLAlchemy)</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#0B0F17] rounded border border-white/[0.05] text-xs font-mono">
              <div className="flex items-center gap-2">
                <BellRing size={14} className="text-indigo-400" />
                <span className="text-slate-300">Alert Dispatcher:</span>
              </div>
              <span className="text-slate-200 font-semibold">AWS SNS / SES Alerts</span>
            </div>
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

import React from 'react';
import { Server, Database, Info } from 'lucide-react';
import { config } from '../../config/env';

interface BackendNoticeBannerProps {
  isOffline?: boolean;
}

export const BackendNoticeBanner: React.FC<BackendNoticeBannerProps> = ({ isOffline = false }) => {
  return (
    <div className="bg-[#111827] border border-indigo-500/20 rounded-md px-3.5 py-2 flex items-center justify-between text-xs font-mono text-slate-300">
      <div className="flex items-center gap-2">
        <Server size={14} className="text-indigo-400 shrink-0" />
        <span>
          Target Backend: <strong className="text-indigo-300">{config.apiBaseUrl}</strong> (FastAPI + PostgreSQL)
        </span>
      </div>
      <div className="flex items-center gap-2 text-[11px]">
        <Database size={12} className="text-slate-400" />
        <span
          className={`flex items-center gap-1 font-semibold ${
            !config.useMockData && !isOffline
              ? 'text-emerald-400'
              : isOffline
              ? 'text-rose-400'
              : 'text-amber-400'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              !config.useMockData && !isOffline
                ? 'bg-emerald-500 animate-pulse'
                : isOffline
                ? 'bg-rose-500'
                : 'bg-amber-500 animate-pulse'
            }`}
          />
          <span>
            {!config.useMockData && !isOffline
              ? 'LIVE FASTAPI MODE (CONNECTED)'
              : isOffline
              ? 'BACKEND OFFLINE — DEMO MODE'
              : 'MOCK PREVIEW (FASTAPI READY)'}
          </span>
        </span>
      </div>
    </div>
  );
};


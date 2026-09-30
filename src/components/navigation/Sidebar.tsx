import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  Sliders,
  Cpu,
  Settings,
  Shield,
  Activity,
  CheckCircle,
  PlusCircle,
} from 'lucide-react';

interface SidebarProps {
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings }) => {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transactions/new', label: 'Create Transaction', icon: PlusCircle },
    { to: '/reviews', label: 'Review Queue', icon: ShieldAlert, badge: '64' },
    { to: '/rules', label: 'Rule Studio', icon: Sliders },
    { to: '/simulator', label: 'Fraud Simulator', icon: Cpu },
  ];

  return (
    <aside className="w-64 bg-[#0D131F] border-r border-white/[0.08] flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Shield size={20} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white font-mono">FraudLens</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">v1.2</span>
            </div>
            <p className="text-[10px] tracking-wide text-slate-400 uppercase font-medium">Reviewer Console</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Operations
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* System Status & Settings Footer */}
      <div className="p-3 border-t border-white/[0.08] space-y-2">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
        >
          <Settings size={15} />
          <span>Console Settings</span>
        </button>

        {/* Real-time System Status Indicator */}
        <div className="p-3 bg-[#111827] rounded-md border border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Engine Status</span>
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>LIVE</span>
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Activity size={10} className="text-indigo-400" />
              <span>Latency: 18ms</span>
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <CheckCircle size={10} className="text-emerald-400" />
              <span>Stream: OK</span>
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

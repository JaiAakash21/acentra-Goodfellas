import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { TransactionTable } from '../components/tables/TransactionTable';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import type { TransactionWithFraud } from '../types/transaction';
import {
  CreditCard,
  Flag,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Activity,
  ArrowUpRight,
  Shield,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
} from 'recharts';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<{
    kpis: {
      totalTransactions: number;
      flagged: number;
      highRisk: number;
      critical: number;
      pendingReview: number;
    };
    trendData: any[];
    riskDistribution: any[];
    recentHighRisk: TransactionWithFraud[];
    recentAuditEvents: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getDashboardData();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load telemetry metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingState message="Fetching real-time fraud metrics & telemetry..." />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Unable to connect to fraud decision engine'} onRetry={fetchDashboard} />;
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <span>Executive Risk Overview</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time fraud decision telemetry, behavioral velocity tracking, and high-risk case routing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/simulator"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded border border-white/[0.1] transition-colors"
          >
            <span>Run Simulator</span>
            <ArrowUpRight size={13} />
          </Link>
          <Link
            to="/reviews"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-medium rounded transition-colors shadow-sm"
          >
            <span>Open Review Queue</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatCard
          title="Total Transactions"
          value={data.kpis.totalTransactions}
          subtext="24-hour volume"
          icon={CreditCard}
          variant="default"
        />
        <StatCard
          title="Flagged Cases"
          value={data.kpis.flagged}
          subtext="3.5% flag rate"
          icon={Flag}
          variant="warning"
        />
        <StatCard
          title="High Risk"
          value={data.kpis.highRisk}
          subtext="Elevated watch"
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Critical Cases"
          value={data.kpis.critical}
          subtext="Immediate review"
          icon={AlertOctagon}
          variant="danger"
        />
        <StatCard
          title="Pending Reviews"
          value={data.kpis.pendingReview}
          subtext="Action required"
          icon={Clock}
          variant="info"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fraud Trend Chart (2 columns) */}
        <div className="lg:col-span-2 bg-[#111827] border border-white/[0.08] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Activity size={15} className="text-indigo-400" />
                <span>24H Transaction Volume & Fraud Spike Correlation</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Real-time ingestion rate vs automated risk flags raised
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500/50" />
                <span>Volume</span>
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span>Flagged</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="flagGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalVolume"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#volGradient)"
                  name="Volume"
                />
                <Area
                  type="monotone"
                  dataKey="flaggedCount"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#flagGradient)"
                  name="Flagged"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Chart (1 column) */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-lg p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers size={15} className="text-indigo-400" />
              <span>Risk Tier Distribution</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Population breakdown by risk score bracket
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.riskDistribution}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  formatter={(val: any) => [Number(val).toLocaleString(), 'Transactions']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data.riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent High Risk Table & Recent Audit Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent High Risk Table (2 columns) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <AlertOctagon size={15} className="text-rose-400" />
              <span>Recent Critical & High Risk Interceptions</span>
            </h2>
            <Link
              to="/reviews"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1"
            >
              <span>View full queue</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
          <TransactionTable transactions={data.recentHighRisk} />
        </div>

        {/* Live Audit Events Stream (1 column) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Shield size={15} className="text-indigo-400" />
              <span>System & Audit Trail</span>
            </h2>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              STREAM LIVE
            </span>
          </div>

          <div className="bg-[#111827] border border-white/[0.08] rounded-lg p-4 space-y-3 max-h-[480px] overflow-y-auto">
            {data.recentAuditEvents.map((event) => (
              <div
                key={event.id}
                className="p-3 bg-[#0B0F17] rounded border border-white/[0.05] hover:border-white/[0.1] transition-colors"
              >
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="text-indigo-400 font-semibold">{event.transactionId}</span>
                  <span className="text-slate-400">
                    {new Date(event.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed">
                  {event.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

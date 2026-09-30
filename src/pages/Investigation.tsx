import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useInvestigation } from '../hooks/useInvestigation';
import { RiskScoreCard } from '../components/common/RiskScoreCard';
import { RuleResultCard } from '../components/investigation/RuleResultCard';
import { EvidenceSection } from '../components/investigation/EvidenceSection';
import { AuditTimeline } from '../components/investigation/AuditTimeline';
import { ReviewDecisionBox } from '../components/investigation/ReviewDecisionBox';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { BackendNoticeBanner } from '../components/common/BackendNoticeBanner';
import {
  ArrowLeft,
  Calendar,
  Building,
  MapPin,
  Smartphone,
  Globe,
  Wallet,
  Clock,
  HelpCircle,
  FileCheck2,
} from 'lucide-react';

export const Investigation: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const {
    transaction,
    flag,
    rules,
    auditLogs,
    loading,
    error,
    refetch,
    handleDecision,
  } = useInvestigation(transactionId);

  if (loading) {
    return <LoadingState message={`Retrieving case docket for ${transactionId} via API...`} />;
  }

  if (error || !transaction || !flag) {
    return (
      <div className="space-y-4">
        <Link
          to="/reviews"
          className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-mono"
        >
          <ArrowLeft size={14} />
          <span>Back to Review Queue</span>
        </Link>
        <ErrorState
          title="Case Not Found"
          message={error || `Could not find transaction ${transactionId}`}
          onRetry={refetch}
        />
      </div>
    );
  }

  const triggeredCount = rules.filter(r => r.triggered).length;

  const formatAmount = (amt: number, curr: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 0,
    }).format(amt);
  };

  const formatFullDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  };

  return (
    <div className="space-y-6">
      {/* Backend Integration Notice */}
      <BackendNoticeBanner />

      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <Link
            to="/reviews"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Back to Reviews"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-mono">
                Case Docket: {transaction.id}
              </h1>
              <StatusBadge status={flag.status} size="md" />
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Account: <strong className="text-indigo-400">{transaction.accountId}</strong> &bull; Flag ID: {flag.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded border border-white/[0.06]">
          <Clock size={13} className="text-indigo-400" />
          <span>Flagged: {new Date(flag.createdAt).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Transaction Metadata Grid */}
      <div className="bg-[#111827] border border-white/[0.08] rounded-lg p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-4 flex items-center gap-1.5">
          <Wallet size={14} className="text-indigo-400" />
          <span>Transaction Metadata Attributes (PostgreSQL Record)</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-xs font-mono">
          <div className="p-3 bg-[#0B0F17] rounded border border-white/[0.04]">
            <span className="text-[11px] text-slate-400 block mb-1">Amount & Currency</span>
            <span className="text-base font-bold text-slate-100">
              {formatAmount(transaction.amount, transaction.currency)}
            </span>
          </div>

          <div className="p-3 bg-[#0B0F17] rounded border border-white/[0.04]">
            <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
              <Building size={12} />
              <span>Merchant / Entity</span>
            </span>
            <span className="text-xs font-semibold text-slate-200 truncate block">
              {transaction.merchant}
            </span>
          </div>

          <div className="p-3 bg-[#0B0F17] rounded border border-white/[0.04]">
            <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
              <MapPin size={12} />
              <span>Location Coordinate</span>
            </span>
            <span className="text-xs font-medium text-slate-200 block truncate" title={transaction.locationName}>
              {transaction.locationName}
            </span>
            <span className="text-[10px] text-slate-400">
              ({transaction.latitude.toFixed(2)}, {transaction.longitude.toFixed(2)})
            </span>
          </div>

          <div className="p-3 bg-[#0B0F17] rounded border border-white/[0.04]">
            <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
              <Smartphone size={12} />
              <span>Hardware Device ID</span>
            </span>
            <span className="text-xs font-semibold text-slate-200 block truncate">
              {transaction.deviceId}
            </span>
          </div>

          <div className="p-3 bg-[#0B0F17] rounded border border-white/[0.04]">
            <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
              <Globe size={12} />
              <span>IP Address & Route</span>
            </span>
            <span className="text-xs font-semibold text-indigo-300 block truncate">
              {transaction.ipAddress}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/[0.04] text-[11px] font-mono text-slate-400 flex items-center gap-2">
          <Calendar size={13} className="text-slate-400" />
          <span>Ingested Timestamp: {formatFullDate(transaction.timestamp)}</span>
        </div>
      </div>

      {/* Prominent Risk Score Card */}
      <RiskScoreCard
        score={flag.riskScore}
        level={flag.riskLevel}
        triggeredCount={triggeredCount}
        totalEvaluatedRules={rules.length}
      />

      {/* Explainability Section: WHY WAS THIS TRANSACTION FLAGGED? */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle size={17} className="text-indigo-400" />
            <h2 className="text-sm font-bold tracking-wider uppercase font-mono text-slate-100">
              WHY WAS THIS TRANSACTION FLAGGED?
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Explainable Decision Breakdown &bull; <strong className="text-rose-400 font-bold">{triggeredCount}</strong> Rule(s) Triggered
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {rules.map((rule) => (
            <RuleResultCard key={rule.id} ruleResult={rule} />
          ))}
        </div>
      </section>

      {/* Deep Evidence & Telemetry Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <FileCheck2 size={17} className="text-indigo-400" />
          <h2 className="text-sm font-bold tracking-wider uppercase font-mono text-slate-100">
            Forensic Evidence & Spatial Comparison
          </h2>
        </div>
        <EvidenceSection transaction={transaction} ruleResults={rules} />
      </section>

      {/* Audit Timeline */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={17} className="text-indigo-400" />
            <h2 className="text-sm font-bold tracking-wider uppercase font-mono text-slate-100">
              Execution & Audit Timeline
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {auditLogs.length} Chronological Lifecycle Steps
          </span>
        </div>
        <AuditTimeline events={auditLogs} />
      </section>

      {/* Reviewer Adjudication Decision Box */}
      <ReviewDecisionBox
        currentStatus={flag.status}
        onSubmitDecision={async (status, comment) => {
          await handleDecision(status, comment);
        }}
      />
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { TransactionWithFraud } from '../../types/transaction';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';
import { ExternalLink, ChevronRight, MapPin } from 'lucide-react';

interface TransactionTableProps {
  transactions: TransactionWithFraud[];
  showMerchant?: boolean;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  showMerchant = true,
}) => {
  const navigate = useNavigate();

  const formatCurrency = (amt: number, curr: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 0,
    }).format(amt);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="bg-[#111827] border border-white/[0.08] rounded-lg overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#0D131F] text-slate-400 font-mono uppercase text-[11px] border-b border-white/[0.08]">
            <tr>
              <th className="py-3 px-4">Transaction ID</th>
              <th className="py-3 px-4">Account</th>
              {showMerchant && <th className="py-3 px-4">Merchant & Location</th>}
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Risk Score</th>
              <th className="py-3 px-4">Risk Level</th>
              <th className="py-3 px-4 text-center">Rules Hit</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                onClick={() => navigate(`/investigation/${tx.id}`)}
                className="hover:bg-white/[0.04] cursor-pointer transition-colors group"
              >
                {/* Transaction ID */}
                <td className="py-3.5 px-4 font-mono font-semibold text-indigo-400 group-hover:text-indigo-300">
                  <div className="flex items-center gap-1.5">
                    <span>{tx.id}</span>
                  </div>
                </td>

                {/* Account */}
                <td className="py-3.5 px-4 font-mono text-slate-400">
                  {tx.accountId}
                </td>

                {/* Merchant & Location */}
                {showMerchant && (
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-200 truncate max-w-[200px]">
                      {tx.merchant}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-slate-400" />
                      <span className="truncate max-w-[180px]">{tx.locationName}</span>
                    </div>
                  </td>
                )}

                {/* Amount */}
                <td className="py-3.5 px-4 font-mono font-semibold text-slate-100">
                  {formatCurrency(tx.amount, tx.currency)}
                </td>

                {/* Timestamp */}
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                  {formatDate(tx.timestamp)}
                </td>

                {/* Risk Score */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-200">
                      {tx.riskScore}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">/100</span>
                  </div>
                </td>

                {/* Risk Level */}
                <td className="py-3.5 px-4">
                  <RiskBadge level={tx.riskLevel} size="sm" />
                </td>

                {/* Triggered Rules */}
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`inline-block font-mono text-xs px-2 py-0.5 rounded ${
                      tx.triggeredRuleCount > 0
                        ? 'bg-rose-500/15 text-rose-300 font-semibold border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tx.triggeredRuleCount}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4">
                  <StatusBadge status={tx.status} size="sm" />
                </td>

                {/* Action */}
                <td className="py-3.5 px-4 text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 group-hover:text-indigo-300">
                    <span>Investigate</span>
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

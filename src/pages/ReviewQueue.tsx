import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import type { TransactionWithFraud } from '../types/transaction';
import { TransactionTable } from '../components/tables/TransactionTable';
import { FilterBar } from '../components/tables/FilterBar';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export const ReviewQueue: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [transactions, setTransactions] = useState<TransactionWithFraud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeRiskFilter, setActiveRiskFilter] = useState('ALL');
  const [activeStatusFilter, setActiveStatusFilter] = useState('ALL');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getTransactions({
        riskLevel: activeRiskFilter,
        status: activeStatusFilter,
        searchQuery: searchQuery,
      });
      setTransactions(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to query review queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [activeRiskFilter, activeStatusFilter, searchQuery]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveRiskFilter('ALL');
    setActiveStatusFilter('ALL');
    setSearchParams({});
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <ShieldAlert size={20} className="text-rose-400" />
            <span>Fraud Review Queue</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Prioritized operational queue of anomalous authorizations awaiting tier-1/tier-2 compliance adjudication.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded border border-white/[0.08] transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeRiskFilter={activeRiskFilter}
        onRiskFilterChange={setActiveRiskFilter}
        activeStatusFilter={activeStatusFilter}
        onStatusFilterChange={setActiveStatusFilter}
        onReset={handleResetFilters}
        totalCount={transactions.length}
      />

      {/* Table Content */}
      {loading ? (
        <LoadingState message="Filtering review queue transactions..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTransactions} />
      ) : transactions.length === 0 ? (
        <EmptyState
          title="No Matching Transactions Found"
          description="Try broadening your search query or reset the risk and status filters."
          actionText="Reset All Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <TransactionTable transactions={transactions} />
      )}
    </div>
  );
};

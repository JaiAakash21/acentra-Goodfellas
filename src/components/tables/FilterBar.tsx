import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeRiskFilter: string;
  onRiskFilterChange: (risk: string) => void;
  activeStatusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onReset: () => void;
  totalCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  activeRiskFilter,
  onRiskFilterChange,
  activeStatusFilter,
  onStatusFilterChange,
  onReset,
  totalCount,
}) => {
  const riskFilters = [
    { id: 'ALL', label: 'All Risks' },
    { id: 'CRITICAL', label: 'Critical (80+)' },
    { id: 'HIGH', label: 'High (60-79)' },
    { id: 'MEDIUM', label: 'Medium (30-59)' },
  ];

  const statusFilters = [
    { id: 'ALL', label: 'All Statuses' },
    { id: 'PENDING', label: 'Pending Review' },
    { id: 'REVIEWED', label: 'Reviewed' },
    { id: 'CLEARED', label: 'Cleared' },
  ];

  return (
    <div className="bg-[#111827] border border-white/[0.08] rounded-lg p-4 space-y-3">
      {/* Search Input and Summary */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by Transaction ID, Account ID, or Merchant..."
            className="w-full bg-[#0B0F17] text-xs text-slate-200 placeholder-slate-400 rounded-md pl-9 pr-4 py-2 border border-white/[0.08] focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto text-xs text-slate-400">
          <span>
            Showing <strong className="text-slate-200 font-mono">{totalCount}</strong> transactions
          </span>
          <button
            onClick={onReset}
            className="flex items-center gap-1 hover:text-slate-200 p-1.5 rounded hover:bg-white/[0.05] transition-colors"
            title="Reset Filters"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Pill Filters */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.05]">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2">
          <Filter size={13} />
          <span className="font-medium">Filter By:</span>
        </div>

        {/* Risk Pills */}
        <div className="flex flex-wrap gap-1.5">
          {riskFilters.map((rf) => (
            <button
              key={rf.id}
              onClick={() => onRiskFilterChange(rf.id)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                activeRiskFilter === rf.id
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-white/[0.05]'
              }`}
            >
              {rf.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

        {/* Status Pills */}
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((sf) => (
            <button
              key={sf.id}
              onClick={() => onStatusFilterChange(sf.id)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                activeStatusFilter === sf.id
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-white/[0.05]'
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

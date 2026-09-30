import React from 'react';
import { Search, Bell, Shield, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  onSearch?: (term: string) => void;
}

export const Topbar: React.FC<TopbarProps> = () => {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/reviews?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="h-16 px-6 bg-[#0B0F17]/90 backdrop-blur border-b border-white/[0.08] flex items-center justify-between sticky top-0 z-30">
      {/* Global Quick Search */}
      <form onSubmit={handleSearchSubmit} className="relative w-80">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Jump to Tx ID, Account, Merchant..."
          className="w-full bg-[#111827] text-xs text-slate-200 placeholder-slate-400 rounded-md pl-9 pr-4 py-2 border border-white/[0.08] focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all font-mono"
        />
      </form>

      {/* Right Action & User Profile */}
      <div className="flex items-center gap-4">
        {/* Environment Tag */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono font-medium">
          <Shield size={12} className="text-indigo-400" />
          <span>FINTECH CLOUD CONSOLE</span>
        </div>

        {/* Alerts Bell */}
        <div className="relative p-2 rounded-md hover:bg-white/[0.05] text-slate-300 cursor-pointer transition-colors">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
        </div>

        {/* Current Reviewer Profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-white/[0.08]">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <User size={15} />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-tight">Keshv</p>
            <p className="text-[10px] text-slate-400">Senior Fraud Lead</p>
          </div>
        </div>
      </div>
    </header>
  );
};

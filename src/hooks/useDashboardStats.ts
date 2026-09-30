import { useState, useEffect, useCallback } from 'react';
import { getDashboardStats } from '../services/api';
import type { DashboardStats, AuditEvent } from '../types/fraud';
import type { TransactionWithFraud } from '../types/transaction';

export interface DashboardData extends DashboardStats {
  trendData: Array<{ time: string; totalVolume: number; flaggedCount: number; criticalCount: number }>;
  riskDistribution: Array<{ name: string; count: number; color: string }>;
  recentHighRisk: TransactionWithFraud[];
  recentAuditEvents: AuditEvent[];
}

export function useDashboardStats() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDashboardStats();
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch dashboard statistics';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    data,
    loading,
    error,
    refetch: fetchStats,
  };
}

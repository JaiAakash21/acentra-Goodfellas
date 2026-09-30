import { useState, useEffect, useCallback } from 'react';
import { getTransactions } from '../services/api';
import type { TransactionWithFraud } from '../types/transaction';

interface FilterOptions {
  riskLevel?: string;
  status?: string;
  searchQuery?: string;
}

export function useTransactions(filter?: FilterOptions) {
  const [transactions, setTransactions] = useState<TransactionWithFraud[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTransactions(filter);
      setTransactions(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch transactions';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filter?.riskLevel, filter?.status, filter?.searchQuery]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
  };
}

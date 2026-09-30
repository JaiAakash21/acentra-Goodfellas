import { useState, useEffect, useCallback } from 'react';
import { getFraudFlags } from '../services/api';
import type { FraudFlag } from '../types/fraud';

export function useFraudFlags() {
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFraudFlags();
      setFraudFlags(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch fraud flags';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  return {
    fraudFlags,
    loading,
    error,
    refetch: fetchFlags,
  };
}

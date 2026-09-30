import { useState, useEffect, useCallback } from 'react';
import { getRules, createRule, updateRule, deleteRule, simulateRule } from '../services/api';
import type { Rule } from '../types/rule';

export function useRules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRules();
      setRules(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch rules';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleCreateRule = async (newRule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
    const created = await createRule(newRule);
    setRules(prev => [created, ...prev]);
    return created;
  };

  const handleToggleRule = async (ruleId: string, currentEnabled: boolean) => {
    const updated = await updateRule(ruleId, { enabled: !currentEnabled });
    setRules(prev => prev.map(r => (r.id === ruleId ? updated : r)));
    return updated;
  };

  const handleDeleteRule = async (ruleId: string) => {
    await deleteRule(ruleId);
    setRules(prev => prev.filter(r => r.id !== ruleId));
  };

  const handleSimulateRule = async (ruleId: string, payload?: Record<string, unknown>) => {
    return simulateRule(ruleId, payload);
  };

  return {
    rules,
    loading,
    error,
    refetch: fetchRules,
    createRule: handleCreateRule,
    toggleRule: handleToggleRule,
    deleteRule: handleDeleteRule,
    simulateRule: handleSimulateRule,
  };
}

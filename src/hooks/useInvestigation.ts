import { useState, useEffect, useCallback } from 'react';
import { getTransaction, getFraudFlags, getRuleResults, getAuditLogs, reviewCase, clearCase } from '../services/api';
import type { Transaction } from '../types/transaction';
import type { FraudFlag, RuleResult, AuditEvent, ReviewStatus } from '../types/fraud';

export function useInvestigation(transactionId?: string) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [flag, setFlag] = useState<FraudFlag | null>(null);
  const [rules, setRules] = useState<RuleResult[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDossier = useCallback(async () => {
    if (!transactionId) return;

    try {
      setLoading(true);
      setError(null);

      const [tx, flags, ruleList, logs] = await Promise.all([
        getTransaction(transactionId),
        getFraudFlags(),
        getRuleResults(transactionId),
        getAuditLogs(transactionId),
      ]);

      if (!tx) {
        setError(`Transaction record ${transactionId} not found`);
        return;
      }

      let foundFlag = flags.find(f => f.transactionId === transactionId);
      if (!foundFlag) {
        foundFlag = {
          id: `FLAG-${transactionId}`,
          transactionId,
          riskScore: 10,
          riskLevel: 'LOW',
          status: 'CLEARED',
          triggeredRuleCount: 0,
          createdAt: tx.timestamp,
        };
      }

      setTransaction(tx);
      setFlag(foundFlag);
      setRules(ruleList);
      setAuditLogs(logs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve investigation dossier';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    fetchDossier();
  }, [fetchDossier]);

  const handleReview = async (comment: string, reviewer?: string) => {
    if (!flag) return;
    const res = await reviewCase(flag.id, comment, reviewer);
    if (res.success) {
      setFlag(res.flag);
      setAuditLogs(prev => [...prev, res.auditEvent]);
    }
    return res;
  };

  const handleClear = async (comment: string, reviewer?: string) => {
    if (!flag) return;
    const res = await clearCase(flag.id, comment, reviewer);
    if (res.success) {
      setFlag(res.flag);
      setAuditLogs(prev => [...prev, res.auditEvent]);
    }
    return res;
  };

  const handleDecision = async (status: ReviewStatus, comment: string, reviewer?: string) => {
    if (status === 'CLEARED') {
      return handleClear(comment, reviewer);
    }
    return handleReview(comment, reviewer);
  };

  return {
    transaction,
    flag,
    rules,
    auditLogs,
    loading,
    error,
    refetch: fetchDossier,
    handleReview,
    handleClear,
    handleDecision,
  };
}

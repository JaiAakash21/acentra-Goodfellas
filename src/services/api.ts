import { http } from './http';
import { config } from '../config/env';
import type { Transaction, TransactionWithFraud, TransactionCreatePayload } from '../types/transaction';
import type { FraudFlag, RuleResult, AuditEvent, DashboardStats } from '../types/fraud';
import type { Rule } from '../types/rule';
import type { Review } from '../types/review';
import { mockTransactions } from '../mock/transactions';
import { mockFraudFlags } from '../mock/fraudFlags';
import { mockRuleResults } from '../mock/ruleResults';
import { mockAuditLogs, mockGeneralAuditEvents } from '../mock/auditLogs';
import { mockRules } from '../mock/rules';
import { mockReviews } from '../mock/reviews';
import { mockDashboardStats, mockTrendData, mockRiskDistribution } from '../mock/dashboardStats';

// In-memory mutable state for the demo & offline fallback
let transactionsState: Transaction[] = [...mockTransactions];
let fraudFlagsState: FraudFlag[] = [...mockFraudFlags];
let ruleResultsState: Record<string, RuleResult[]> = { ...mockRuleResults };
let auditLogsState: Record<string, AuditEvent[]> = { ...mockAuditLogs };
let generalAuditEventsState: AuditEvent[] = [...mockGeneralAuditEvents];
let rulesState: Rule[] = [...mockRules];
let reviewsState: Review[] = [...mockReviews];

/**
 * Adapter: Maps backend snake_case TransactionOut / TransactionDetail to frontend TypeScript types.
 */
export const mapBackendTransaction = (t: any): TransactionWithFraud => {
  const id = String(t.id);
  const accountId = t.customer_id || t.accountId || '';
  const city = t.city || '';
  const country = t.country || '';
  const locationName =
    t.locationName || (city && country ? `${city}, ${country}` : city || country || 'Unknown');
  const rawStatus = t.review_status || (t.flag ? t.flag.status : t.status || (t.is_flagged ? 'PENDING' : 'CLEARED'));
  const status: 'PENDING_REVIEW' | 'REVIEWED' | 'CLEARED' =
    rawStatus === 'PENDING' ? 'PENDING_REVIEW' : (rawStatus as any) || 'CLEARED';
  const flagId =
    t.flag_id != null ? String(t.flag_id) : t.flag?.id != null ? String(t.flag.id) : `FLAG-${id}`;

  return {
    id,
    accountId,
    amount: Number(t.amount || 0),
    currency: t.currency || 'INR',
    timestamp: t.timestamp || new Date().toISOString(),
    latitude: Number(t.latitude || 0),
    longitude: Number(t.longitude || 0),
    locationName,
    merchant: t.merchant || 'Unknown Merchant',
    deviceId: t.device_id || t.deviceId || 'DEV-DEFAULT',
    ipAddress: t.ip_address || t.ipAddress || '127.0.0.1',
    riskScore: Number(t.risk_score ?? t.riskScore ?? 0),
    riskLevel: (t.risk_level || t.riskLevel || 'LOW') as any,
    status,
    triggeredRuleCount:
      t.rule_results?.filter((r: any) => r.triggered)?.length ?? (t.is_flagged ? 1 : 0),
    flagId,
    isFlagged: Boolean(t.is_flagged),
  };
};

/**
 * Adapter: Maps backend Rule model to frontend Rule interface.
 */
export const mapBackendRule = (r: any): Rule => ({
  id: r.rule_id || String(r.id),
  name: r.name,
  description: r.description || '',
  type: r.rule_type || 'VELOCITY',
  config: r.config || {},
  weight: Number(r.score ?? 25),
  enabled: Boolean(r.enabled),
  version: 1,
  createdAt: r.created_at || new Date().toISOString(),
  updatedAt: r.updated_at || new Date().toISOString(),
});

// Helper to enrich a local transaction with its corresponding fraud flag
export const enrichTransaction = (tx: Transaction): TransactionWithFraud => {
  const flag = fraudFlagsState.find(f => f.transactionId === tx.id);
  return {
    ...tx,
    riskScore: flag?.riskScore ?? 0,
    riskLevel: flag?.riskLevel ?? 'LOW',
    status: flag?.status ?? 'CLEARED',
    triggeredRuleCount: flag?.triggeredRuleCount ?? 0,
    flagId: flag?.id ?? `FLAG-${tx.id}`,
  };
};

/**
 * 1. Fetch transactions (with optional filter parameters)
 * Backend: GET /api/transactions
 */
export async function getTransactions(filter?: {
  riskLevel?: string;
  status?: string;
  searchQuery?: string;
}): Promise<TransactionWithFraud[]> {
  if (!config.useMockData) {
    try {
      const params: Record<string, string> = {};
      if (filter?.riskLevel && filter.riskLevel !== 'ALL') {
        params.risk_level = filter.riskLevel.toUpperCase();
      }
      if (filter?.status && filter.status !== 'ALL') {
        params.review_status =
          filter.status === 'PENDING_REVIEW' ? 'PENDING' : filter.status.toUpperCase();
      }
      if (filter?.searchQuery) {
        params.search = filter.searchQuery;
      }

      const res = await http.get<any>('/api/transactions', { params });
      const items = Array.isArray(res) ? res : res?.items || [];
      if (items.length > 0) {
        return items.map(mapBackendTransaction);
      }
    } catch (err) {
      console.warn('FastAPI backend unavailable — falling back to mock data:', err);
    }
  }

  await new Promise(r => setTimeout(r, 100));
  let list = transactionsState.map(enrichTransaction);

  if (filter?.riskLevel && filter.riskLevel !== 'ALL') {
    list = list.filter(t => t.riskLevel.toUpperCase() === filter.riskLevel!.toUpperCase());
  }

  if (filter?.status && filter.status !== 'ALL') {
    const targetStatus = filter.status.toUpperCase();
    list = list.filter(t => {
      if (targetStatus === 'PENDING' || targetStatus === 'PENDING_REVIEW') {
        return t.status === 'PENDING_REVIEW';
      }
      return t.status.toUpperCase() === targetStatus;
    });
  }

  if (filter?.searchQuery) {
    const q = filter.searchQuery.toLowerCase().trim();
    list = list.filter(
      t =>
        t.id.toLowerCase().includes(q) ||
        t.accountId.toLowerCase().includes(q) ||
        t.merchant.toLowerCase().includes(q) ||
        t.locationName.toLowerCase().includes(q)
    );
  }

  return list;
}

/**
 * 2. Fetch all fraud flags
 * Backend: GET /api/reviews
 */
export async function getFraudFlags(): Promise<FraudFlag[]> {
  if (!config.useMockData) {
    try {
      const reviews = await http.get<any[]>('/api/reviews');
      if (Array.isArray(reviews)) {
        return reviews.map(r => ({
          id: String(r.flag_id),
          transactionId: String(r.transaction?.id ?? r.flag_id),
          riskScore: Number(r.risk_score || 0),
          riskLevel: r.risk_level,
          status: r.status === 'PENDING' ? 'PENDING_REVIEW' : r.status,
          triggeredRuleCount: r.triggered_rules?.length ?? 0,
          createdAt: r.created_at,
          accountId: r.transaction?.customer_id,
        }));
      }
    } catch (err) {
      console.warn('FastAPI backend unavailable — falling back to mock data:', err);
    }
  }
  await new Promise(r => setTimeout(r, 80));
  return [...fraudFlagsState];
}

/**
 * 3. Fetch single transaction by ID
 * Backend: GET /api/transactions/{id}
 */
export async function getTransaction(id: string): Promise<TransactionWithFraud | Transaction | null> {
  if (!config.useMockData) {
    try {
      let detail: any = null;
      const numMatch = id.match(/^(?:tx-)?(\d+)$/i);

      if (numMatch) {
        detail = await http.get<any>(`/api/transactions/${numMatch[1]}`);
      } else {
        // Query by customer_id or search query if string identifier provided
        try {
          const searchRes = await http.get<any>('/api/transactions', {
            params: { customer_id: id, limit: 5 },
          });
          const items = Array.isArray(searchRes) ? searchRes : searchRes?.items || [];
          const match = items.find((t: any) => t.customer_id === id) || items[0];
          if (match && match.id) {
            detail = await http.get<any>(`/api/transactions/${match.id}`);
          }
        } catch {
          // fallback to search param
          const searchRes = await http.get<any>('/api/transactions', {
            params: { search: id, limit: 5 },
          });
          const items = Array.isArray(searchRes) ? searchRes : searchRes?.items || [];
          if (items.length > 0 && items[0].id) {
            detail = await http.get<any>(`/api/transactions/${items[0].id}`);
          }
        }
      }

      if (detail) {
        const canonicalId = String(detail.id);
        const mappedTx = mapBackendTransaction(detail);

        // Cache rule results and audit trail for this transaction so investigation views have full fidelity
        if (detail.rule_results) {
          const mappedRules: RuleResult[] = detail.rule_results.map((r: any, idx: number) => ({
            id: `RES-${canonicalId}-${r.rule_id || idx}`,
            transactionId: canonicalId,
            ruleId: r.rule_id,
            ruleName: r.rule_name || r.rule_id,
            triggered: Boolean(r.triggered),
            score: Number(r.score || 0),
            evidence: typeof r.evidence === 'string' ? { description: r.evidence } : r.evidence || {},
          }));
          ruleResultsState[id] = mappedRules;
          ruleResultsState[canonicalId] = mappedRules;
          if (detail.customer_id) ruleResultsState[detail.customer_id] = mappedRules;
        }

        if (detail.audit_trail) {
          const mappedLogs: AuditEvent[] = detail.audit_trail.map((a: any) => ({
            id: String(a.id),
            transactionId: canonicalId,
            type: a.action,
            message: `${a.actor}: ${a.action}${a.details ? ' ' + JSON.stringify(a.details) : ''}`,
            timestamp: a.created_at,
          }));
          auditLogsState[id] = mappedLogs;
          auditLogsState[canonicalId] = mappedLogs;
          if (detail.customer_id) auditLogsState[detail.customer_id] = mappedLogs;
        }

        return mappedTx;
      }
    } catch (err) {
      console.warn('FastAPI backend unavailable — falling back to mock data:', err);
    }
  }

  await new Promise(r => setTimeout(r, 80));
  const tx = transactionsState.find(t => t.id === id || t.accountId === id);
  return tx ? enrichTransaction(tx) : null;
}

/**
 * 4. Fetch rule evaluation results for a transaction
 */
export async function getRuleResults(transactionId: string): Promise<RuleResult[]> {
  if (ruleResultsState[transactionId] && ruleResultsState[transactionId].length > 0) {
    return ruleResultsState[transactionId];
  }
  if (!config.useMockData) {
    try {
      const tx = await getTransaction(transactionId);
      if (tx) {
        if (ruleResultsState[transactionId]) return ruleResultsState[transactionId];
        if (ruleResultsState[String(tx.id)]) return ruleResultsState[String(tx.id)];
      }
    } catch (err) {
      console.warn('FastAPI backend unavailable — falling back to mock data:', err);
    }
  }
  await new Promise(r => setTimeout(r, 80));
  return (
    ruleResultsState[transactionId] || [
      {
        id: `RES-${transactionId}-BASE`,
        transactionId,
        ruleId: 'VEL001',
        ruleName: 'Transaction Velocity',
        triggered: false,
        score: 0,
        evidence: { description: 'Normal behavior within expected parameters' },
      },
    ]
  );
}

/**
 * 5. Fetch audit logs for a transaction
 */
export async function getAuditLogs(transactionId: string): Promise<AuditEvent[]> {
  if (auditLogsState[transactionId] && auditLogsState[transactionId].length > 0) {
    return auditLogsState[transactionId];
  }
  if (!config.useMockData) {
    try {
      const tx = await getTransaction(transactionId);
      if (tx) {
        if (auditLogsState[transactionId]) return auditLogsState[transactionId];
        if (auditLogsState[String(tx.id)]) return auditLogsState[String(tx.id)];
      }
    } catch (err) {
      console.warn('FastAPI backend unavailable — falling back to mock data:', err);
    }
  }
  await new Promise(r => setTimeout(r, 80));
  return (
    auditLogsState[transactionId] || [
      {
        id: `AUD-${transactionId}-01`,
        transactionId,
        type: 'SYSTEM',
        message: 'Transaction captured and routed through real-time scoring stream',
        timestamp: new Date().toISOString(),
      },
    ]
  );
}

/**
 * 6. Fetch dashboard statistics and analytics
 * Backend: GET /api/dashboard/stats
 */
export async function getDashboardStats(): Promise<
  DashboardStats & {
    trendData: typeof mockTrendData;
    riskDistribution: typeof mockRiskDistribution;
    recentHighRisk: TransactionWithFraud[];
    recentAuditEvents: AuditEvent[];
  }
> {
  let stats: DashboardStats = { ...mockDashboardStats };
  let riskDistribution = [...mockRiskDistribution];

  if (!config.useMockData) {
    try {
      const raw = await http.get<any>('/api/dashboard/stats');
      if (raw) {
        stats = {
          totalTransactions: raw.total_transactions ?? raw.totalTransactions ?? 0,
          flaggedTransactions: raw.flagged_transactions ?? raw.flaggedTransactions ?? 0,
          highRisk: raw.high_risk ?? raw.highRisk ?? 0,
          critical: raw.critical ?? 0,
          pendingReviews: raw.pending_reviews ?? raw.pendingReviews ?? 0,
        };
        const rawDist = raw.risk_distribution || {};
        const total =
          (rawDist.CRITICAL || 0) +
            (rawDist.HIGH || 0) +
            (rawDist.MEDIUM || 0) +
            (rawDist.LOW || 0) || 1;
        riskDistribution = [
          {
            level: 'CRITICAL',
            count: rawDist.CRITICAL || raw.critical || 0,
            percentage: Math.round(((rawDist.CRITICAL || 0) / total) * 100),
          },
          {
            level: 'HIGH',
            count: rawDist.HIGH || raw.high_risk || 0,
            percentage: Math.round(((rawDist.HIGH || 0) / total) * 100),
          },
          {
            level: 'MEDIUM',
            count: rawDist.MEDIUM || raw.medium_risk || 0,
            percentage: Math.round(((rawDist.MEDIUM || 0) / total) * 100),
          },
          {
            level: 'LOW',
            count: rawDist.LOW || 0,
            percentage: Math.round(((rawDist.LOW || 0) / total) * 100),
          },
        ];
      }
    } catch (err) {
      console.warn('FastAPI backend unavailable — falling back to mock data:', err);
    }
  }

  await new Promise(r => setTimeout(r, 80));
  const recentHighRisk = transactionsState
    .map(enrichTransaction)
    .filter(t => t.riskLevel === 'CRITICAL' || t.riskLevel === 'HIGH')
    .slice(0, 6);

  return {
    ...stats,
    trendData: mockTrendData,
    riskDistribution,
    recentHighRisk,
    recentAuditEvents: generalAuditEventsState.slice(0, 6),
  };
}

/**
 * 7. Fetch pending review cases
 * Backend: GET /api/reviews/pending
 */
export async function getPendingReviews(): Promise<TransactionWithFraud[]> {
  if (!config.useMockData) {
    try {
      const res = await http.get<any[]>('/api/reviews/pending');
      if (Array.isArray(res)) {
        return res.map(caseItem => {
          const tx = mapBackendTransaction(caseItem.transaction || caseItem);
          tx.status = 'PENDING_REVIEW';
          if (caseItem.flag_id != null) {
            tx.flagId = String(caseItem.flag_id);
          }
          if (caseItem.risk_score != null) {
            tx.riskScore = caseItem.risk_score;
          }
          if (caseItem.risk_level != null) {
            tx.riskLevel = caseItem.risk_level;
          }
          if (caseItem.triggered_rules != null) {
            tx.triggeredRuleCount = caseItem.triggered_rules.length;
          }
          return tx;
        });
      }
    } catch (err) {
      console.warn('FastAPI backend unavailable — falling back to mock data:', err);
    }
  }
  await new Promise(r => setTimeout(r, 80));
  return transactionsState.map(enrichTransaction).filter(t => t.status === 'PENDING_REVIEW');
}

/**
 * 8. Review Case (Mark as Reviewed)
 * Backend: POST /api/reviews/{flagId}/review
 */
export async function reviewCase(
  flagId: string,
  comment: string,
  reviewer: string = 'Keshv (Senior Fraud Lead)'
): Promise<{ success: boolean; flag: FraudFlag; review: Review; auditEvent: AuditEvent }> {
  const cleanFlagId = flagId.replace(/^[A-Za-z]+-/, '');
  if (!config.useMockData) {
    try {
      const res = await http.post<any>(`/api/reviews/${cleanFlagId}/review`, { comment, reviewer });
      if (res) {
        const flag: FraudFlag = {
          id: String(res.flag_id),
          transactionId: String(res.transaction?.id ?? flagId),
          riskScore: res.risk_score,
          riskLevel: res.risk_level,
          status: 'REVIEWED',
          triggeredRuleCount: res.triggered_rules?.length ?? 0,
          createdAt: res.created_at,
        };
        const review: Review = {
          id: `REV-${Date.now()}`,
          fraudFlagId: String(res.flag_id),
          reviewer: res.reviewed_by || reviewer,
          status: 'REVIEWED',
          comment,
          reviewedAt: res.reviewed_at || new Date().toISOString(),
        };
        const auditEvent: AuditEvent = {
          id: `AUD-DEC-${Date.now()}`,
          transactionId: flag.transactionId,
          type: 'DECISION_SUBMITTED',
          message: `Reviewer ${reviewer} marked case as REVIEWED. Note: "${comment || 'No comment provided'}"`,
          timestamp: new Date().toISOString(),
        };
        return { success: true, flag, review, auditEvent };
      }
    } catch (err) {
      console.warn('FastAPI backend unavailable — executing in mock state:', err);
    }
  }

  await new Promise(r => setTimeout(r, 150));
  const flag = fraudFlagsState.find(f => f.id === flagId || f.transactionId === flagId);
  if (flag) {
    flag.status = 'REVIEWED';
  }

  const review: Review = {
    id: `REV-${Date.now()}`,
    fraudFlagId: flag?.id ?? flagId,
    reviewer,
    status: 'REVIEWED',
    comment: comment || 'Case marked as reviewed by analyst.',
    reviewedAt: new Date().toISOString(),
  };
  reviewsState.push(review);

  const txId = flag?.transactionId ?? flagId;
  const auditEvent: AuditEvent = {
    id: `AUD-DEC-${Date.now()}`,
    transactionId: txId,
    type: 'DECISION_SUBMITTED',
    message: `Reviewer ${reviewer} marked case as REVIEWED. Note: "${comment || 'No comment provided'}"`,
    timestamp: new Date().toISOString(),
  };

  if (!auditLogsState[txId]) auditLogsState[txId] = [];
  auditLogsState[txId].push(auditEvent);

  generalAuditEventsState.unshift({
    id: auditEvent.id,
    transactionId: txId,
    type: 'DECISION_SUBMITTED',
    message: `Case ${txId} marked as REVIEWED by ${reviewer}`,
    timestamp: auditEvent.timestamp,
  });

  return {
    success: true,
    flag: flag || {
      id: flagId,
      transactionId: txId,
      riskScore: 70,
      riskLevel: 'HIGH',
      status: 'REVIEWED',
      triggeredRuleCount: 2,
      createdAt: new Date().toISOString(),
    },
    review,
    auditEvent,
  };
}

/**
 * 9. Clear Case
 * Backend: POST /api/reviews/{flagId}/clear
 */
export async function clearCase(
  flagId: string,
  comment: string,
  reviewer: string = 'Keshv (Senior Fraud Lead)'
): Promise<{ success: boolean; flag: FraudFlag; review: Review; auditEvent: AuditEvent }> {
  const cleanFlagId = flagId.replace(/^[A-Za-z]+-/, '');
  if (!config.useMockData) {
    try {
      const res = await http.post<any>(`/api/reviews/${cleanFlagId}/clear`, { comment, reviewer });
      if (res) {
        const flag: FraudFlag = {
          id: String(res.flag_id),
          transactionId: String(res.transaction?.id ?? flagId),
          riskScore: res.risk_score,
          riskLevel: res.risk_level,
          status: 'CLEARED',
          triggeredRuleCount: res.triggered_rules?.length ?? 0,
          createdAt: res.created_at,
        };
        const review: Review = {
          id: `REV-${Date.now()}`,
          fraudFlagId: String(res.flag_id),
          reviewer: res.reviewed_by || reviewer,
          status: 'CLEARED',
          comment,
          reviewedAt: res.reviewed_at || new Date().toISOString(),
        };
        const auditEvent: AuditEvent = {
          id: `AUD-CLR-${Date.now()}`,
          transactionId: flag.transactionId,
          type: 'DECISION_SUBMITTED',
          message: `Reviewer ${reviewer} CLEARED case. Note: "${comment || 'Case cleared'}"`,
          timestamp: new Date().toISOString(),
        };
        return { success: true, flag, review, auditEvent };
      }
    } catch (err) {
      console.warn('FastAPI backend unavailable — executing in mock state:', err);
    }
  }

  await new Promise(r => setTimeout(r, 150));
  const flag = fraudFlagsState.find(f => f.id === flagId || f.transactionId === flagId);
  if (flag) {
    flag.status = 'CLEARED';
  }

  const review: Review = {
    id: `REV-${Date.now()}`,
    fraudFlagId: flag?.id ?? flagId,
    reviewer,
    status: 'CLEARED',
    comment: comment || 'Case cleared after secondary validation.',
    reviewedAt: new Date().toISOString(),
  };
  reviewsState.push(review);

  const txId = flag?.transactionId ?? flagId;
  const auditEvent: AuditEvent = {
    id: `AUD-CLR-${Date.now()}`,
    transactionId: txId,
    type: 'DECISION_SUBMITTED',
    message: `Reviewer ${reviewer} CLEARED case. Note: "${comment || 'Case cleared'}"`,
    timestamp: new Date().toISOString(),
  };

  if (!auditLogsState[txId]) auditLogsState[txId] = [];
  auditLogsState[txId].push(auditEvent);

  generalAuditEventsState.unshift({
    id: auditEvent.id,
    transactionId: txId,
    type: 'DECISION_SUBMITTED',
    message: `Case ${txId} CLEARED by ${reviewer}`,
    timestamp: auditEvent.timestamp,
  });

  return {
    success: true,
    flag: flag || {
      id: flagId,
      transactionId: txId,
      riskScore: 20,
      riskLevel: 'LOW',
      status: 'CLEARED',
      triggeredRuleCount: 0,
      createdAt: new Date().toISOString(),
    },
    review,
    auditEvent,
  };
}

/**
 * 10. Fetch all rules
 * Backend: GET /api/rules
 */
export async function getRules(): Promise<Rule[]> {
  if (!config.useMockData) {
    try {
      const rawRules = await http.get<any[]>('/api/rules');
      if (Array.isArray(rawRules) && rawRules.length > 0) {
        return rawRules.map(mapBackendRule);
      }
    } catch (err) {
      console.warn('FastAPI backend unavailable — falling back to mock data:', err);
    }
  }
  await new Promise(r => setTimeout(r, 60));
  return [...rulesState];
}

/**
 * 11. Create a new rule
 * Backend: POST /api/rules
 */
export async function createRule(
  newRule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt' | 'version'> & { id?: string }
): Promise<Rule> {
  if (!config.useMockData) {
    try {
      const payload = {
        rule_id: newRule.id || newRule.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_').slice(0, 32),
        name: newRule.name,
        description: newRule.description,
        rule_type: newRule.type,
        config: newRule.config,
        score: newRule.weight,
        enabled: newRule.enabled,
      };
      const res = await http.post<any>('/api/rules', payload);
      if (res) {
        return mapBackendRule(res);
      }
    } catch (err) {
      console.warn('FastAPI backend unavailable — saving in mock state:', err);
    }
  }

  await new Promise(r => setTimeout(r, 120));
  const created: Rule = {
    ...newRule,
    id: newRule.id || `RULE-${newRule.type.slice(0, 3)}-${Date.now().toString().slice(-4)}`,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  rulesState.unshift(created);
  return created;
}

/**
 * 12. Update existing rule
 * Backend: PUT /api/rules/{id}
 */
export async function updateRule(ruleId: string, updates: Partial<Rule>): Promise<Rule> {
  if (!config.useMockData) {
    try {
      const payload: any = {};
      if (updates.enabled !== undefined) payload.enabled = updates.enabled;
      if (updates.weight !== undefined) payload.score = updates.weight;
      if (updates.config !== undefined) payload.config = updates.config;
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.description !== undefined) payload.description = updates.description;

      const res = await http.put<any>(`/api/rules/${ruleId}`, payload);
      if (res) {
        return mapBackendRule(res);
      }
    } catch (err) {
      console.warn('FastAPI backend unavailable — updating in mock state:', err);
    }
  }

  await new Promise(r => setTimeout(r, 80));
  const index = rulesState.findIndex(r => r.id === ruleId);
  if (index === -1) throw new Error('Rule not found');
  const updated: Rule = {
    ...rulesState[index],
    ...updates,
    version: rulesState[index].version + 1,
    updatedAt: new Date().toISOString(),
  };
  rulesState[index] = updated;
  return updated;
}

/**
 * 13. Delete rule
 */
export async function deleteRule(ruleId: string): Promise<boolean> {
  rulesState = rulesState.filter(r => r.id !== ruleId);
  return true;
}

/**
 * 14. Simulate single rule against test payload
 * Backend: POST /api/rules/{id}/simulate
 */
export async function simulateRule(
  ruleId: string,
  testPayload?: Record<string, unknown>
): Promise<{ ruleId: string; passed: boolean; details: Record<string, unknown> }> {
  if (!config.useMockData) {
    try {
      const res = await http.post<any>(`/api/rules/${ruleId}/simulate`, {
        config: testPayload?.config,
        score: testPayload?.score,
      });
      if (res) {
        return {
          ruleId,
          passed: res.rule_triggered_count > 0,
          details: {
            transactionsEvaluated: res.transactions_evaluated,
            triggeredCount: res.rule_triggered_count,
            newlyFlagged: res.newly_flagged,
            noLongerFlagged: res.no_longer_flagged,
            scoreChanged: res.score_changed,
            status: res.rule_triggered_count > 0 ? 'TRIGGERED_ANOMALY' : 'NO_BREACH',
          },
        };
      }
    } catch (err) {
      console.warn('FastAPI backend unavailable — simulating in mock state:', err);
    }
  }

  await new Promise(r => setTimeout(r, 150));
  const rule = rulesState.find(r => r.id === ruleId);
  return {
    ruleId,
    passed: true,
    details: {
      ruleName: rule?.name || 'Rule Simulation',
      observedValue: 6.8,
      threshold: rule?.config?.threshold || 'configured_threshold',
      impactScore: `+${rule?.weight || 25} points`,
      status: 'TRIGGERED_ANOMALY',
    },
  };
}

/**
 * 15. Run multi-signal fraud simulation scenario
 * Backend: POST /api/simulator/run
 */
export async function runSimulation(scenario: string) {
  if (!config.useMockData) {
    try {
      const res = await http.post<any>('/api/simulator/run', { scenario });
      if (res && res.transaction) {
        return {
          scenarioName: res.scenarioName,
          transaction: mapBackendTransaction(res.transaction),
          breakdown: res.breakdown || { velocity: 30, amount: 25, location: 30, total: 85 },
          ruleResults: (res.ruleResults || []).map((r: any, idx: number) => ({
            id: `SIM-RES-${r.rule_id || idx}`,
            transactionId: String(res.transaction.id),
            ruleId: r.rule_id,
            ruleName: r.rule_name || r.rule_id,
            triggered: Boolean(r.triggered),
            score: Number(r.score || 0),
            evidence:
              typeof r.evidence === 'string' ? { description: r.evidence } : r.evidence || {},
          })),
          riskScore: res.riskScore,
          riskLevel: res.riskLevel,
          decision: res.decision,
          explanation: res.explanation,
        };
      }
    } catch (err) {
      console.warn('FastAPI backend unavailable — running in mock state:', err);
    }
  }

  await new Promise(r => setTimeout(r, 350));

  switch (scenario) {
    case 'multi-signal-critical':
      return {
        scenarioName: 'Multi-Signal Critical Fraud',
        transaction: {
          id: 'SIM-99824',
          accountId: 'ACC-884920',
          amount: 87500,
          currency: 'INR',
          timestamp: new Date().toISOString(),
          latitude: 51.5074,
          longitude: -0.1278,
          locationName: 'London, United Kingdom',
          merchant: 'Apex Luxury Tech Ltd',
          deviceId: 'DEV-F89A-0921',
          ipAddress: '185.220.101.42',
        },
        breakdown: { velocity: 30, amount: 25, location: 30, total: 85 },
        ruleResults: [
          {
            id: 'SIM-R-VEL',
            transactionId: 'SIM-99824',
            ruleId: 'VEL001',
            ruleName: 'Transaction Velocity',
            triggered: true,
            score: 30,
            evidence: {
              description: '6 transactions detected within 10 minutes',
              metric: 'Rolling Frequency',
              expected: '<= 4 tx/10min',
              actual: '6 tx/10min',
            },
          },
          {
            id: 'SIM-R-AMT',
            transactionId: 'SIM-99824',
            ruleId: 'AMT001',
            ruleName: 'Unusual Transaction Amount',
            triggered: true,
            score: 25,
            evidence: {
              description: "₹87,500 is 7.3x the customer's historical average of ₹12,000",
              metric: 'Amount Multiplier',
              expected: '<= 3.5x average',
              actual: '7.3x average',
            },
          },
          {
            id: 'SIM-R-GEO',
            transactionId: 'SIM-99824',
            ruleId: 'GEO001',
            ruleName: 'Impossible Geographical Location',
            triggered: true,
            score: 30,
            evidence: {
              description:
                'Previous location: Chennai | Current location: London | Elapsed time: 25 minutes | Estimated speed: 5,420 km/h',
              locations: {
                prevLocation: 'Chennai',
                currLocation: 'London',
                timeDiffMinutes: 25,
                speedKmh: 5420,
              },
            },
          },
        ],
        riskScore: 85,
        riskLevel: 'CRITICAL' as const,
        decision: 'PRIORITY_REVIEW',
        explanation:
          'Simultaneous breaches across velocity, spending multiplier, and geographic tele-transport threshold trigger automated critical lockdown and priority manual review docket.',
      };

    case 'velocity-attack':
      return {
        scenarioName: 'Velocity Attack Burst',
        transaction: {
          id: 'SIM-77192',
          accountId: 'ACC-512093',
          amount: 4500,
          currency: 'INR',
          timestamp: new Date().toISOString(),
          latitude: 12.9716,
          longitude: 77.5946,
          locationName: 'Bengaluru, India',
          merchant: 'FastPay Instant Reload',
          deviceId: 'DEV-BOT-AGENT-09',
          ipAddress: '103.21.244.11',
        },
        breakdown: { velocity: 30, amount: 0, location: 0, total: 30 },
        ruleResults: [
          {
            id: 'SIM-R-VEL',
            transactionId: 'SIM-77192',
            ruleId: 'VEL001',
            ruleName: 'Transaction Velocity',
            triggered: true,
            score: 30,
            evidence: { description: '14 micro-transactions executed in under 3 minutes' },
          },
        ],
        riskScore: 65,
        riskLevel: 'HIGH' as const,
        decision: 'STEP-UP AUTH (OTP / BIOMETRIC)',
        explanation:
          'Rapid programmatic card-testing velocity pattern detected. Account temporarily throttled for step-up verification.',
      };

    case 'high-amount':
      return {
        scenarioName: 'Unusual High Amount Outlier',
        transaction: {
          id: 'SIM-55102',
          accountId: 'ACC-229104',
          amount: 195000,
          currency: 'INR',
          timestamp: new Date().toISOString(),
          latitude: 19.076,
          longitude: 72.8777,
          locationName: 'Mumbai, India',
          merchant: 'Titan Watches & Jewellery',
          deviceId: 'DEV-TRUSTED-IPHONE',
          ipAddress: '49.36.19.102',
        },
        breakdown: { velocity: 0, amount: 25, location: 0, total: 25 },
        ruleResults: [
          {
            id: 'SIM-R-AMT',
            transactionId: 'SIM-55102',
            ruleId: 'AMT001',
            ruleName: 'Unusual Transaction Amount',
            triggered: true,
            score: 25,
            evidence: { description: '₹195,000 is 12.5x customer historical mean of ₹15,600' },
          },
        ],
        riskScore: 55,
        riskLevel: 'MEDIUM' as const,
        decision: 'APPROVAL REQUIRED',
        explanation:
          'Amount significantly exceeds standard consumer profile, but originated from registered biometrically verified device.',
      };

    case 'impossible-travel':
      return {
        scenarioName: 'Impossible Travel Anomaly',
        transaction: {
          id: 'SIM-33109',
          accountId: 'ACC-774192',
          amount: 8200,
          currency: 'INR',
          timestamp: new Date().toISOString(),
          latitude: 25.2048,
          longitude: 55.2708,
          locationName: 'Dubai, UAE',
          merchant: 'Dubai Mall Electronics',
          deviceId: 'DEV-UNKNOWN-BROWSER',
          ipAddress: '194.187.248.99',
        },
        breakdown: { velocity: 0, amount: 0, location: 30, total: 30 },
        ruleResults: [
          {
            id: 'SIM-R-GEO',
            transactionId: 'SIM-33109',
            ruleId: 'GEO001',
            ruleName: 'Impossible Geographical Location',
            triggered: true,
            score: 30,
            evidence: {
              description:
                'Card tapped in Bengaluru 15 mins prior to Dubai terminal request (Speed: 10,800 km/h)',
              locations: {
                prevLocation: 'Bengaluru',
                currLocation: 'Dubai',
                timeDiffMinutes: 15,
                speedKmh: 10800,
              },
            },
          },
        ],
        riskScore: 70,
        riskLevel: 'HIGH' as const,
        decision: 'HOLD & CALL CARDHOLDER',
        explanation:
          'Physical presence in two separate countries separated by 2,700 km within 15 minutes implies credential cloning or proxy relay.',
      };

    case 'normal-transaction':
    default:
      return {
        scenarioName: 'Normal Low-Risk Transaction',
        transaction: {
          id: 'SIM-10024',
          accountId: 'ACC-449182',
          amount: 1420,
          currency: 'INR',
          timestamp: new Date().toISOString(),
          latitude: 17.385,
          longitude: 78.4867,
          locationName: 'Hyderabad, India',
          merchant: 'Swiggy Instamart Grocery',
          deviceId: 'DEV-IPH14-1182',
          ipAddress: '115.111.90.34',
        },
        breakdown: { velocity: 0, amount: 0, location: 0, total: 0 },
        ruleResults: [
          {
            id: 'SIM-R-VEL',
            transactionId: 'SIM-10024',
            ruleId: 'VEL001',
            ruleName: 'Transaction Velocity',
            triggered: false,
            score: 0,
            evidence: { description: '1 transaction in 24 hours. Well within limits.' },
          },
          {
            id: 'SIM-R-AMT',
            transactionId: 'SIM-10024',
            ruleId: 'AMT001',
            ruleName: 'Unusual Transaction Amount',
            triggered: false,
            score: 0,
            evidence: { description: '₹1,420 corresponds to customer median grocery ticket.' },
          },
          {
            id: 'SIM-R-GEO',
            transactionId: 'SIM-10024',
            ruleId: 'GEO001',
            ruleName: 'Impossible Geographical Location',
            triggered: false,
            score: 0,
            evidence: { description: 'Matches habitual home geofence location.' },
          },
        ],
        riskScore: 0,
        riskLevel: 'LOW' as const,
        decision: 'AUTO-APPROVE',
        explanation:
          'Transaction matches regular spending habits, known device fingerprint, and local IP cluster.',
      };
  }
}

/**
 * Submit and evaluate a new transaction via FastAPI backend
 * Backend: POST /api/transactions
 */
export async function createTransaction(payload: TransactionCreatePayload): Promise<TransactionWithFraud> {
  if (!config.useMockData) {
    const detail = await http.post<any>('/api/transactions', payload);
    const mapped = mapBackendTransaction(detail);
    if (detail.rule_results) {
      const canonicalId = String(detail.id);
      ruleResultsState[canonicalId] = detail.rule_results.map((r: any, idx: number) => ({
        id: `RES-${canonicalId}-${r.rule_id || idx}`,
        transactionId: canonicalId,
        ruleId: r.rule_id,
        ruleName: r.rule_name || r.rule_id,
        triggered: Boolean(r.triggered),
        score: Number(r.score || 0),
        evidence: typeof r.evidence === 'string' ? { description: r.evidence } : r.evidence || {},
      }));
    }
    return mapped;
  }

  // Fallback in mock mode:
  const newTx: TransactionWithFraud = {
    id: `TX-${Date.now()}`,
    accountId: payload.customer_id,
    amount: payload.amount,
    currency: payload.currency || 'INR',
    timestamp: payload.timestamp || new Date().toISOString(),
    latitude: payload.latitude || 13.0827,
    longitude: payload.longitude || 80.2707,
    locationName:
      payload.city && payload.country
        ? `${payload.city}, ${payload.country}`
        : payload.city || 'Chennai, India',
    merchant: payload.merchant || 'Standard Merchant',
    deviceId: 'DEV-WEB-PORTAL',
    ipAddress: '127.0.0.1',
    riskScore: payload.amount > 50000 ? 55 : 0,
    riskLevel: payload.amount > 50000 ? 'MEDIUM' : 'LOW',
    status: payload.amount > 50000 ? 'PENDING_REVIEW' : 'CLEARED',
    triggeredRuleCount: payload.amount > 50000 ? 1 : 0,
    flagId: `FLAG-${Date.now()}`,
  };
  transactionsState.unshift(newTx);
  return newTx;
}

/**
 * Composite API Service Object for backwards compatibility & clean namespace
 */
export const apiService = {
  createTransaction,
  getTransactions,
  getFraudFlags,
  getTransaction,
  getRuleResults,
  getAuditLogs,
  getDashboardStats,
  getPendingReviews,
  reviewCase,
  clearCase,
  getRules,
  createRule,
  updateRule,
  deleteRule,
  simulateRule,
  runSimulation,
  // Helper for investigation dossiers
  async getTransactionDetails(id: string) {
    const [tx, flags, rules, auditLogs] = await Promise.all([
      getTransaction(id),
      getFraudFlags(),
      getRuleResults(id),
      getAuditLogs(id),
    ]);
    if (!tx) return null;
    const txIdStr = String(tx.id);
    let flag = flags.find(
      f =>
        f.transactionId === id ||
        f.transactionId === txIdStr ||
        (f as any).accountId === id ||
        (f as any).accountId === tx.accountId
    );
    if (!flag && (tx.isFlagged || (tx.flagId && !tx.flagId.startsWith('FLAG-')))) {
      flag = {
        id: tx.flagId || `FLAG-${tx.id}`,
        transactionId: txIdStr,
        riskScore: tx.riskScore ?? 0,
        riskLevel: tx.riskLevel ?? 'LOW',
        status: tx.status ?? 'PENDING_REVIEW',
        triggeredRuleCount: tx.triggeredRuleCount ?? 0,
        createdAt: tx.timestamp,
      };
    }
    return { transaction: tx, flag: flag || null, rules, auditLogs };
  },
  async submitReviewDecision(
    transactionId: string,
    status: 'REVIEWED' | 'CLEARED',
    comment: string
  ) {
    if (status === 'CLEARED') {
      return clearCase(transactionId, comment);
    }
    return reviewCase(transactionId, comment);
  },
  toggleRule(ruleId: string, enabled: boolean) {
    return updateRule(ruleId, { enabled });
  },
  simulateFraudScenario: runSimulation,
};

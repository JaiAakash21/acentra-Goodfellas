import { http } from './http';
import { config } from '../config/env';
import type { Transaction, TransactionWithFraud } from '../types/transaction';
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

// In-memory mutable state for the demo
let transactionsState: Transaction[] = [...mockTransactions];
let fraudFlagsState: FraudFlag[] = [...mockFraudFlags];
let ruleResultsState: Record<string, RuleResult[]> = { ...mockRuleResults };
let auditLogsState: Record<string, AuditEvent[]> = { ...mockAuditLogs };
let generalAuditEventsState: AuditEvent[] = [...mockGeneralAuditEvents];
let rulesState: Rule[] = [...mockRules];
let reviewsState: Review[] = [...mockReviews];

// Helper to enrich a transaction with its corresponding fraud flag
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
 * Backend assumption: GET /api/transactions
 */
export async function getTransactions(filter?: {
  riskLevel?: string;
  status?: string;
  searchQuery?: string;
}): Promise<TransactionWithFraud[]> {
  if (!config.useMockData) {
    try {
      const list = await http.get<Transaction[]>('/api/transactions');
      return list.map(enrichTransaction);
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
 * Backend assumption: GET /api/fraud-flags
 */
export async function getFraudFlags(): Promise<FraudFlag[]> {
  if (!config.useMockData) {
    try {
      return await http.get<FraudFlag[]>('/api/fraud-flags');
    } catch (err) {
      console.warn('FastAPI backend unavailable — falling back to mock data:', err);
    }
  }
  await new Promise(r => setTimeout(r, 80));
  return [...fraudFlagsState];
}

/**
 * 3. Fetch single transaction by ID
 * Backend assumption: GET /api/transactions/{id}
 */
export async function getTransaction(id: string): Promise<Transaction | null> {
  if (!config.useMockData) {
    try {
      return await http.get<Transaction>(`/api/transactions/${id}`);
    } catch (err) {
      console.warn('FastAPI backend unavailable — falling back to mock data:', err);
    }
  }
  await new Promise(r => setTimeout(r, 80));
  const tx = transactionsState.find(t => t.id === id);
  return tx || null;
}

/**
 * 4. Fetch rule evaluation results for a transaction
 * Backend assumption: GET /api/fraud-flags/{transactionId}/rules
 */
export async function getRuleResults(transactionId: string): Promise<RuleResult[]> {
  if (!config.useMockData) {
    try {
      return await http.get<RuleResult[]>(`/api/fraud-flags/${transactionId}/rules`);
    } catch (err) {
      console.warn('FastAPI backend unavailable — falling back to mock data:', err);
    }
  }
  await new Promise(r => setTimeout(r, 80));
  return ruleResultsState[transactionId] || [
    {
      id: `RES-${transactionId}-BASE`,
      transactionId,
      ruleId: 'RULE-BASE',
      ruleName: 'BASELINE VERIFICATION',
      triggered: false,
      score: 10,
      evidence: { description: 'Normal behavior within expected parameters' },
    },
  ];
}

/**
 * 5. Fetch audit logs for a transaction
 * Backend assumption: GET /api/transactions/{transactionId}/audit-logs
 */
export async function getAuditLogs(transactionId: string): Promise<AuditEvent[]> {
  if (!config.useMockData) {
    try {
      return await http.get<AuditEvent[]>(`/api/transactions/${transactionId}/audit-logs`);
    } catch (err) {
      console.warn('FastAPI backend unavailable — falling back to mock data:', err);
    }
  }
  await new Promise(r => setTimeout(r, 80));
  return auditLogsState[transactionId] || [
    {
      id: `AUD-${transactionId}-01`,
      transactionId,
      type: 'SYSTEM',
      message: 'Transaction captured and routed through real-time scoring stream',
      timestamp: new Date().toISOString(),
    },
  ];
}

/**
 * 6. Fetch dashboard statistics and analytics
 * Backend assumption: GET /api/dashboard/stats
 */
export async function getDashboardStats(): Promise<DashboardStats & {
  trendData: typeof mockTrendData;
  riskDistribution: typeof mockRiskDistribution;
  recentHighRisk: TransactionWithFraud[];
  recentAuditEvents: AuditEvent[];
}> {
  let stats: DashboardStats = { ...mockDashboardStats };

  if (!config.useMockData) {
    try {
      stats = await http.get<DashboardStats>('/api/dashboard/stats');
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
    riskDistribution: mockRiskDistribution,
    recentHighRisk,
    recentAuditEvents: generalAuditEventsState.slice(0, 6),
  };
}

/**
 * 7. Fetch pending review cases
 * Backend assumption: GET /api/reviews/pending
 */
export async function getPendingReviews(): Promise<TransactionWithFraud[]> {
  if (!config.useMockData) {
    try {
      const pendingTxs = await http.get<Transaction[]>('/api/reviews/pending');
      return pendingTxs.map(enrichTransaction);
    } catch (err) {
      console.warn('FastAPI backend unavailable — falling back to mock data:', err);
    }
  }
  await new Promise(r => setTimeout(r, 80));
  return transactionsState
    .map(enrichTransaction)
    .filter(t => t.status === 'PENDING_REVIEW');
}

/**
 * 8. Review Case (Mark as Reviewed)
 * Backend assumption: POST /api/reviews/{flagId}/review
 */
export async function reviewCase(
  flagId: string,
  comment: string,
  reviewer: string = 'Keshv (Senior Fraud Lead)'
): Promise<{ success: boolean; flag: FraudFlag; review: Review; auditEvent: AuditEvent }> {
  if (!config.useMockData) {
    try {
      return await http.post(`/api/reviews/${flagId}/review`, { comment, reviewer });
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
 * Backend assumption: POST /api/reviews/{flagId}/clear
 */
export async function clearCase(
  flagId: string,
  comment: string,
  reviewer: string = 'Keshv (Senior Fraud Lead)'
): Promise<{ success: boolean; flag: FraudFlag; review: Review; auditEvent: AuditEvent }> {
  if (!config.useMockData) {
    try {
      return await http.post(`/api/reviews/${flagId}/clear`, { comment, reviewer });
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
 * Backend assumption: GET /api/rules
 */
export async function getRules(): Promise<Rule[]> {
  if (!config.useMockData) {
    try {
      return await http.get<Rule[]>('/api/rules');
    } catch (err) {
      console.warn('FastAPI backend unavailable — falling back to mock data:', err);
    }
  }
  await new Promise(r => setTimeout(r, 60));
  return [...rulesState];
}

/**
 * 11. Create a new rule
 * Backend assumption: POST /api/rules
 */
export async function createRule(
  newRule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt' | 'version'>
): Promise<Rule> {
  if (!config.useMockData) {
    try {
      return await http.post<Rule>('/api/rules', newRule);
    } catch (err) {
      console.warn('FastAPI backend unavailable — saving in mock state:', err);
    }
  }

  await new Promise(r => setTimeout(r, 120));
  const created: Rule = {
    ...newRule,
    id: `RULE-${newRule.type.slice(0, 3)}-${Date.now().toString().slice(-4)}`,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  rulesState.unshift(created);
  return created;
}

/**
 * 12. Update existing rule
 * Backend assumption: PUT /api/rules/{id}
 */
export async function updateRule(ruleId: string, updates: Partial<Rule>): Promise<Rule> {
  if (!config.useMockData) {
    try {
      return await http.put<Rule>(`/api/rules/${ruleId}`, updates);
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
 * Backend assumption: DELETE /api/rules/{id}
 */
export async function deleteRule(ruleId: string): Promise<boolean> {
  if (!config.useMockData) {
    try {
      await http.delete(`/api/rules/${ruleId}`);
      return true;
    } catch (err) {
      console.warn('FastAPI backend unavailable — deleting in mock state:', err);
    }
  }

  rulesState = rulesState.filter(r => r.id !== ruleId);
  return true;
}

/**
 * 14. Simulate single rule against test payload
 * Backend assumption: POST /api/rules/{id}/simulate
 */
export async function simulateRule(
  ruleId: string,
  testPayload?: Record<string, unknown>
): Promise<{ ruleId: string; passed: boolean; details: Record<string, unknown> }> {
  if (!config.useMockData) {
    try {
      return await http.post(`/api/rules/${ruleId}/simulate`, { payload: testPayload });
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
 * Backend assumption: POST /api/simulator/run
 */
export async function runSimulation(scenario: string) {
  if (!config.useMockData) {
    try {
      return await http.post('/api/simulator/run', { scenario });
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
            ruleId: 'RULE-VEL-01',
            ruleName: 'HIGH TRANSACTION VELOCITY',
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
            ruleId: 'RULE-AMT-02',
            ruleName: 'UNUSUAL TRANSACTION AMOUNT',
            triggered: true,
            score: 25,
            evidence: {
              description: '₹87,500 is 7.3x the customer\'s historical average of ₹12,000',
              metric: 'Amount Multiplier',
              expected: '<= 3.5x average',
              actual: '7.3x average',
            },
          },
          {
            id: 'SIM-R-GEO',
            transactionId: 'SIM-99824',
            ruleId: 'RULE-GEO-03',
            ruleName: 'IMPOSSIBLE TRAVEL',
            triggered: true,
            score: 30,
            evidence: {
              description: 'Previous location: Chennai | Current location: London | Elapsed time: 25 minutes | Estimated speed: 5,420 km/h',
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
        decision: 'MANUAL REVIEW',
        explanation: 'Simultaneous breaches across velocity, spending multiplier, and geographic tele-transport threshold trigger automated critical lockdown and priority manual review docket.',
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
            ruleId: 'RULE-VEL-01',
            ruleName: 'HIGH TRANSACTION VELOCITY',
            triggered: true,
            score: 30,
            evidence: { description: '14 micro-transactions executed in under 3 minutes' },
          },
        ],
        riskScore: 65,
        riskLevel: 'HIGH' as const,
        decision: 'STEP-UP AUTH (OTP / BIOMETRIC)',
        explanation: 'Rapid programmatic card-testing velocity pattern detected. Account temporarily throttled for step-up verification.',
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
          latitude: 19.0760,
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
            ruleId: 'RULE-AMT-02',
            ruleName: 'UNUSUAL TRANSACTION AMOUNT',
            triggered: true,
            score: 25,
            evidence: { description: '₹195,000 is 12.5x customer historical mean of ₹15,600' },
          },
        ],
        riskScore: 55,
        riskLevel: 'MEDIUM' as const,
        decision: 'APPROVAL REQUIRED',
        explanation: 'Amount significantly exceeds standard consumer profile, but originated from registered biometrically verified device.',
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
            ruleId: 'RULE-GEO-03',
            ruleName: 'IMPOSSIBLE TRAVEL',
            triggered: true,
            score: 30,
            evidence: {
              description: 'Card tapped in Bengaluru 15 mins prior to Dubai terminal request (Speed: 10,800 km/h)',
              locations: { prevLocation: 'Bengaluru', currLocation: 'Dubai', timeDiffMinutes: 15, speedKmh: 10800 },
            },
          },
        ],
        riskScore: 70,
        riskLevel: 'HIGH' as const,
        decision: 'HOLD & CALL CARDHOLDER',
        explanation: 'Physical presence in two separate countries separated by 2,700 km within 15 minutes implies credential cloning or proxy relay.',
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
          latitude: 17.3850,
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
            ruleId: 'RULE-VEL-01',
            ruleName: 'HIGH TRANSACTION VELOCITY',
            triggered: false,
            score: 0,
            evidence: { description: '1 transaction in 24 hours. Well within limits.' },
          },
          {
            id: 'SIM-R-AMT',
            transactionId: 'SIM-10024',
            ruleId: 'RULE-AMT-02',
            ruleName: 'UNUSUAL TRANSACTION AMOUNT',
            triggered: false,
            score: 0,
            evidence: { description: '₹1,420 corresponds to customer median grocery ticket.' },
          },
          {
            id: 'SIM-R-GEO',
            transactionId: 'SIM-10024',
            ruleId: 'RULE-GEO-03',
            ruleName: 'IMPOSSIBLE TRAVEL',
            triggered: false,
            score: 0,
            evidence: { description: 'Matches habitual home geofence location.' },
          },
        ],
        riskScore: 6,
        riskLevel: 'LOW' as const,
        decision: 'AUTO-APPROVE',
        explanation: 'Transaction matches regular spending habits, known device fingerprint, and local IP cluster.',
      };
  }
}

/**
 * Composite API Service Object for backwards compatibility & clean namespace
 */
export const apiService = {
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
    let flag = flags.find(f => f.transactionId === id);
    if (!flag) {
      flag = {
        id: `FLAG-${id}`,
        transactionId: id,
        riskScore: 10,
        riskLevel: 'LOW',
        status: 'CLEARED',
        triggeredRuleCount: 0,
        createdAt: tx.timestamp,
      };
    }
    return { transaction: tx, flag, rules, auditLogs };
  },
  async submitReviewDecision(transactionId: string, status: 'REVIEWED' | 'CLEARED', comment: string) {
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

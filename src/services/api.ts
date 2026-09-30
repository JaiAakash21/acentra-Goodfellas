import type { Transaction, TransactionWithFraud } from '../types/transaction';
import type { FraudFlag, RuleResult, AuditEvent, RiskLevel, ReviewStatus } from '../types/fraud';
import type { Rule } from '../types/rule';
import type { Review } from '../types/review';
import { mockTransactions } from '../mock/transactions';
import { mockFraudFlags } from '../mock/fraudFlags';
import { mockRuleResults } from '../mock/ruleResults';
import { mockAuditLogs, mockGeneralAuditEvents } from '../mock/auditLogs';
import { mockRules } from '../mock/rules';

// In-memory / local mutable state for the demo
let transactionsState: Transaction[] = [...mockTransactions];
let fraudFlagsState: FraudFlag[] = [...mockFraudFlags];
let ruleResultsState: Record<string, RuleResult[]> = { ...mockRuleResults };
let auditLogsState: Record<string, AuditEvent[]> = { ...mockAuditLogs };
let generalAuditEventsState = [...mockGeneralAuditEvents];
let rulesState: Rule[] = [...mockRules];
let reviewsState: Review[] = [];

// Helper to assemble full transaction representation
const enrichTransaction = (tx: Transaction): TransactionWithFraud => {
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

export const apiService = {
  /**
   * Fetch all transactions enriched with fraud flags & filtering support
   */
  async getTransactions(filter?: {
    riskLevel?: string;
    status?: string;
    searchQuery?: string;
  }): Promise<TransactionWithFraud[]> {
    await new Promise(r => setTimeout(r, 120)); // Subtle network realism

    let list = transactionsState.map(enrichTransaction);

    if (filter?.riskLevel && filter.riskLevel !== 'ALL') {
      list = list.filter(t => t.riskLevel.toUpperCase() === filter.riskLevel!.toUpperCase());
    }

    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter(t => t.status.toUpperCase() === filter.status!.toUpperCase());
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
  },

  /**
   * Fetch single transaction dossier with fraud flags, explainable rules, and audit timeline
   */
  async getTransactionDetails(id: string): Promise<{
    transaction: Transaction;
    flag: FraudFlag;
    rules: RuleResult[];
    auditLogs: AuditEvent[];
  } | null> {
    await new Promise(r => setTimeout(r, 100));

    const transaction = transactionsState.find(t => t.id === id);
    if (!transaction) return null;

    let flag = fraudFlagsState.find(f => f.transactionId === id);
    if (!flag) {
      flag = {
        id: `FLAG-${transaction.id}`,
        transactionId: transaction.id,
        riskScore: 10,
        riskLevel: 'LOW',
        status: 'CLEARED',
        triggeredRuleCount: 0,
        createdAt: transaction.timestamp,
      };
    }

    const rules = ruleResultsState[id] || [
      {
        id: `RES-${id}-BASE`,
        transactionId: id,
        ruleId: 'RULE-BASE',
        ruleName: 'BASELINE VERIFICATION',
        triggered: false,
        score: flag.riskScore,
        evidence: 'Normal pattern within expected customer baseline bounds.',
      }
    ];

    const auditLogs = auditLogsState[id] || [
      {
        id: `AUD-${id}-01`,
        transactionId: id,
        type: 'SYSTEM',
        message: 'Transaction captured and routed through real-time scoring stream',
        timestamp: transaction.timestamp,
      },
      {
        id: `AUD-${id}-02`,
        transactionId: id,
        type: 'SCORE_CALCULATION',
        message: `Evaluation completed: Risk score ${flag.riskScore}/100`,
        timestamp: transaction.timestamp,
      }
    ];

    return {
      transaction,
      flag,
      rules,
      auditLogs,
    };
  },

  /**
   * Submit reviewer decision (Mark as Reviewed or Clear Case)
   */
  async submitReviewDecision(
    transactionId: string,
    status: ReviewStatus,
    comment: string,
    reviewer: string = 'Keshv (Senior Fraud Lead)'
  ): Promise<{ success: boolean; flag: FraudFlag; review: Review; auditEvent: AuditEvent }> {
    await new Promise(r => setTimeout(r, 200));

    // Update flag status
    let flag = fraudFlagsState.find(f => f.transactionId === transactionId);
    if (flag) {
      flag.status = status;
    } else {
      flag = {
        id: `FLAG-${transactionId}`,
        transactionId,
        riskScore: 60,
        riskLevel: 'MEDIUM',
        status,
        triggeredRuleCount: 1,
        createdAt: new Date().toISOString(),
      };
      fraudFlagsState.push(flag);
    }

    const review: Review = {
      id: `REV-${Date.now()}`,
      fraudFlagId: flag.id,
      reviewer,
      status,
      comment: comment || (status === 'CLEARED' ? 'Case marked cleared after analyst verification.' : 'Marked as reviewed.'),
      reviewedAt: new Date().toISOString(),
    };
    reviewsState.push(review);

    const auditEvent: AuditEvent = {
      id: `AUD-DEC-${Date.now()}`,
      transactionId,
      type: 'DECISION_SUBMITTED',
      message: `Reviewer ${reviewer} updated case status to ${status}. Note: "${comment || 'No comment provided'}"`,
      timestamp: new Date().toISOString(),
    };

    if (!auditLogsState[transactionId]) {
      auditLogsState[transactionId] = [];
    }
    auditLogsState[transactionId].push(auditEvent);

    generalAuditEventsState.unshift({
      id: auditEvent.id,
      transactionId,
      type: 'DECISION_SUBMITTED',
      message: `Case ${transactionId} updated to ${status} by ${reviewer}`,
      timestamp: auditEvent.timestamp,
    });

    return { success: true, flag, review, auditEvent };
  },

  /**
   * Fetch Dashboard KPIs and analytics charts
   */
  async getDashboardData() {
    await new Promise(r => setTimeout(r, 80));

    const totalTransactions = 12480;
    const flagged = 438;
    const highRisk = 121;
    const critical = 38;
    const pendingReview = 64;

    const trendData = [
      { time: '00:00', totalVolume: 420, flaggedCount: 14, criticalCount: 2 },
      { time: '02:00', totalVolume: 280, flaggedCount: 8, criticalCount: 1 },
      { time: '04:00', totalVolume: 190, flaggedCount: 11, criticalCount: 3 },
      { time: '06:00', totalVolume: 410, flaggedCount: 22, criticalCount: 5 },
      { time: '08:00', totalVolume: 890, flaggedCount: 46, criticalCount: 8 },
      { time: '10:00', totalVolume: 1420, flaggedCount: 68, criticalCount: 12 },
      { time: '12:00', totalVolume: 1680, flaggedCount: 84, criticalCount: 7 },
      { time: '14:00', totalVolume: 1540, flaggedCount: 71, criticalCount: 9 },
      { time: '16:00', totalVolume: 1720, flaggedCount: 89, criticalCount: 11 },
      { time: '18:00', totalVolume: 1850, flaggedCount: 92, criticalCount: 14 },
      { time: '20:00', totalVolume: 1320, flaggedCount: 54, criticalCount: 6 },
      { time: '22:00', totalVolume: 760, flaggedCount: 28, criticalCount: 3 },
    ];

    const riskDistribution = [
      { name: 'Low Risk (0-30)', count: 11921, color: '#10B981' },
      { name: 'Medium Risk (31-60)', count: 320, color: '#F59E0B' },
      { name: 'High Risk (61-80)', count: 121, color: '#F97316' },
      { name: 'Critical Risk (81-100)', count: 38, color: '#EF4444' },
    ];

    const recentHighRisk = transactionsState
      .map(enrichTransaction)
      .filter(t => t.riskLevel === 'CRITICAL' || t.riskLevel === 'HIGH')
      .slice(0, 6);

    return {
      kpis: {
        totalTransactions,
        flagged,
        highRisk,
        critical,
        pendingReview,
      },
      trendData,
      riskDistribution,
      recentHighRisk,
      recentAuditEvents: generalAuditEventsState.slice(0, 6),
    };
  },

  /**
   * Rule Studio API methods
   */
  async getRules(): Promise<Rule[]> {
    await new Promise(r => setTimeout(r, 60));
    return [...rulesState];
  },

  async createRule(newRuleData: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Rule> {
    await new Promise(r => setTimeout(r, 150));
    const newRule: Rule = {
      ...newRuleData,
      id: `RULE-${newRuleData.ruleType.slice(0, 3)}-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    rulesState.unshift(newRule);
    return newRule;
  },

  async toggleRule(id: string, enabled: boolean): Promise<Rule> {
    const rule = rulesState.find(r => r.id === id);
    if (!rule) throw new Error('Rule not found');
    rule.enabled = enabled;
    rule.updatedAt = new Date().toISOString();
    return { ...rule };
  },

  async deleteRule(id: string): Promise<boolean> {
    rulesState = rulesState.filter(r => r.id !== id);
    return true;
  },

  /**
   * Fraud Simulator Engine
   */
  async simulateFraudScenario(scenarioId: string) {
    await new Promise(r => setTimeout(r, 400));

    switch (scenarioId) {
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
          breakdown: {
            velocity: 30,
            amount: 25,
            location: 30,
            total: 85,
          },
          ruleResults: [
            {
              id: 'SIM-R-VEL',
              ruleId: 'RULE-VEL-01',
              ruleName: 'HIGH TRANSACTION VELOCITY',
              triggered: true,
              score: 30,
              evidence: '6 transactions detected within 10 minutes (Threshold: 4)',
              details: {
                metric: 'Rolling Frequency',
                expected: '<= 4 tx/10min',
                actual: '6 tx/10min'
              }
            },
            {
              id: 'SIM-R-AMT',
              ruleId: 'RULE-AMT-02',
              ruleName: 'UNUSUAL TRANSACTION AMOUNT',
              triggered: true,
              score: 25,
              evidence: '₹87,500 is 7.3x the customer\'s historical average of ₹12,000',
              details: {
                metric: 'Amount Multiplier',
                expected: '<= 3.5x average',
                actual: '7.3x average'
              }
            },
            {
              id: 'SIM-R-GEO',
              ruleId: 'RULE-GEO-03',
              ruleName: 'IMPOSSIBLE TRAVEL',
              triggered: true,
              score: 30,
              evidence: 'Previous location: Chennai | Current location: London | Elapsed time: 25 mins | Speed: 5,420 km/h',
              details: {
                locations: {
                  prevLocation: 'Chennai, India',
                  currLocation: 'London, UK',
                  timeDiffMinutes: 25,
                  speedKmh: 5420
                }
              }
            },
          ],
          riskScore: 85,
          riskLevel: 'CRITICAL' as RiskLevel,
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
              ruleId: 'RULE-VEL-01',
              ruleName: 'HIGH TRANSACTION VELOCITY',
              triggered: true,
              score: 30,
              evidence: '14 micro-transactions executed in under 3 minutes',
            },
            {
              id: 'SIM-R-AMT',
              ruleId: 'RULE-AMT-02',
              ruleName: 'UNUSUAL TRANSACTION AMOUNT',
              triggered: false,
              score: 0,
              evidence: '₹4,500 is within normal balance parameters',
            },
          ],
          riskScore: 65,
          riskLevel: 'HIGH' as RiskLevel,
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
              ruleId: 'RULE-AMT-02',
              ruleName: 'UNUSUAL TRANSACTION AMOUNT',
              triggered: true,
              score: 25,
              evidence: '₹195,000 is 12.5x customer historical mean of ₹15,600',
            },
          ],
          riskScore: 55,
          riskLevel: 'MEDIUM' as RiskLevel,
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
              ruleId: 'RULE-GEO-03',
              ruleName: 'IMPOSSIBLE TRAVEL',
              triggered: true,
              score: 30,
              evidence: 'Card tapped in Bengaluru 15 mins prior to Dubai terminal request (Speed: 10,800 km/h)',
            },
          ],
          riskScore: 70,
          riskLevel: 'HIGH' as RiskLevel,
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
              ruleId: 'RULE-VEL-01',
              ruleName: 'HIGH TRANSACTION VELOCITY',
              triggered: false,
              score: 0,
              evidence: '1 transaction in 24 hours. Well within limits.',
            },
            {
              id: 'SIM-R-AMT',
              ruleId: 'RULE-AMT-02',
              ruleName: 'UNUSUAL TRANSACTION AMOUNT',
              triggered: false,
              score: 0,
              evidence: '₹1,420 corresponds to customer median grocery ticket (₹1,500).',
            },
            {
              id: 'SIM-R-GEO',
              ruleId: 'RULE-GEO-03',
              ruleName: 'IMPOSSIBLE TRAVEL',
              triggered: false,
              score: 0,
              evidence: 'Matches habitual home geofence location.',
            },
          ],
          riskScore: 6,
          riskLevel: 'LOW' as RiskLevel,
          decision: 'AUTO-APPROVE',
          explanation: 'Transaction matches regular spending habits, known device fingerprint, and local IP cluster.',
        };
    }
  }
};

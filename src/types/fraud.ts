export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ReviewStatus = 'PENDING' | 'REVIEWED' | 'CLEARED';

export interface FraudFlag {
  id: string;
  transactionId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  status: ReviewStatus;
  triggeredRuleCount: number;
  createdAt: string;
}

export interface RuleResult {
  id: string;
  transactionId: string;
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  score: number;
  evidence: string;
  details?: {
    metric?: string;
    expected?: string;
    actual?: string;
    historicalAverage?: string;
    locations?: {
      prevLocation: string;
      currLocation: string;
      timeDiffMinutes: number;
      speedKmh: number;
    };
    velocityData?: {
      windowMinutes: number;
      txCount: number;
      threshold: number;
    };
    amountData?: {
      amount: number;
      historicalAvg: number;
      multiplier: number;
    };
  };
}

export interface AuditEvent {
  id: string;
  transactionId: string;
  type: 'RULE_EVALUATION' | 'SCORE_CALCULATION' | 'ALERT_GENERATED' | 'CASE_VIEWED' | 'DECISION_SUBMITTED' | 'SYSTEM';
  message: string;
  timestamp: string;
}

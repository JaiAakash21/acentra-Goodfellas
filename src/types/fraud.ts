export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ReviewStatus = 'PENDING_REVIEW' | 'REVIEWED' | 'CLEARED';

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
  evidence: Record<string, unknown>;
}

export interface AuditEvent {
  id: string;
  transactionId: string;
  type: string;
  message: string;
  timestamp: string;
}

export interface DashboardStats {
  totalTransactions: number;
  flaggedTransactions: number;
  highRisk: number;
  critical: number;
  pendingReviews: number;
}

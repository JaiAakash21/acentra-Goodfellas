export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  currency: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  locationName: string;
  merchant: string;
  deviceId: string;
  ipAddress: string;
}

export interface TransactionWithFraud extends Transaction {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING_REVIEW' | 'REVIEWED' | 'CLEARED';
  triggeredRuleCount: number;
  flagId: string;
}

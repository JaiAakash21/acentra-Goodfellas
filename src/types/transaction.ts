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
  riskScore?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: 'PENDING_REVIEW' | 'REVIEWED' | 'CLEARED';
  triggeredRuleCount?: number;
  flagId?: string;
  isFlagged?: boolean;
}

export interface TransactionWithFraud extends Transaction {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING_REVIEW' | 'REVIEWED' | 'CLEARED';
  triggeredRuleCount: number;
  flagId: string;
}

export interface TransactionCreatePayload {
  customer_id: string;
  amount: number;
  currency: string;
  merchant?: string;
  category?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
}



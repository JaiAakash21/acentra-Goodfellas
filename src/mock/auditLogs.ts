import type { AuditEvent } from '../types/fraud';

export const mockAuditLogs: Record<string, AuditEvent[]> = {
  'TX-98421': [
    {
      id: 'AUD-01',
      transactionId: 'TX-98421',
      type: 'SYSTEM',
      message: 'Transaction received via Payment Gateway API (Ingestion Latency: 14ms)',
      timestamp: '2026-09-30T10:42:15.102Z',
    },
    {
      id: 'AUD-02',
      transactionId: 'TX-98421',
      type: 'RULE_EVALUATION',
      message: 'Velocity rule evaluated: 6 txs in 10m window exceeded threshold (4) -> Triggered (+30 pts)',
      timestamp: '2026-09-30T10:42:15.220Z',
    },
    {
      id: 'AUD-03',
      transactionId: 'TX-98421',
      type: 'RULE_EVALUATION',
      message: 'Amount rule evaluated: ₹87,500 is 7.3x user avg (₹12,000) -> Triggered (+25 pts)',
      timestamp: '2026-09-30T10:42:15.340Z',
    },
    {
      id: 'AUD-04',
      transactionId: 'TX-98421',
      type: 'RULE_EVALUATION',
      message: 'Geo rule evaluated: Speed between Chennai and London = 5,420 km/h -> Triggered (+30 pts)',
      timestamp: '2026-09-30T10:42:15.480Z',
    },
    {
      id: 'AUD-05',
      transactionId: 'TX-98421',
      type: 'SCORE_CALCULATION',
      message: 'Risk score calculated: 85/100 (Threshold CRITICAL >= 80) -> Classification: CRITICAL',
      timestamp: '2026-09-30T10:42:15.510Z',
    },
    {
      id: 'AUD-06',
      transactionId: 'TX-98421',
      type: 'ALERT_GENERATED',
      message: 'Critical Fraud Flag raised. Case routed to Tier 2 Fraud Review Queue',
      timestamp: '2026-09-30T10:42:15.650Z',
    },
    {
      id: 'AUD-07',
      transactionId: 'TX-98421',
      type: 'CASE_VIEWED',
      message: 'Reviewer analyst_09 (Keshv) opened investigation case docket',
      timestamp: '2026-09-30T10:45:10.000Z',
    },
  ],
  'TX-98418': [
    {
      id: 'AUD-18-01',
      transactionId: 'TX-98418',
      type: 'SYSTEM',
      message: 'Transaction authorization requested from POS terminal Dubai Marina',
      timestamp: '2026-09-30T10:05:40.100Z',
    },
    {
      id: 'AUD-18-02',
      transactionId: 'TX-98418',
      type: 'RULE_EVALUATION',
      message: 'Amount rule evaluated: High value bullion transaction triggered (+30 pts)',
      timestamp: '2026-09-30T10:05:40.230Z',
    },
    {
      id: 'AUD-18-03',
      transactionId: 'TX-98418',
      type: 'SCORE_CALCULATION',
      message: 'Composite Risk score calculated: 92/100 -> CRITICAL',
      timestamp: '2026-09-30T10:05:40.400Z',
    },
    {
      id: 'AUD-18-04',
      transactionId: 'TX-98418',
      type: 'ALERT_GENERATED',
      message: 'High priority alert dispatched to automated hold queue',
      timestamp: '2026-09-30T10:05:40.500Z',
    }
  ]
};

export const mockGeneralAuditEvents = [
  {
    id: 'AUD-GEN-1',
    transactionId: 'TX-98421',
    type: 'ALERT_GENERATED',
    message: 'Critical risk flag triggered on Account ACC-884920 (Score: 85)',
    timestamp: '2026-09-30T10:42:15Z',
  },
  {
    id: 'AUD-GEN-2',
    transactionId: 'TX-98418',
    type: 'ALERT_GENERATED',
    message: 'Extreme anomaly detected at Dubai merchant (Score: 92)',
    timestamp: '2026-09-30T10:05:41Z',
  },
  {
    id: 'AUD-GEN-3',
    transactionId: 'TX-98409',
    type: 'DECISION_SUBMITTED',
    message: 'Analyst approved manual verification for BitVault transaction',
    timestamp: '2026-09-30T09:25:12Z',
  },
  {
    id: 'AUD-GEN-4',
    transactionId: 'TX-98379',
    type: 'DECISION_SUBMITTED',
    message: 'Analyst marked Tokyo Akihabara purchase as REVIEWED',
    timestamp: '2026-09-30T06:45:00Z',
  },
  {
    id: 'AUD-GEN-5',
    transactionId: 'TX-98412',
    type: 'DECISION_SUBMITTED',
    message: 'Marina Bay transaction cleared after biometric 2FA validation',
    timestamp: '2026-09-30T09:40:00Z',
  }
];

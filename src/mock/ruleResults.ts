import type { RuleResult } from '../types/fraud';

export const mockRuleResults: Record<string, RuleResult[]> = {
  'TX-98421': [
    {
      id: 'RES-98421-1',
      transactionId: 'TX-98421',
      ruleId: 'RULE-VEL-01',
      ruleName: 'HIGH TRANSACTION VELOCITY',
      triggered: true,
      score: 30,
      evidence: '6 transactions detected within 10 minutes across connected accounts',
      details: {
        metric: 'Transaction Frequency',
        expected: '<= 4 transactions / 10 min window',
        actual: '6 transactions / 10 min window',
        velocityData: {
          windowMinutes: 10,
          txCount: 6,
          threshold: 4,
        }
      }
    },
    {
      id: 'RES-98421-2',
      transactionId: 'TX-98421',
      ruleId: 'RULE-AMT-02',
      ruleName: 'UNUSUAL TRANSACTION AMOUNT',
      triggered: true,
      score: 25,
      evidence: '₹87,500 is 7.3x the customer\'s historical average of ₹12,000',
      details: {
        metric: 'Historical Amount Multiplier',
        expected: '<= 3.5x average threshold',
        actual: '7.3x historical average',
        historicalAverage: '₹12,000',
        amountData: {
          amount: 87500,
          historicalAvg: 12000,
          multiplier: 7.3,
        }
      }
    },
    {
      id: 'RES-98421-3',
      transactionId: 'TX-98421',
      ruleId: 'RULE-GEO-03',
      ruleName: 'IMPOSSIBLE TRAVEL',
      triggered: true,
      score: 30,
      evidence: 'Previous location: Chennai | Current location: London | Elapsed time: 25 minutes | Estimated required speed: 5,420 km/h',
      details: {
        metric: 'Geographic Velocity',
        expected: '<= 850 km/h commercial flight speed',
        actual: '5,420 km/h required transit speed',
        locations: {
          prevLocation: 'Chennai, India',
          currLocation: 'London, United Kingdom',
          timeDiffMinutes: 25,
          speedKmh: 5420,
        }
      }
    }
  ],
  'TX-98418': [
    {
      id: 'RES-98418-1',
      transactionId: 'TX-98418',
      ruleId: 'RULE-AMT-02',
      ruleName: 'UNUSUAL TRANSACTION AMOUNT',
      triggered: true,
      score: 30,
      evidence: '₹145,000 exceeds 10x standard retail category baseline',
      details: {
        metric: 'Amount Deviation',
        historicalAverage: '₹14,500',
        actual: '10.0x baseline'
      }
    },
    {
      id: 'RES-98418-2',
      transactionId: 'TX-98418',
      ruleId: 'RULE-DEV-04',
      ruleName: 'UNRECOGNIZED DEVICE FINGERPRINT',
      triggered: true,
      score: 25,
      evidence: 'New device DEV-S24U-9912 enrolled without biometric confirmation',
      details: {
        metric: 'Device Trust Score',
        actual: 'Zero prior authorization history'
      }
    },
    {
      id: 'RES-98418-3',
      transactionId: 'TX-98418',
      ruleId: 'RULE-BEH-05',
      ruleName: 'HIGH-RISK MERCHANT & MIDNIGHT BURST',
      triggered: true,
      score: 37,
      evidence: 'Immediate bullion liquid asset liquidation at high-risk MCC',
      details: {
        metric: 'Merchant Category',
        actual: 'Bullion / Precious metals'
      }
    }
  ],
  'TX-98401': [
    {
      id: 'RES-98401-1',
      transactionId: 'TX-98401',
      ruleId: 'RULE-GEO-03',
      ruleName: 'IMPOSSIBLE TRAVEL',
      triggered: true,
      score: 35,
      evidence: 'Previous location: Delhi | Current: San Francisco within 45 mins (Speed: 16,800 km/h)',
      details: {
        locations: {
          prevLocation: 'New Delhi, India',
          currLocation: 'San Francisco, USA',
          timeDiffMinutes: 45,
          speedKmh: 16800,
        }
      }
    },
    {
      id: 'RES-98401-2',
      transactionId: 'TX-98401',
      ruleId: 'RULE-BEH-05',
      ruleName: 'CRYPTO OFF-RAMP HIGH VALUE',
      triggered: true,
      score: 30,
      evidence: 'Direct transfer to unhosted wallet via exchange gateway',
      details: {
        metric: 'MCC Tier',
        actual: 'Crypto Assets'
      }
    },
    {
      id: 'RES-98401-3',
      transactionId: 'TX-98401',
      ruleId: 'RULE-DEV-04',
      ruleName: 'UNKNOWN USER AGENT HEADLESS',
      triggered: true,
      score: 23,
      evidence: 'Browser client spoofing User-Agent headers with automation flags',
      details: {
        metric: 'Client Signature',
        actual: 'Automated Headless Chromium'
      }
    }
  ]
};

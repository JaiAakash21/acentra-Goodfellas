import type { DashboardStats } from '../types/fraud';

export const mockDashboardStats: DashboardStats = {
  totalTransactions: 12480,
  flaggedTransactions: 438,
  highRisk: 121,
  critical: 38,
  pendingReviews: 64,
};

export const mockTrendData = [
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

export const mockRiskDistribution = [
  { name: 'Low Risk (0-30)', count: 11921, color: '#10B981' },
  { name: 'Medium Risk (31-60)', count: 320, color: '#F59E0B' },
  { name: 'High Risk (61-80)', count: 121, color: '#F97316' },
  { name: 'Critical Risk (81-100)', count: 38, color: '#EF4444' },
];

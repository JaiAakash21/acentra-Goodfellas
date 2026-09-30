import type { Review } from '../types/review';

export const mockReviews: Review[] = [
  {
    id: 'REV-98409',
    fraudFlagId: 'FLAG-98409',
    reviewer: 'Keshv (Senior Fraud Lead)',
    status: 'REVIEWED',
    comment: 'Manual biometric validation confirmed with account holder via mobile app push notification.',
    reviewedAt: '2026-09-30T09:25:12Z',
  },
  {
    id: 'REV-98379',
    fraudFlagId: 'FLAG-98379',
    reviewer: 'Keshv (Senior Fraud Lead)',
    status: 'REVIEWED',
    comment: 'Cardholder confirmed travel to Akihabara, Japan. Temporary travel whitelist applied for 7 days.',
    reviewedAt: '2026-09-30T06:45:00Z',
  },
  {
    id: 'REV-98412',
    fraudFlagId: 'FLAG-98412',
    reviewer: 'System Compliance Policy',
    status: 'CLEARED',
    comment: 'Cleared automatically after successful 3DS 2.2 secondary authorization.',
    reviewedAt: '2026-09-30T09:40:00Z',
  },
  {
    id: 'REV-98395',
    fraudFlagId: 'FLAG-98395',
    reviewer: 'Keshv (Senior Fraud Lead)',
    status: 'CLEARED',
    comment: 'Jewellery merchant purchase verified with regular annual festive spend pattern.',
    reviewedAt: '2026-09-30T08:10:00Z',
  },
];

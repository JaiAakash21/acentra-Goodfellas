export interface Review {
  id: string;
  fraudFlagId: string;
  reviewer: string;
  status: 'REVIEWED' | 'CLEARED';
  comment: string;
  reviewedAt: string;
}

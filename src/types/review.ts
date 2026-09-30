import type { ReviewStatus } from './fraud';

export interface Review {
  id: string;
  fraudFlagId: string;
  reviewer: string;
  status: ReviewStatus;
  comment: string;
  reviewedAt: string;
}

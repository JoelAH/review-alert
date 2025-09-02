import { Review } from '@/lib/models/client/review';
import { Quest, QuestState } from '@/lib/models/client/quest';

export interface ReviewCardProps {
  review: Review;
  appName: string;
  platform: 'GooglePlay' | 'AppleStore' | 'ChromeExt';
  onQuestCreated?: (questId: string) => void;
}

export interface QuestCardProps {
  quest: Quest;
  onStateChange: (questId: string, newState: QuestState) => void;
  onEdit: (quest: Quest) => void;
}

export interface ReviewOverviewProps {
  totalReviews: number;
  sentimentBreakdown: {
    positive: number;
    negative: number;
  };
  platformBreakdown: {
    GooglePlay: number;
    AppleStore: number;
    ChromeExt: number;
  };
  questBreakdown?: {
    bug: number;
    featureRequest: number;
    other: number;
  };
}

export interface ReviewFiltersProps {
  filters: {
    platform?: 'GooglePlay' | 'AppleStore' | 'ChromeExt';
    rating?: number;
    sentiment?: 'POSITIVE' | 'NEGATIVE';
    quest?: 'BUG' | 'FEATURE_REQUEST' | 'OTHER';
    search?: string;
  };
  onFiltersChange: (filters: ReviewFiltersProps['filters']) => void;
}

export type Platform = 'GooglePlay' | 'AppleStore' | 'ChromeExt';
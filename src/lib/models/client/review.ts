// Client-side review types
export enum ReviewSentiment {
  POSITIVE = "POSITIVE",
  NEGATIVE = "NEGATIVE"
}

export enum ReviewQuest {
  BUG = "BUG",
  FEATURE_REQUEST = "FEATURE_REQUEST", 
  OTHER = "OTHER"
}

export enum ReviewPriority {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW"
}

export interface Review {
  _id: string;
  user: string; // User ObjectId as string
  appId: string; // App ObjectId as string
  name: string;
  comment: string;
  date: Date | string; // Can be Date object or ISO string
  rating: number; // 1-5 stars
  sentiment: ReviewSentiment;
  quest?: ReviewQuest;
  priority?: ReviewPriority;
  questId?: string; // Quest ObjectId as string, optional reference to created quest
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Helper type for creating new reviews (without generated fields)
export interface CreateReviewInput {
  user: string;
  appId: string;
  name: string;
  comment: string;
  date: Date | string;
  rating: number;
  sentiment: ReviewSentiment;
  quest?: ReviewQuest;
  priority?: ReviewPriority;
}

// Helper type for updating reviews
export interface UpdateReviewInput {
  quest?: ReviewQuest;
  priority?: ReviewPriority;
  sentiment?: ReviewSentiment;
  questId?: string;
}
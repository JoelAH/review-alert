// Client-side quest types
export enum QuestType {
  BUG_FIX = "BUG_FIX",
  FEATURE_REQUEST = "FEATURE_REQUEST",
  IMPROVEMENT = "IMPROVEMENT",
  RESEARCH = "RESEARCH",
  OTHER = "OTHER"
}

export enum QuestPriority {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW"
}

export enum QuestState {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE"
}

export interface Quest {
  _id: string;
  user: string; // User ObjectId as string
  reviewId?: string; // Review ObjectId as string, optional reference to originating review
  title: string;
  details?: string;
  type: QuestType;
  priority: QuestPriority;
  state: QuestState;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Helper type for creating new quests (without generated fields)
export interface CreateQuestInput {
  user: string;
  reviewId?: string;
  title: string;
  details?: string;
  type: QuestType;
  priority: QuestPriority;
  state?: QuestState; // Optional, defaults to OPEN
}

// Helper type for updating quests
export interface UpdateQuestInput {
  title?: string;
  details?: string;
  type?: QuestType;
  priority?: QuestPriority;
  state?: QuestState;
}

// Helper type for quest creation from review data
export interface CreateQuestFromReviewInput {
  reviewId: string;
  title: string;
  details?: string;
  type: QuestType;
  priority: QuestPriority;
}
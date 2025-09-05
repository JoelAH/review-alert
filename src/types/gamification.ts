export interface GamificationData {
  xp: number;
  level: number;
  badges: Badge[];
  streaks: {
    currentLoginStreak: number;
    longestLoginStreak: number;
    lastLoginDate?: Date;
  };
  activityCounts: {
    questsCreated: number;
    questsCompleted: number;
    questsInProgress: number;
    appsAdded: number;
    reviewInteractions: number;
  };
  xpHistory: XPTransaction[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  earnedAt: Date;
  category: BadgeCategory;
}

export interface XPTransaction {
  amount: number;
  action: XPAction;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export enum BadgeCategory {
  MILESTONE = "MILESTONE",
  ACHIEVEMENT = "ACHIEVEMENT", 
  STREAK = "STREAK",
  COLLECTION = "COLLECTION"
}

export enum XPAction {
  QUEST_CREATED = "QUEST_CREATED",
  QUEST_IN_PROGRESS = "QUEST_IN_PROGRESS", 
  QUEST_COMPLETED = "QUEST_COMPLETED",
  APP_ADDED = "APP_ADDED",
  REVIEW_INTERACTION = "REVIEW_INTERACTION",
  LOGIN_STREAK_BONUS = "LOGIN_STREAK_BONUS"
}
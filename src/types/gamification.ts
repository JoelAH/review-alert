/**
 * Core gamification type definitions and enums for ReviewQuest
 * Defines XP system, badges, and related data structures
 */

// XP Action Types - Actions that award experience points
export enum XPAction {
  QUEST_CREATED = "QUEST_CREATED",
  QUEST_IN_PROGRESS = "QUEST_IN_PROGRESS", 
  QUEST_COMPLETED = "QUEST_COMPLETED",
  APP_ADDED = "APP_ADDED",
  REVIEW_INTERACTION = "REVIEW_INTERACTION",
  LOGIN_STREAK_BONUS = "LOGIN_STREAK_BONUS"
}

// Badge Categories - Different types of badges users can earn
export enum BadgeCategory {
  MILESTONE = "MILESTONE",      // XP-based achievements
  ACHIEVEMENT = "ACHIEVEMENT",  // Activity-based achievements
  STREAK = "STREAK",           // Consecutive activity achievements
  COLLECTION = "COLLECTION"    // Collection-based achievements
}

// XP Transaction - Record of XP gained from specific actions
export interface XPTransaction {
  amount: number;
  action: XPAction;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Badge - Earned badge with timestamp
export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  earnedAt: Date;
  category: BadgeCategory;
}

// Badge Definition - Template for badges that can be earned
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  category: BadgeCategory;
  requirements: BadgeRequirement[];
}

// Badge Requirement - Conditions that must be met to earn a badge
export interface BadgeRequirement {
  type: 'xp' | 'activity_count' | 'streak' | 'combination';
  value: number;
  field?: string; // For activity_count type (e.g., 'questsCompleted')
}

// Badge Progress - Progress toward earning a specific badge
export interface BadgeProgress {
  badge: BadgeDefinition;
  progress: number;
  target: number;
  earned: boolean;
}

// Gamification Data - Complete gamification state for a user
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

// XP Award Result - Result of awarding XP to a user
export interface XPAwardResult {
  xpAwarded: number;
  totalXP: number;
  levelUp: boolean;
  newLevel?: number;
  badgesEarned: Badge[];
}
'use client';

import { 
  XPAction, 
  XPTransaction, 
  XPAwardResult, 
  GamificationData 
} from '@/types/gamification';

/**
 * Client-side XP Service - Pure calculation utilities without database operations
 * This service can be safely imported by client components
 */
export class XPClientService {
  // XP award amounts for different actions
  private static readonly XP_VALUES: Record<XPAction, number> = {
    [XPAction.QUEST_CREATED]: 10,
    [XPAction.QUEST_IN_PROGRESS]: 5,
    [XPAction.QUEST_COMPLETED]: 15,
    [XPAction.APP_ADDED]: 20,
    [XPAction.REVIEW_INTERACTION]: 8,
    [XPAction.LOGIN_STREAK_BONUS]: 0, // Variable based on streak length
  };

  // Level thresholds - XP required to reach each level
  private static readonly LEVEL_THRESHOLDS: number[] = [
    0,     // Level 1
    100,   // Level 2
    250,   // Level 3
    500,   // Level 4
    1000,  // Level 5
    1750,  // Level 6
    2750,  // Level 7
    4000,  // Level 8
    5500,  // Level 9
    7500,  // Level 10
    10000, // Level 11
  ];

  /**
   * Calculate user level based on total XP
   * @param xp - Total XP amount
   * @returns number - User level (starts at 1)
   */
  static calculateLevel(xp: number): number {
    if (xp < 0) return 1;
    
    for (let i = this.LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= this.LEVEL_THRESHOLDS[i]) {
        return i + 1; // Add 1 because levels start at 1, not 0
      }
    }
    return 1;
  }

  /**
   * Get XP required for next level
   * @param currentXP - Current XP amount
   * @returns number - XP needed for next level, or 0 if at max level
   */
  static getXPForNextLevel(currentXP: number): number {
    const currentLevel = this.calculateLevel(currentXP);
    const nextLevelIndex = currentLevel; // Since levels start at 1, level 2 is at index 1
    
    if (nextLevelIndex >= this.LEVEL_THRESHOLDS.length) {
      return 0; // Already at max level
    }
    
    return this.LEVEL_THRESHOLDS[nextLevelIndex] - currentXP;
  }

  /**
   * Calculate streak bonus XP based on consecutive days
   * @param streakDays - Number of consecutive days
   * @returns number - Bonus XP amount
   */
  static calculateStreakBonus(streakDays: number): number {
    if (streakDays >= 14) return 15;
    if (streakDays >= 7) return 10;
    if (streakDays >= 3) return 5;
    return 0;
  }

  /**
   * Get XP value for a specific action
   * @param action - The XP action
   * @returns number - XP value for the action
   */
  static getXPValue(action: XPAction): number {
    return this.XP_VALUES[action];
  }

  /**
   * Get level thresholds for reference
   * @returns number[] - Array of XP thresholds for each level
   */
  static getLevelThresholds(): number[] {
    return [...this.LEVEL_THRESHOLDS];
  }

  /**
   * Get XP values for different actions
   * @returns Record<XPAction, number> - XP values for each action
   */
  static getXPValues(): Record<XPAction, number> {
    return { ...this.XP_VALUES };
  }

  /**
   * Check if user should receive streak bonus for current streak length
   * @param streakDays - Number of consecutive login days
   * @returns boolean - True if streak bonus should be awarded
   */
  static shouldAwardStreakBonus(streakDays: number): boolean {
    // Award bonus at specific milestones: 3, 7, 14 days
    return streakDays === 3 || streakDays === 7 || streakDays === 14;
  }

  /**
   * Calculate progress to next level as a percentage
   * @param currentXP - Current XP amount
   * @returns number - Progress percentage (0-100)
   */
  static calculateLevelProgress(currentXP: number): number {
    const currentLevel = this.calculateLevel(currentXP);
    const currentLevelThreshold = this.LEVEL_THRESHOLDS[currentLevel - 1] || 0;
    const nextLevelThreshold = this.LEVEL_THRESHOLDS[currentLevel] || currentXP;
    
    if (nextLevelThreshold === currentXP) {
      return 100; // At max level
    }
    
    const progressInLevel = currentXP - currentLevelThreshold;
    const totalLevelXP = nextLevelThreshold - currentLevelThreshold;
    
    return Math.round((progressInLevel / totalLevelXP) * 100);
  }

  /**
   * Get level name/title based on level number
   * @param level - User level
   * @returns string - Level title
   */
  static getLevelTitle(level: number): string {
    const titles = [
      'Novice',      // Level 1
      'Apprentice',  // Level 2
      'Explorer',    // Level 3
      'Adventurer',  // Level 4
      'Specialist',  // Level 5
      'Expert',      // Level 6
      'Master',      // Level 7
      'Champion',    // Level 8
      'Legend',      // Level 9
      'Grandmaster', // Level 10
      'Mythic',      // Level 11+
    ];
    
    return titles[Math.min(level - 1, titles.length - 1)] || 'Mythic';
  }

  /**
   * Initialize default gamification data for new users (client-side only)
   * @returns GamificationData - Default gamification data
   */
  static initializeGamificationData(): GamificationData {
    return {
      xp: 0,
      level: 1,
      badges: [],
      streaks: {
        currentLoginStreak: 0,
        longestLoginStreak: 0,
      },
      activityCounts: {
        questsCreated: 0,
        questsCompleted: 0,
        questsInProgress: 0,
        appsAdded: 0,
        reviewInteractions: 0,
      },
      xpHistory: [],
    };
  }

  /**
   * Simulate XP award calculation (client-side preview)
   * @param currentXP - Current XP amount
   * @param action - Action that would earn XP
   * @param metadata - Optional metadata
   * @returns Object with preview of XP award result
   */
  static simulateXPAward(
    currentXP: number, 
    action: XPAction, 
    metadata?: Record<string, any>
  ): {
    xpToAward: number;
    newTotalXP: number;
    currentLevel: number;
    newLevel: number;
    levelUp: boolean;
  } {
    let xpToAward = this.XP_VALUES[action];
    
    // Handle special case for login streak bonus
    if (action === XPAction.LOGIN_STREAK_BONUS && metadata?.streakDays) {
      xpToAward = this.calculateStreakBonus(metadata.streakDays);
    }

    const currentLevel = this.calculateLevel(currentXP);
    const newTotalXP = currentXP + xpToAward;
    const newLevel = this.calculateLevel(newTotalXP);
    const levelUp = newLevel > currentLevel;

    return {
      xpToAward,
      newTotalXP,
      currentLevel,
      newLevel,
      levelUp,
    };
  }

  /**
   * Format XP amount for display
   * @param xp - XP amount
   * @returns string - Formatted XP string
   */
  static formatXP(xp: number): string {
    if (xp >= 1000000) {
      return `${(xp / 1000000).toFixed(1)}M XP`;
    } else if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}K XP`;
    }
    return `${xp} XP`;
  }

  /**
   * Get action display name
   * @param action - XP action
   * @returns string - Human-readable action name
   */
  static getActionDisplayName(action: XPAction): string {
    const displayNames: Record<XPAction, string> = {
      [XPAction.QUEST_CREATED]: 'Quest Created',
      [XPAction.QUEST_IN_PROGRESS]: 'Quest Started',
      [XPAction.QUEST_COMPLETED]: 'Quest Completed',
      [XPAction.APP_ADDED]: 'App Added',
      [XPAction.REVIEW_INTERACTION]: 'Review Interaction',
      [XPAction.LOGIN_STREAK_BONUS]: 'Login Streak Bonus',
    };
    
    return displayNames[action] || 'Unknown Action';
  }
}
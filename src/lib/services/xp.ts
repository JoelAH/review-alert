/**
 * XP Service - Core XP calculation and awarding logic
 * Handles experience point calculations, level progression, and database updates
 */

import UserModel from '@/lib/models/server/user';
import { BadgeService } from './badges';
import { 
  XPAction, 
  XPTransaction, 
  XPAwardResult, 
  GamificationData 
} from '@/types/gamification';

export class XPService {
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
   * Award XP to a user for a specific action
   * @param userId - The user's ID
   * @param action - The action that earned XP
   * @param metadata - Optional metadata about the action
   * @returns Promise<XPAwardResult> - Result of the XP award
   */
  static async awardXP(
    userId: string, 
    action: XPAction, 
    metadata?: Record<string, any>
  ): Promise<XPAwardResult> {
    try {
      // Get current user data
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Calculate XP to award
      let xpToAward = this.XP_VALUES[action];
      
      // Handle special case for login streak bonus
      if (action === XPAction.LOGIN_STREAK_BONUS && metadata?.streakDays) {
        xpToAward = this.calculateStreakBonus(metadata.streakDays);
      }

      // Get current gamification data or initialize if not exists
      const currentGamificationData = user.gamification || this.initializeGamificationData();
      const currentLevel = this.calculateLevel(currentGamificationData.xp);
      const newTotalXP = currentGamificationData.xp + xpToAward;
      const newLevel = this.calculateLevel(newTotalXP);
      const levelUp = newLevel > currentLevel;

      // Create XP transaction record
      const xpTransaction: XPTransaction = {
        amount: xpToAward,
        action,
        timestamp: new Date(),
        metadata,
      };

      // Update user's gamification data
      const updatedGamificationData: GamificationData = {
        ...currentGamificationData,
        xp: newTotalXP,
        level: newLevel,
        xpHistory: [...currentGamificationData.xpHistory, xpTransaction],
      };

      // Update activity counts based on action
      this.updateActivityCounts(updatedGamificationData, action);

      // Check for newly earned badges
      const newlyEarnedBadges = await BadgeService.checkAndAwardBadges(userId, updatedGamificationData);
      
      // Add newly earned badges to user's gamification data
      if (newlyEarnedBadges.length > 0) {
        updatedGamificationData.badges = [...updatedGamificationData.badges, ...newlyEarnedBadges];
      }

      // Save to database
      await UserModel.findByIdAndUpdate(userId, {
        gamification: updatedGamificationData,
      });

      // Return result with badges
      return {
        xpAwarded: xpToAward,
        totalXP: newTotalXP,
        levelUp,
        newLevel: levelUp ? newLevel : undefined,
        badgesEarned: newlyEarnedBadges,
      };
    } catch (error) {
      console.error('Error awarding XP:', error);
      throw new Error(`Failed to award XP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

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
   * Get user's complete gamification data
   * @param userId - The user's ID
   * @returns Promise<GamificationData | null> - User's gamification data
   */
  static async getUserGamificationData(userId: string): Promise<GamificationData | null> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        return null;
      }
      
      return user.gamification || this.initializeGamificationData();
    } catch (error) {
      console.error('Error fetching gamification data:', error);
      throw new Error(`Failed to fetch gamification data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize default gamification data for new users
   * @returns GamificationData - Default gamification data
   */
  private static initializeGamificationData(): GamificationData {
    return {
      xp: 0,
      level: 1, // Start at level 1 to match database schema
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
   * Update activity counts based on the action performed
   * @param gamificationData - User's gamification data to update
   * @param action - The action that was performed
   */
  private static updateActivityCounts(gamificationData: GamificationData, action: XPAction): void {
    switch (action) {
      case XPAction.QUEST_CREATED:
        gamificationData.activityCounts.questsCreated++;
        break;
      case XPAction.QUEST_IN_PROGRESS:
        gamificationData.activityCounts.questsInProgress++;
        break;
      case XPAction.QUEST_COMPLETED:
        gamificationData.activityCounts.questsCompleted++;
        break;
      case XPAction.APP_ADDED:
        gamificationData.activityCounts.appsAdded++;
        break;
      case XPAction.REVIEW_INTERACTION:
        gamificationData.activityCounts.reviewInteractions++;
        break;
      // LOGIN_STREAK_BONUS doesn't update activity counts
    }
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
}
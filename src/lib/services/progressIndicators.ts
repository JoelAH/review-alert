'use client';

/**
 * Progress Indicators Service - Smart suggestions and progress tracking
 * Provides progress indicators for badges close to being earned and XP suggestions
 * 
 * NOTE: This is a client-side service that uses XPClientService for calculations.
 * Badge functionality is temporarily disabled until BadgeClientService is implemented.
 */

import {
  GamificationData,
  BadgeProgress,
  XPAction,
  BadgeCategory
} from '@/types/gamification';
import { XPClientService } from './xpClient';

export interface ProgressSuggestion {
  id: string;
  type: 'badge' | 'level' | 'streak' | 'activity';
  title: string;
  description: string;
  actionText: string;
  progress: number;
  target: number;
  priority: 'high' | 'medium' | 'low';
  category?: BadgeCategory;
  estimatedActions?: number;
  motivationalMessage?: string;
}

export interface ActivityPattern {
  questsPerWeek: number;
  appsAddedRecently: number;
  streakConsistency: number;
  mostActiveAction: XPAction;
  recentActivityTrend: 'increasing' | 'decreasing' | 'stable';
}

export class ProgressIndicatorsService {
  private static readonly CLOSE_TO_COMPLETION_THRESHOLD = 0.7; // 70% progress
  private static readonly VERY_CLOSE_THRESHOLD = 0.9; // 90% progress
  private static readonly MAX_SUGGESTIONS = 5;

  /**
   * Get progress indicators and suggestions for a user
   * @param gamificationData - User's current gamification data
   * @returns ProgressSuggestion[] - Array of progress suggestions
   */
  static getProgressSuggestions(gamificationData: GamificationData): ProgressSuggestion[] {
    const suggestions: ProgressSuggestion[] = [];

    // Get badge progress suggestions
    const badgeSuggestions = this.getBadgeProgressSuggestions(gamificationData);
    suggestions.push(...badgeSuggestions);

    // Get level progress suggestions
    const levelSuggestions = this.getLevelProgressSuggestions(gamificationData);
    suggestions.push(...levelSuggestions);

    // Get streak suggestions
    const streakSuggestions = this.getStreakSuggestions(gamificationData);
    suggestions.push(...streakSuggestions);

    // Get activity-based suggestions
    const activitySuggestions = this.getActivitySuggestions(gamificationData);
    suggestions.push(...activitySuggestions);

    // Sort by priority and progress, limit to max suggestions
    return suggestions
      .sort((a, b) => {
        // First sort by priority
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then by progress percentage (closer to completion first)
        const aProgress = a.progress / a.target;
        const bProgress = b.progress / b.target;
        return bProgress - aProgress;
      })
      .slice(0, this.MAX_SUGGESTIONS);
  }

  /**
   * Get badge progress suggestions for badges close to being earned
   * TODO: Implement client-safe badge progress when BadgeClientService is available
   */
  private static getBadgeProgressSuggestions(gamificationData: GamificationData): ProgressSuggestion[] {
    // Temporarily disabled to avoid server-only imports
    // Will be re-enabled when BadgeClientService is implemented
    return [];
  }

  /**
   * Create a badge suggestion based on badge progress
   * TODO: Re-implement when BadgeClientService is available
   */
  private static createBadgeSuggestion(
    progress: BadgeProgress,
    remaining: number,
    priority: 'high' | 'medium' | 'low'
  ): ProgressSuggestion | null {
    // Temporarily disabled to avoid server-only imports
    return null;
  }

  /**
   * Get level progress suggestions when user is close to leveling up
   */
  private static getLevelProgressSuggestions(gamificationData: GamificationData): ProgressSuggestion[] {
    const xpForNextLevel = XPClientService.getXPForNextLevel(gamificationData.xp);

    if (xpForNextLevel === 0) return []; // Already at max level

    const currentLevel = gamificationData.level;
    const nextLevel = currentLevel + 1;
    const levelThresholds = XPClientService.getLevelThresholds();
    const currentLevelXP = levelThresholds[currentLevel - 1] || 0;
    const nextLevelXP = levelThresholds[currentLevel] || 0;
    const totalXPForLevel = nextLevelXP - currentLevelXP;
    const progressInLevel = gamificationData.xp - currentLevelXP;

    const progressPercentage = progressInLevel / totalXPForLevel;

    // Only suggest if close to leveling up
    if (progressPercentage >= this.CLOSE_TO_COMPLETION_THRESHOLD) {
      const priority = progressPercentage >= this.VERY_CLOSE_THRESHOLD ? 'high' : 'medium';
      const estimatedQuests = Math.ceil(xpForNextLevel / XPClientService.getXPValues()[XPAction.QUEST_COMPLETED]);

      return [{
        id: `level-${nextLevel}`,
        type: 'level',
        title: `Almost Level ${nextLevel}!`,
        description: `You're close to reaching Level ${nextLevel}`,
        actionText: 'Complete quests or add apps to level up',
        progress: progressInLevel,
        target: totalXPForLevel,
        priority,
        estimatedActions: estimatedQuests,
        motivationalMessage: `Just ${xpForNextLevel} XP away from Level ${nextLevel}!`
      }];
    }

    return [];
  }

  /**
   * Get streak-related suggestions
   */
  private static getStreakSuggestions(gamificationData: GamificationData): ProgressSuggestion[] {
    const currentStreak = gamificationData.streaks.currentLoginStreak;
    const suggestions: ProgressSuggestion[] = [];

    // Suggest maintaining streak if user has one
    if (currentStreak >= 2) {
      const nextMilestone = this.getNextStreakMilestone(currentStreak);
      if (nextMilestone) {
        const remaining = nextMilestone - currentStreak;
        const priority = remaining <= 2 ? 'high' : 'medium';

        suggestions.push({
          id: `streak-${nextMilestone}`,
          type: 'streak',
          title: `${remaining} days to streak milestone`,
          description: `Reach a ${nextMilestone}-day login streak for bonus XP`,
          actionText: 'Keep logging in daily',
          progress: currentStreak,
          target: nextMilestone,
          priority,
          estimatedActions: remaining,
          motivationalMessage: `${remaining} more day${remaining === 1 ? '' : 's'} for a streak bonus!`
        });
      }
    } else if (currentStreak === 0) {
      // Encourage starting a streak
      suggestions.push({
        id: 'streak-start',
        type: 'streak',
        title: 'Start a login streak',
        description: 'Log in daily to build a streak and earn bonus XP',
        actionText: 'Log in tomorrow to start your streak',
        progress: 0,
        target: 3,
        priority: 'low',
        estimatedActions: 3,
        motivationalMessage: 'Start a 3-day streak to earn your first streak bonus!'
      });
    }

    return suggestions;
  }

  /**
   * Get activity-based suggestions based on user patterns
   */
  private static getActivitySuggestions(gamificationData: GamificationData): ProgressSuggestion[] {
    const suggestions: ProgressSuggestion[] = [];
    const activityPattern = this.analyzeActivityPattern(gamificationData);

    // Suggest quest completion if user has quests in progress
    if (gamificationData.activityCounts.questsInProgress > 0) {
      suggestions.push({
        id: 'complete-quests',
        type: 'activity',
        title: 'Complete your in-progress quests',
        description: `You have ${gamificationData.activityCounts.questsInProgress} quest${gamificationData.activityCounts.questsInProgress === 1 ? '' : 's'} waiting to be completed`,
        actionText: 'Mark quests as completed',
        progress: 0,
        target: gamificationData.activityCounts.questsInProgress,
        priority: 'medium',
        estimatedActions: gamificationData.activityCounts.questsInProgress,
        motivationalMessage: `Complete your quests to earn ${gamificationData.activityCounts.questsInProgress * XPClientService.getXPValues()[XPAction.QUEST_COMPLETED]} XP!`
      });
    }

    // Suggest adding apps if user has few apps
    if (gamificationData.activityCounts.appsAdded < 3) {
      const remaining = 3 - gamificationData.activityCounts.appsAdded;
      suggestions.push({
        id: 'add-apps',
        type: 'activity',
        title: 'Add more apps to track',
        description: 'Track more apps to earn XP and unlock the App Collector badge',
        actionText: 'Add apps from different stores',
        progress: gamificationData.activityCounts.appsAdded,
        target: 3,
        priority: 'low',
        estimatedActions: remaining,
        motivationalMessage: `Add ${remaining} more app${remaining === 1 ? '' : 's'} to earn the App Collector badge!`
      });
    }

    return suggestions;
  }

  /**
   * Analyze user activity patterns
   */
  private static analyzeActivityPattern(gamificationData: GamificationData): ActivityPattern {
    const recentTransactions = gamificationData.xpHistory.slice(-10);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Count recent quests (approximate based on XP transactions)
    const recentQuestXP = recentTransactions
      .filter(t => t.timestamp >= oneWeekAgo)
      .filter(t => [XPAction.QUEST_CREATED, XPAction.QUEST_COMPLETED, XPAction.QUEST_IN_PROGRESS].includes(t.action))
      .reduce((sum, t) => sum + t.amount, 0);

    const questsPerWeek = Math.floor(recentQuestXP / XPClientService.getXPValues()[XPAction.QUEST_COMPLETED]);

    // Find most active action
    const actionCounts = recentTransactions.reduce((counts, t) => {
      counts[t.action] = (counts[t.action] || 0) + 1;
      return counts;
    }, {} as Record<XPAction, number>);

    const mostActiveAction = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] as XPAction || XPAction.QUEST_CREATED;

    // Determine trend (simplified) - only if we have enough data
    let recentActivityTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';

    if (recentTransactions.length >= 6) {
      const firstHalf = recentTransactions.slice(0, Math.floor(recentTransactions.length / 2));
      const secondHalf = recentTransactions.slice(Math.floor(recentTransactions.length / 2));
      const firstHalfXP = firstHalf.reduce((sum, t) => sum + t.amount, 0);
      const secondHalfXP = secondHalf.reduce((sum, t) => sum + t.amount, 0);

      // Only consider it decreasing if there's a significant difference and enough data
      if (firstHalfXP > 0 && secondHalfXP < firstHalfXP * 0.6) {
        recentActivityTrend = 'decreasing';
      } else if (secondHalfXP > firstHalfXP * 1.4) {
        recentActivityTrend = 'increasing';
      }
    }

    return {
      questsPerWeek,
      appsAddedRecently: gamificationData.activityCounts.appsAdded,
      streakConsistency: gamificationData.streaks.currentLoginStreak / Math.max(gamificationData.streaks.longestLoginStreak, 1),
      mostActiveAction,
      recentActivityTrend
    };
  }

  /**
   * Get the next streak milestone for bonus XP
   */
  private static getNextStreakMilestone(currentStreak: number): number | null {
    const milestones = [3, 7, 14];
    return milestones.find(milestone => milestone > currentStreak) || null;
  }

  /**
   * Get motivational messages for incomplete quests
   */
  static getMotivationalMessages(gamificationData: GamificationData): string[] {
    const messages: string[] = [];

    // Messages based on current state
    if (gamificationData.activityCounts.questsInProgress > 0) {
      messages.push(`You have ${gamificationData.activityCounts.questsInProgress} quest${gamificationData.activityCounts.questsInProgress === 1 ? '' : 's'} in progress. Complete them to earn XP!`);
    }

    if (gamificationData.streaks.currentLoginStreak > 0) {
      const nextMilestone = this.getNextStreakMilestone(gamificationData.streaks.currentLoginStreak);
      if (nextMilestone) {
        const remaining = nextMilestone - gamificationData.streaks.currentLoginStreak;
        messages.push(`Keep your ${gamificationData.streaks.currentLoginStreak}-day streak going! ${remaining} more day${remaining === 1 ? '' : 's'} for bonus XP.`);
      }
    }

    // Level-up motivation
    const xpForNextLevel = XPClientService.getXPForNextLevel(gamificationData.xp);
    if (xpForNextLevel > 0 && xpForNextLevel <= 50) {
      messages.push(`You're only ${xpForNextLevel} XP away from Level ${gamificationData.level + 1}!`);
    }

    return messages;
  }

  /**
   * Get smart suggestions based on user activity patterns
   */
  static getSmartSuggestions(gamificationData: GamificationData): ProgressSuggestion[] {
    const activityPattern = this.analyzeActivityPattern(gamificationData);
    const suggestions: ProgressSuggestion[] = [];

    // Suggest based on activity trend
    if (activityPattern.recentActivityTrend === 'decreasing') {
      suggestions.push({
        id: 'activity-boost',
        type: 'activity',
        title: 'Boost your activity',
        description: 'Your recent activity has decreased. Get back on track!',
        actionText: 'Create or complete a quest',
        progress: 0,
        target: 1,
        priority: 'medium',
        motivationalMessage: 'Every small step counts towards your goals!'
      });
    }

    // Suggest based on most active action
    if (activityPattern.mostActiveAction === XPAction.QUEST_CREATED &&
      gamificationData.activityCounts.questsInProgress > gamificationData.activityCounts.questsCompleted) {
      suggestions.push({
        id: 'complete-focus',
        type: 'activity',
        title: 'Focus on completing quests',
        description: 'You create lots of quests but could complete more',
        actionText: 'Complete your existing quests',
        progress: gamificationData.activityCounts.questsCompleted,
        target: gamificationData.activityCounts.questsCreated,
        priority: 'medium',
        motivationalMessage: 'Completing quests gives more XP than creating them!'
      });
    }

    return suggestions;
  }
}
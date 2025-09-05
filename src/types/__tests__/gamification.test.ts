/**
 * Test file to verify gamification types are properly defined and exportable
 */

import {
  XPAction,
  BadgeCategory,
  XPTransaction,
  Badge,
  BadgeDefinition,
  BadgeRequirement,
  BadgeProgress,
  GamificationData,
  XPAwardResult
} from '../gamification';

describe('Gamification Types', () => {
  describe('Enums', () => {
    it('should define XPAction enum with all required values', () => {
      expect(XPAction.QUEST_CREATED).toBe('QUEST_CREATED');
      expect(XPAction.QUEST_IN_PROGRESS).toBe('QUEST_IN_PROGRESS');
      expect(XPAction.QUEST_COMPLETED).toBe('QUEST_COMPLETED');
      expect(XPAction.APP_ADDED).toBe('APP_ADDED');
      expect(XPAction.REVIEW_INTERACTION).toBe('REVIEW_INTERACTION');
      expect(XPAction.LOGIN_STREAK_BONUS).toBe('LOGIN_STREAK_BONUS');
    });

    it('should define BadgeCategory enum with all required values', () => {
      expect(BadgeCategory.MILESTONE).toBe('MILESTONE');
      expect(BadgeCategory.ACHIEVEMENT).toBe('ACHIEVEMENT');
      expect(BadgeCategory.STREAK).toBe('STREAK');
      expect(BadgeCategory.COLLECTION).toBe('COLLECTION');
    });
  });

  describe('Interfaces', () => {
    it('should allow creating valid XPTransaction objects', () => {
      const transaction: XPTransaction = {
        amount: 10,
        action: XPAction.QUEST_CREATED,
        timestamp: new Date(),
        metadata: { questId: '123' }
      };

      expect(transaction.amount).toBe(10);
      expect(transaction.action).toBe(XPAction.QUEST_CREATED);
      expect(transaction.timestamp).toBeInstanceOf(Date);
      expect(transaction.metadata?.questId).toBe('123');
    });

    it('should allow creating valid Badge objects', () => {
      const badge: Badge = {
        id: 'getting-started',
        name: 'Getting Started',
        description: 'Earned your first 100 XP',
        earnedAt: new Date(),
        category: BadgeCategory.MILESTONE
      };

      expect(badge.id).toBe('getting-started');
      expect(badge.category).toBe(BadgeCategory.MILESTONE);
    });

    it('should allow creating valid BadgeDefinition objects', () => {
      const badgeDefinition: BadgeDefinition = {
        id: 'quest-warrior',
        name: 'Quest Warrior',
        description: 'Completed 10 quests',
        category: BadgeCategory.ACHIEVEMENT,
        requirements: [
          { type: 'activity_count', value: 10, field: 'questsCompleted' }
        ]
      };

      expect(badgeDefinition.requirements).toHaveLength(1);
      expect(badgeDefinition.requirements[0].type).toBe('activity_count');
    });

    it('should allow creating valid GamificationData objects', () => {
      const gamificationData: GamificationData = {
        xp: 150,
        level: 2,
        badges: [],
        streaks: {
          currentLoginStreak: 3,
          longestLoginStreak: 7,
          lastLoginDate: new Date()
        },
        activityCounts: {
          questsCreated: 5,
          questsCompleted: 3,
          questsInProgress: 2,
          appsAdded: 1,
          reviewInteractions: 8
        },
        xpHistory: []
      };

      expect(gamificationData.xp).toBe(150);
      expect(gamificationData.level).toBe(2);
      expect(gamificationData.streaks.currentLoginStreak).toBe(3);
    });

    it('should allow creating valid XPAwardResult objects', () => {
      const result: XPAwardResult = {
        xpAwarded: 15,
        totalXP: 165,
        levelUp: true,
        newLevel: 3,
        badgesEarned: []
      };

      expect(result.xpAwarded).toBe(15);
      expect(result.levelUp).toBe(true);
      expect(result.newLevel).toBe(3);
    });
  });
});
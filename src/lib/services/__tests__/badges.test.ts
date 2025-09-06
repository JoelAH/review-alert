/**
 * Badge Service Unit Tests
 * Tests badge requirement evaluation, progress calculation, and badge awarding logic
 */

import { BadgeService, BADGE_DEFINITIONS } from '../badges';
import { 
  GamificationData, 
  BadgeCategory, 
  BadgeDefinition,
  BadgeProgress 
} from '@/types/gamification';

describe('BadgeService', () => {
  // Mock gamification data for testing
  const createMockGamificationData = (overrides: Partial<GamificationData> = {}): GamificationData => ({
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
    ...overrides,
  });

  describe('BADGE_DEFINITIONS', () => {
    it('should contain all required badges from requirements', () => {
      const expectedBadgeIds = [
        'getting-started',
        'quest-explorer', 
        'review-master',
        'platform-expert',
        'quest-warrior',
        'dedicated-user',
        'app-collector',
        'quest-legend'
      ];

      const actualBadgeIds = BADGE_DEFINITIONS.map(badge => badge.id);
      expect(actualBadgeIds).toEqual(expect.arrayContaining(expectedBadgeIds));
      expect(actualBadgeIds).toHaveLength(expectedBadgeIds.length);
    });

    it('should have correct XP thresholds for milestone badges', () => {
      const milestoneXPValues = {
        'getting-started': 100,
        'quest-explorer': 500,
        'review-master': 1000,
        'platform-expert': 2500,
      };

      BADGE_DEFINITIONS.forEach(badge => {
        if (badge.category === BadgeCategory.MILESTONE) {
          const expectedXP = milestoneXPValues[badge.id as keyof typeof milestoneXPValues];
          expect(badge.requirements[0].value).toBe(expectedXP);
          expect(badge.requirements[0].type).toBe('xp');
        }
      });
    });

    it('should have correct activity count requirements', () => {
      const questWarrior = BADGE_DEFINITIONS.find(b => b.id === 'quest-warrior');
      expect(questWarrior?.requirements[0]).toEqual({
        type: 'activity_count',
        value: 10,
        field: 'questsCompleted'
      });

      const appCollector = BADGE_DEFINITIONS.find(b => b.id === 'app-collector');
      expect(appCollector?.requirements[0]).toEqual({
        type: 'activity_count',
        value: 3,
        field: 'appsAdded'
      });

      const questLegend = BADGE_DEFINITIONS.find(b => b.id === 'quest-legend');
      expect(questLegend?.requirements[0]).toEqual({
        type: 'activity_count',
        value: 50,
        field: 'questsCompleted'
      });
    });

    it('should have correct streak requirement', () => {
      const dedicatedUser = BADGE_DEFINITIONS.find(b => b.id === 'dedicated-user');
      expect(dedicatedUser?.requirements[0]).toEqual({
        type: 'streak',
        value: 7
      });
    });
  });

  describe('getBadgeDefinitions', () => {
    it('should return all badge definitions', () => {
      const definitions = BadgeService.getBadgeDefinitions();
      expect(definitions).toHaveLength(BADGE_DEFINITIONS.length);
      expect(definitions).toEqual(BADGE_DEFINITIONS);
    });

    it('should return a copy of the definitions array', () => {
      const definitions = BadgeService.getBadgeDefinitions();
      expect(definitions).not.toBe(BADGE_DEFINITIONS);
    });
  });

  describe('getUserBadges', () => {
    it('should return user earned badges', () => {
      const mockBadges = [
        {
          id: 'getting-started',
          name: 'Getting Started',
          description: 'Earned your first 100 XP',
          earnedAt: new Date(),
          category: BadgeCategory.MILESTONE
        }
      ];

      const gamificationData = createMockGamificationData({
        badges: mockBadges
      });

      const userBadges = BadgeService.getUserBadges(gamificationData);
      expect(userBadges).toEqual(mockBadges);
      expect(userBadges).not.toBe(mockBadges); // Should be a copy
    });

    it('should return empty array for user with no badges', () => {
      const gamificationData = createMockGamificationData();
      const userBadges = BadgeService.getUserBadges(gamificationData);
      expect(userBadges).toEqual([]);
    });
  });

  describe('checkAndAwardBadges', () => {
    it('should award Getting Started badge when user reaches 100 XP', async () => {
      const gamificationData = createMockGamificationData({
        xp: 100
      });

      const newBadges = await BadgeService.checkAndAwardBadges('user123', gamificationData);
      
      expect(newBadges).toHaveLength(1);
      expect(newBadges[0].id).toBe('getting-started');
      expect(newBadges[0].name).toBe('Getting Started');
      expect(newBadges[0].category).toBe(BadgeCategory.MILESTONE);
      expect(newBadges[0].earnedAt).toBeInstanceOf(Date);
    });

    it('should award multiple badges when multiple requirements are met', async () => {
      const gamificationData = createMockGamificationData({
        xp: 500,
        activityCounts: {
          questsCreated: 0,
          questsCompleted: 10,
          questsInProgress: 0,
          appsAdded: 3,
          reviewInteractions: 0,
        }
      });

      const newBadges = await BadgeService.checkAndAwardBadges('user123', gamificationData);
      
      const badgeIds = newBadges.map(badge => badge.id);
      expect(badgeIds).toContain('getting-started'); // 100 XP
      expect(badgeIds).toContain('quest-explorer'); // 500 XP
      expect(badgeIds).toContain('quest-warrior'); // 10 quests completed
      expect(badgeIds).toContain('app-collector'); // 3 apps added
      expect(newBadges).toHaveLength(4);
    });

    it('should not award already earned badges', async () => {
      const existingBadge = {
        id: 'getting-started',
        name: 'Getting Started',
        description: 'Earned your first 100 XP',
        earnedAt: new Date(),
        category: BadgeCategory.MILESTONE
      };

      const gamificationData = createMockGamificationData({
        xp: 500,
        badges: [existingBadge]
      });

      const newBadges = await BadgeService.checkAndAwardBadges('user123', gamificationData);
      
      const badgeIds = newBadges.map(badge => badge.id);
      expect(badgeIds).not.toContain('getting-started');
      expect(badgeIds).toContain('quest-explorer'); // Should still award this one
    });

    it('should award streak badge when login streak requirement is met', async () => {
      const gamificationData = createMockGamificationData({
        streaks: {
          currentLoginStreak: 5,
          longestLoginStreak: 7,
        }
      });

      const newBadges = await BadgeService.checkAndAwardBadges('user123', gamificationData);
      
      const badgeIds = newBadges.map(badge => badge.id);
      expect(badgeIds).toContain('dedicated-user');
    });

    it('should return empty array when no new badges are earned', async () => {
      const gamificationData = createMockGamificationData({
        xp: 50 // Below any badge threshold
      });

      const newBadges = await BadgeService.checkAndAwardBadges('user123', gamificationData);
      expect(newBadges).toEqual([]);
    });
  });

  describe('getBadgeProgress', () => {
    it('should calculate correct progress for XP-based badges', () => {
      const gamificationData = createMockGamificationData({
        xp: 250
      });

      const progress = BadgeService.getBadgeProgress(gamificationData);
      
      const gettingStartedProgress = progress.find(p => p.badge.id === 'getting-started');
      expect(gettingStartedProgress).toEqual({
        badge: expect.objectContaining({ id: 'getting-started' }),
        progress: 100, // Capped at target
        target: 100,
        earned: false
      });

      const questExplorerProgress = progress.find(p => p.badge.id === 'quest-explorer');
      expect(questExplorerProgress).toEqual({
        badge: expect.objectContaining({ id: 'quest-explorer' }),
        progress: 250,
        target: 500,
        earned: false
      });
    });

    it('should calculate correct progress for activity count badges', () => {
      const gamificationData = createMockGamificationData({
        activityCounts: {
          questsCreated: 0,
          questsCompleted: 7,
          questsInProgress: 0,
          appsAdded: 2,
          reviewInteractions: 0,
        }
      });

      const progress = BadgeService.getBadgeProgress(gamificationData);
      
      const questWarriorProgress = progress.find(p => p.badge.id === 'quest-warrior');
      expect(questWarriorProgress).toEqual({
        badge: expect.objectContaining({ id: 'quest-warrior' }),
        progress: 7,
        target: 10,
        earned: false
      });

      const appCollectorProgress = progress.find(p => p.badge.id === 'app-collector');
      expect(appCollectorProgress).toEqual({
        badge: expect.objectContaining({ id: 'app-collector' }),
        progress: 2,
        target: 3,
        earned: false
      });
    });

    it('should calculate correct progress for streak badges', () => {
      const gamificationData = createMockGamificationData({
        streaks: {
          currentLoginStreak: 3,
          longestLoginStreak: 5,
        }
      });

      const progress = BadgeService.getBadgeProgress(gamificationData);
      
      const dedicatedUserProgress = progress.find(p => p.badge.id === 'dedicated-user');
      expect(dedicatedUserProgress).toEqual({
        badge: expect.objectContaining({ id: 'dedicated-user' }),
        progress: 5,
        target: 7,
        earned: false
      });
    });

    it('should mark badges as earned when user has them', () => {
      const earnedBadge = {
        id: 'getting-started',
        name: 'Getting Started',
        description: 'Earned your first 100 XP',
        earnedAt: new Date(),
        category: BadgeCategory.MILESTONE
      };

      const gamificationData = createMockGamificationData({
        xp: 150,
        badges: [earnedBadge]
      });

      const progress = BadgeService.getBadgeProgress(gamificationData);
      
      const gettingStartedProgress = progress.find(p => p.badge.id === 'getting-started');
      expect(gettingStartedProgress?.earned).toBe(true);
    });

    it('should return progress for all badge definitions', () => {
      const gamificationData = createMockGamificationData();
      const progress = BadgeService.getBadgeProgress(gamificationData);
      
      expect(progress).toHaveLength(BADGE_DEFINITIONS.length);
      
      const progressBadgeIds = progress.map(p => p.badge.id);
      const definitionIds = BADGE_DEFINITIONS.map(d => d.id);
      expect(progressBadgeIds).toEqual(expect.arrayContaining(definitionIds));
    });
  });

  describe('getBadgeDefinitionById', () => {
    it('should return badge definition for valid ID', () => {
      const badge = BadgeService.getBadgeDefinitionById('getting-started');
      expect(badge).toBeDefined();
      expect(badge?.id).toBe('getting-started');
      expect(badge?.name).toBe('Getting Started');
    });

    it('should return undefined for invalid ID', () => {
      const badge = BadgeService.getBadgeDefinitionById('non-existent-badge');
      expect(badge).toBeUndefined();
    });
  });

  describe('getBadgesByCategory', () => {
    it('should return badges filtered by category', () => {
      const milestoneBadges = BadgeService.getBadgesByCategory(BadgeCategory.MILESTONE);
      expect(milestoneBadges).toHaveLength(4); // getting-started, quest-explorer, review-master, platform-expert
      
      milestoneBadges.forEach(badge => {
        expect(badge.category).toBe(BadgeCategory.MILESTONE);
      });

      const achievementBadges = BadgeService.getBadgesByCategory(BadgeCategory.ACHIEVEMENT);
      expect(achievementBadges).toHaveLength(2); // quest-warrior, quest-legend
      
      const streakBadges = BadgeService.getBadgesByCategory(BadgeCategory.STREAK);
      expect(streakBadges).toHaveLength(1); // dedicated-user
      
      const collectionBadges = BadgeService.getBadgesByCategory(BadgeCategory.COLLECTION);
      expect(collectionBadges).toHaveLength(1); // app-collector
    });

    it('should return empty array for category with no badges', () => {
      // Create a new category that doesn't exist in our definitions
      const nonExistentCategory = 'NON_EXISTENT' as BadgeCategory;
      const badges = BadgeService.getBadgesByCategory(nonExistentCategory);
      expect(badges).toEqual([]);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid activity count requirements gracefully', () => {
      // Test the progress calculation with missing field
      const gamificationData = createMockGamificationData({
        activityCounts: {
          questsCreated: 15,
          questsCompleted: 15,
          questsInProgress: 15,
          appsAdded: 15,
          reviewInteractions: 15,
        }
      });

      // This should not throw an error even if there were invalid requirements
      const progress = BadgeService.getBadgeProgress(gamificationData);
      expect(progress).toBeDefined();
      expect(Array.isArray(progress)).toBe(true);
    });

    it('should handle unknown requirement types gracefully', async () => {
      // This test ensures the service handles unknown requirement types without crashing
      const gamificationData = createMockGamificationData({
        xp: 1000
      });

      // Should not throw error
      await expect(BadgeService.checkAndAwardBadges('user123', gamificationData))
        .resolves.toBeDefined();
    });
  });
});
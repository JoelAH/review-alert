/**
 * Progress Indicators Service Unit Tests
 * Tests progress suggestion logic, activity pattern analysis, and motivational messaging
 */

import { ProgressIndicatorsService } from '../progressIndicators';
import { 
  GamificationData, 
  XPAction, 
  BadgeCategory,
  Badge,
  XPTransaction 
} from '@/types/gamification';

// Mock the dependencies
jest.mock('../badges');
jest.mock('../xp');

// Import mocked modules
import { BadgeService } from '../badges';
import { XPService } from '../xp';

const MockedBadgeService = BadgeService as jest.Mocked<typeof BadgeService>;
const MockedXPService = XPService as jest.Mocked<typeof XPService>;

describe('ProgressIndicatorsService', () => {
  // Helper function to create mock gamification data
  const createMockGamificationData = (overrides: Partial<GamificationData> = {}): GamificationData => ({
    xp: 450,
    level: 3,
    badges: [],
    streaks: {
      currentLoginStreak: 2,
      longestLoginStreak: 5,
      lastLoginDate: new Date('2024-01-15'),
    },
    activityCounts: {
      questsCreated: 8,
      questsCompleted: 5,
      questsInProgress: 3,
      appsAdded: 2,
      reviewInteractions: 10,
    },
    xpHistory: [
      {
        amount: 15,
        action: XPAction.QUEST_COMPLETED,
        timestamp: new Date('2024-01-15T10:00:00Z'),
      },
      {
        amount: 10,
        action: XPAction.QUEST_CREATED,
        timestamp: new Date('2024-01-14T15:30:00Z'),
      },
    ],
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    MockedBadgeService.getBadgeProgress.mockReturnValue([
      {
        badge: {
          id: 'quest-explorer',
          name: 'Quest Explorer',
          description: 'Reached 500 XP',
          category: BadgeCategory.MILESTONE,
          requirements: [{ type: 'xp', value: 500 }],
        },
        progress: 450,
        target: 500,
        earned: false,
      },
      {
        badge: {
          id: 'quest-warrior',
          name: 'Quest Warrior',
          description: 'Completed 10 quests',
          category: BadgeCategory.ACHIEVEMENT,
          requirements: [{ type: 'activity_count', value: 10, field: 'questsCompleted' }],
        },
        progress: 5,
        target: 10,
        earned: false,
      },
    ]);

    MockedXPService.getXPForNextLevel.mockReturnValue(50);
    MockedXPService.getLevelThresholds.mockReturnValue([0, 100, 250, 500, 1000]);
    MockedXPService.getXPValues.mockReturnValue({
      [XPAction.QUEST_CREATED]: 10,
      [XPAction.QUEST_IN_PROGRESS]: 5,
      [XPAction.QUEST_COMPLETED]: 15,
      [XPAction.APP_ADDED]: 20,
      [XPAction.REVIEW_INTERACTION]: 8,
      [XPAction.LOGIN_STREAK_BONUS]: 0,
    });
  });

  describe('getProgressSuggestions', () => {
    it('should return badge suggestions for badges close to completion', () => {
      const gamificationData = createMockGamificationData();
      const suggestions = ProgressIndicatorsService.getProgressSuggestions(gamificationData);

      // Should include Quest Explorer badge (90% complete)
      const questExplorerSuggestion = suggestions.find(s => s.id === 'badge-quest-explorer');
      expect(questExplorerSuggestion).toBeDefined();
      expect(questExplorerSuggestion?.type).toBe('badge');
      expect(questExplorerSuggestion?.priority).toBe('high'); // 90% complete = high priority
      expect(questExplorerSuggestion?.progress).toBe(450);
      expect(questExplorerSuggestion?.target).toBe(500);
      expect(questExplorerSuggestion?.motivationalMessage).toContain('50 XP away');
    });

    it('should return level suggestions when close to leveling up', () => {
      const gamificationData = createMockGamificationData({ xp: 480 }); // Close to level 4
      MockedXPService.getXPForNextLevel.mockReturnValue(20);
      
      const suggestions = ProgressIndicatorsService.getProgressSuggestions(gamificationData);

      const levelSuggestion = suggestions.find(s => s.type === 'level');
      expect(levelSuggestion).toBeDefined();
      expect(levelSuggestion?.title).toContain('Level 4');
      expect(levelSuggestion?.priority).toBe('high'); // Very close to leveling up
      expect(levelSuggestion?.motivationalMessage).toContain('20 XP away');
    });

    it('should return streak suggestions for maintaining streaks', () => {
      const gamificationData = createMockGamificationData({
        streaks: {
          currentLoginStreak: 5,
          longestLoginStreak: 5,
          lastLoginDate: new Date(),
        },
      });

      const suggestions = ProgressIndicatorsService.getProgressSuggestions(gamificationData);

      const streakSuggestion = suggestions.find(s => s.type === 'streak');
      expect(streakSuggestion).toBeDefined();
      expect(streakSuggestion?.progress).toBe(5);
      expect(streakSuggestion?.target).toBe(7); // Next milestone
      expect(streakSuggestion?.actionText).toContain('Keep logging in daily');
    });

    it('should return activity suggestions for incomplete quests', () => {
      const gamificationData = createMockGamificationData({
        activityCounts: {
          questsCreated: 10,
          questsCompleted: 3,
          questsInProgress: 7,
          appsAdded: 2,
          reviewInteractions: 5,
        },
      });

      const suggestions = ProgressIndicatorsService.getProgressSuggestions(gamificationData);

      const questSuggestion = suggestions.find(s => s.id === 'complete-quests');
      expect(questSuggestion).toBeDefined();
      expect(questSuggestion?.type).toBe('activity');
      expect(questSuggestion?.target).toBe(7);
      expect(questSuggestion?.actionText).toContain('Mark quests as completed');
    });

    it('should suggest adding apps when user has few apps', () => {
      const gamificationData = createMockGamificationData({
        activityCounts: {
          questsCreated: 5,
          questsCompleted: 3,
          questsInProgress: 2,
          appsAdded: 1, // Only 1 app added
          reviewInteractions: 5,
        },
      });

      const suggestions = ProgressIndicatorsService.getProgressSuggestions(gamificationData);

      const appSuggestion = suggestions.find(s => s.id === 'add-apps');
      expect(appSuggestion).toBeDefined();
      expect(appSuggestion?.type).toBe('activity');
      expect(appSuggestion?.progress).toBe(1);
      expect(appSuggestion?.target).toBe(3);
      expect(appSuggestion?.actionText).toContain('Add apps');
    });

    it('should limit suggestions to maximum count', () => {
      // Create data that would generate many suggestions
      MockedBadgeService.getBadgeProgress.mockReturnValue([
        ...Array(10).fill(null).map((_, i) => ({
          badge: {
            id: `badge-${i}`,
            name: `Badge ${i}`,
            description: `Description ${i}`,
            category: BadgeCategory.MILESTONE,
            requirements: [{ type: 'xp', value: 100 }],
          },
          progress: 80, // 80% complete
          target: 100,
          earned: false,
        })),
      ]);

      const gamificationData = createMockGamificationData();
      const suggestions = ProgressIndicatorsService.getProgressSuggestions(gamificationData);

      expect(suggestions.length).toBeLessThanOrEqual(5); // MAX_SUGGESTIONS = 5
    });

    it('should prioritize suggestions correctly', () => {
      MockedBadgeService.getBadgeProgress.mockReturnValue([
        {
          badge: {
            id: 'high-priority',
            name: 'High Priority Badge',
            description: 'Almost complete',
            category: BadgeCategory.MILESTONE,
            requirements: [{ type: 'xp', value: 100 }],
          },
          progress: 95, // 95% complete = high priority
          target: 100,
          earned: false,
        },
        {
          badge: {
            id: 'medium-priority',
            name: 'Medium Priority Badge',
            description: 'Somewhat complete',
            category: BadgeCategory.MILESTONE,
            requirements: [{ type: 'xp', value: 100 }],
          },
          progress: 75, // 75% complete = medium priority
          target: 100,
          earned: false,
        },
      ]);

      const gamificationData = createMockGamificationData();
      const suggestions = ProgressIndicatorsService.getProgressSuggestions(gamificationData);

      // High priority should come first
      expect(suggestions[0]?.priority).toBe('high');
      expect(suggestions[0]?.id).toBe('badge-high-priority');
    });

    it('should not suggest earned badges', () => {
      MockedBadgeService.getBadgeProgress.mockReturnValue([
        {
          badge: {
            id: 'earned-badge',
            name: 'Earned Badge',
            description: 'Already earned',
            category: BadgeCategory.MILESTONE,
            requirements: [{ type: 'xp', value: 100 }],
          },
          progress: 100,
          target: 100,
          earned: true, // Already earned
        },
      ]);

      const gamificationData = createMockGamificationData();
      const suggestions = ProgressIndicatorsService.getProgressSuggestions(gamificationData);

      const earnedBadgeSuggestion = suggestions.find(s => s.id === 'badge-earned-badge');
      expect(earnedBadgeSuggestion).toBeUndefined();
    });
  });

  describe('getMotivationalMessages', () => {
    it('should return messages for quests in progress', () => {
      const gamificationData = createMockGamificationData({
        activityCounts: {
          questsCreated: 5,
          questsCompleted: 2,
          questsInProgress: 3,
          appsAdded: 2,
          reviewInteractions: 5,
        },
      });

      const messages = ProgressIndicatorsService.getMotivationalMessages(gamificationData);

      expect(messages).toContain('You have 3 quests in progress. Complete them to earn XP!');
    });

    it('should return streak motivation messages', () => {
      const gamificationData = createMockGamificationData({
        streaks: {
          currentLoginStreak: 5,
          longestLoginStreak: 5,
          lastLoginDate: new Date(),
        },
      });

      const messages = ProgressIndicatorsService.getMotivationalMessages(gamificationData);

      const streakMessage = messages.find(m => m.includes('5-day streak'));
      expect(streakMessage).toBeDefined();
      expect(streakMessage).toContain('2 more days for bonus XP');
    });

    it('should return level-up motivation when close to next level', () => {
      MockedXPService.getXPForNextLevel.mockReturnValue(25);
      
      const gamificationData = createMockGamificationData({ level: 3 });
      const messages = ProgressIndicatorsService.getMotivationalMessages(gamificationData);

      const levelMessage = messages.find(m => m.includes('25 XP away from Level 4'));
      expect(levelMessage).toBeDefined();
    });

    it('should return empty array when no motivational conditions are met', () => {
      MockedXPService.getXPForNextLevel.mockReturnValue(200); // Far from next level
      
      const gamificationData = createMockGamificationData({
        activityCounts: {
          questsCreated: 5,
          questsCompleted: 5,
          questsInProgress: 0, // No quests in progress
          appsAdded: 3,
          reviewInteractions: 10,
        },
        streaks: {
          currentLoginStreak: 0, // No current streak
          longestLoginStreak: 3,
          lastLoginDate: new Date(),
        },
      });

      const messages = ProgressIndicatorsService.getMotivationalMessages(gamificationData);

      expect(messages).toHaveLength(0);
    });
  });

  describe('getSmartSuggestions', () => {
    it('should suggest activity boost when trend is decreasing', () => {
      // Create XP history showing decreasing trend
      const decreasingXPHistory: XPTransaction[] = [
        // Earlier transactions (higher activity)
        { amount: 15, action: XPAction.QUEST_COMPLETED, timestamp: new Date('2024-01-10') },
        { amount: 15, action: XPAction.QUEST_COMPLETED, timestamp: new Date('2024-01-11') },
        { amount: 10, action: XPAction.QUEST_CREATED, timestamp: new Date('2024-01-12') },
        { amount: 15, action: XPAction.QUEST_COMPLETED, timestamp: new Date('2024-01-13') },
        { amount: 20, action: XPAction.APP_ADDED, timestamp: new Date('2024-01-14') },
        // Recent transactions (lower activity)
        { amount: 5, action: XPAction.QUEST_IN_PROGRESS, timestamp: new Date('2024-01-15') },
        { amount: 5, action: XPAction.QUEST_IN_PROGRESS, timestamp: new Date('2024-01-16') },
        { amount: 8, action: XPAction.REVIEW_INTERACTION, timestamp: new Date('2024-01-17') },
        { amount: 5, action: XPAction.QUEST_IN_PROGRESS, timestamp: new Date('2024-01-18') },
        { amount: 8, action: XPAction.REVIEW_INTERACTION, timestamp: new Date('2024-01-19') },
      ];

      const gamificationData = createMockGamificationData({
        xpHistory: decreasingXPHistory,
      });

      const suggestions = ProgressIndicatorsService.getSmartSuggestions(gamificationData);

      const activityBoostSuggestion = suggestions.find(s => s.id === 'activity-boost');
      expect(activityBoostSuggestion).toBeDefined();
      expect(activityBoostSuggestion?.title).toContain('Boost your activity');
      expect(activityBoostSuggestion?.priority).toBe('medium');
    });

    it('should suggest completing quests when user creates more than completes', () => {
      const gamificationData = createMockGamificationData({
        activityCounts: {
          questsCreated: 10,
          questsCompleted: 3, // Much fewer completed than created
          questsInProgress: 7,
          appsAdded: 2,
          reviewInteractions: 5,
        },
        xpHistory: [
          // Most recent activity is quest creation
          { amount: 10, action: XPAction.QUEST_CREATED, timestamp: new Date() },
          { amount: 10, action: XPAction.QUEST_CREATED, timestamp: new Date() },
          { amount: 10, action: XPAction.QUEST_CREATED, timestamp: new Date() },
        ],
      });

      const suggestions = ProgressIndicatorsService.getSmartSuggestions(gamificationData);

      const completeFocusSuggestion = suggestions.find(s => s.id === 'complete-focus');
      expect(completeFocusSuggestion).toBeDefined();
      expect(completeFocusSuggestion?.title).toContain('Focus on completing quests');
      expect(completeFocusSuggestion?.progress).toBe(3);
      expect(completeFocusSuggestion?.target).toBe(10);
    });

    it('should return empty array when no smart suggestions apply', () => {
      const gamificationData = createMockGamificationData({
        activityCounts: {
          questsCreated: 5,
          questsCompleted: 5, // Balanced creation and completion
          questsInProgress: 0,
          appsAdded: 3,
          reviewInteractions: 10,
        },
        xpHistory: [
          // Stable activity pattern
          { amount: 15, action: XPAction.QUEST_COMPLETED, timestamp: new Date() },
          { amount: 15, action: XPAction.QUEST_COMPLETED, timestamp: new Date() },
          { amount: 15, action: XPAction.QUEST_COMPLETED, timestamp: new Date() },
        ],
      });

      const suggestions = ProgressIndicatorsService.getSmartSuggestions(gamificationData);

      expect(suggestions).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty gamification data gracefully', () => {
      const emptyData = createMockGamificationData({
        xp: 0,
        level: 1,
        badges: [],
        activityCounts: {
          questsCreated: 0,
          questsCompleted: 0,
          questsInProgress: 0,
          appsAdded: 0,
          reviewInteractions: 0,
        },
        xpHistory: [],
      });

      MockedBadgeService.getBadgeProgress.mockReturnValue([]);
      MockedXPService.getXPForNextLevel.mockReturnValue(100);

      const suggestions = ProgressIndicatorsService.getProgressSuggestions(emptyData);
      const messages = ProgressIndicatorsService.getMotivationalMessages(emptyData);
      const smartSuggestions = ProgressIndicatorsService.getSmartSuggestions(emptyData);

      expect(suggestions).toBeDefined();
      expect(messages).toBeDefined();
      expect(smartSuggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(Array.isArray(messages)).toBe(true);
      expect(Array.isArray(smartSuggestions)).toBe(true);
    });

    it('should handle max level users correctly', () => {
      MockedXPService.getXPForNextLevel.mockReturnValue(0); // Max level
      
      const maxLevelData = createMockGamificationData({
        xp: 10000,
        level: 11, // Max level
      });

      const suggestions = ProgressIndicatorsService.getProgressSuggestions(maxLevelData);

      // Should not include level suggestions for max level users
      const levelSuggestion = suggestions.find(s => s.type === 'level');
      expect(levelSuggestion).toBeUndefined();
    });
  });
});
import { GamificationClientService } from '../gamificationClient';
import { NotificationService } from '../notifications';
import { XPAction, XPAwardResult, Badge, BadgeCategory } from '@/types/gamification';

// Mock the notification service
jest.mock('../notifications', () => ({
  NotificationService: {
    xpAwardResult: jest.fn(),
    streakMilestone: jest.fn(),
    levelUp: jest.fn(),
    badgeEarned: jest.fn(),
    batchedXPGained: jest.fn(),
    xpGained: jest.fn(),
    setPreferences: jest.fn(),
    getPreferences: jest.fn(() => ({
      xpNotifications: true,
      badgeNotifications: true,
      levelUpNotifications: true,
      streakNotifications: true,
      batchNotifications: true,
    })),
    addToBatch: jest.fn(),
    dismissAll: jest.fn(),
  },
}));

describe('GamificationClientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockBadge: Badge = {
    id: 'test-badge',
    name: 'Test Badge',
    description: 'A test badge',
    earnedAt: new Date(),
    category: BadgeCategory.MILESTONE,
  };

  describe('handleXPAwardResult', () => {
    it('should call NotificationService.xpAwardResult with correct parameters', () => {
      const result: XPAwardResult = {
        xpAwarded: 10,
        totalXP: 110,
        levelUp: false,
        badgesEarned: [],
      };

      GamificationClientService.handleXPAwardResult(result, XPAction.QUEST_CREATED);

      expect(NotificationService.xpAwardResult).toHaveBeenCalledWith(result, XPAction.QUEST_CREATED);
    });

    it('should not show notifications when showNotifications is false', () => {
      const result: XPAwardResult = {
        xpAwarded: 10,
        totalXP: 110,
        levelUp: false,
        badgesEarned: [],
      };

      GamificationClientService.handleXPAwardResult(result, XPAction.QUEST_CREATED, {
        showNotifications: false,
      });

      expect(NotificationService.xpAwardResult).not.toHaveBeenCalled();
    });

    it('should show streak milestone notification for LOGIN_STREAK_BONUS action', () => {
      const result: XPAwardResult = {
        xpAwarded: 10,
        totalXP: 110,
        levelUp: false,
        badgesEarned: [],
      };

      GamificationClientService.handleXPAwardResult(result, XPAction.LOGIN_STREAK_BONUS);

      expect(NotificationService.xpAwardResult).toHaveBeenCalledWith(result, XPAction.LOGIN_STREAK_BONUS);
      expect(NotificationService.streakMilestone).toHaveBeenCalledWith(7, 10);
    });

    it('should calculate correct streak days for different XP amounts', () => {
      // Test 15 XP (14-day streak)
      let result: XPAwardResult = {
        xpAwarded: 15,
        totalXP: 115,
        levelUp: false,
        badgesEarned: [],
      };

      GamificationClientService.handleXPAwardResult(result, XPAction.LOGIN_STREAK_BONUS);
      expect(NotificationService.streakMilestone).toHaveBeenCalledWith(14, 15);

      jest.clearAllMocks();

      // Test 5 XP (3-day streak)
      result = {
        xpAwarded: 5,
        totalXP: 105,
        levelUp: false,
        badgesEarned: [],
      };

      GamificationClientService.handleXPAwardResult(result, XPAction.LOGIN_STREAK_BONUS);
      expect(NotificationService.streakMilestone).toHaveBeenCalledWith(3, 5);
    });
  });

  describe('handleMultipleXPAwardResults', () => {
    it('should handle multiple results with level ups and badges', () => {
      const results = [
        {
          result: {
            xpAwarded: 10,
            totalXP: 110,
            levelUp: true,
            newLevel: 3,
            badgesEarned: [mockBadge],
          },
          action: XPAction.QUEST_CREATED,
        },
        {
          result: {
            xpAwarded: 15,
            totalXP: 125,
            levelUp: false,
            badgesEarned: [],
          },
          action: XPAction.QUEST_COMPLETED,
        },
      ];

      GamificationClientService.handleMultipleXPAwardResults(results);

      expect(NotificationService.levelUp).toHaveBeenCalledWith(3);
      expect(NotificationService.badgeEarned).toHaveBeenCalledWith(mockBadge);
      expect(NotificationService.batchedXPGained).toHaveBeenCalledWith(25, [
        { action: XPAction.QUEST_CREATED, amount: 10 },
        { action: XPAction.QUEST_COMPLETED, amount: 15 },
      ]);
    });

    it('should handle single result without batching', () => {
      const results = [
        {
          result: {
            xpAwarded: 10,
            totalXP: 110,
            levelUp: false,
            badgesEarned: [],
          },
          action: XPAction.QUEST_CREATED,
        },
      ];

      GamificationClientService.handleMultipleXPAwardResults(results);

      expect(NotificationService.xpGained).toHaveBeenCalledWith(10, XPAction.QUEST_CREATED);
      expect(NotificationService.batchedXPGained).not.toHaveBeenCalled();
    });

    it('should not show notifications when showNotifications is false', () => {
      const results = [
        {
          result: {
            xpAwarded: 10,
            totalXP: 110,
            levelUp: false,
            badgesEarned: [],
          },
          action: XPAction.QUEST_CREATED,
        },
      ];

      GamificationClientService.handleMultipleXPAwardResults(results, { showNotifications: false });

      expect(NotificationService.xpGained).not.toHaveBeenCalled();
      expect(NotificationService.levelUp).not.toHaveBeenCalled();
      expect(NotificationService.badgeEarned).not.toHaveBeenCalled();
    });

    it('should handle empty results array', () => {
      GamificationClientService.handleMultipleXPAwardResults([]);

      expect(NotificationService.xpGained).not.toHaveBeenCalled();
      expect(NotificationService.batchedXPGained).not.toHaveBeenCalled();
    });
  });

  describe('individual notification methods', () => {
    it('should call NotificationService.xpGained', () => {
      GamificationClientService.showXPGained(10, XPAction.QUEST_CREATED);
      expect(NotificationService.xpGained).toHaveBeenCalledWith(10, XPAction.QUEST_CREATED);
    });

    it('should call NotificationService.badgeEarned', () => {
      GamificationClientService.showBadgeEarned(mockBadge);
      expect(NotificationService.badgeEarned).toHaveBeenCalledWith(mockBadge);
    });

    it('should call NotificationService.levelUp', () => {
      GamificationClientService.showLevelUp(5);
      expect(NotificationService.levelUp).toHaveBeenCalledWith(5);
    });

    it('should call NotificationService.streakMilestone', () => {
      GamificationClientService.showStreakMilestone(7, 10);
      expect(NotificationService.streakMilestone).toHaveBeenCalledWith(7, 10);
    });
  });

  describe('preference management', () => {
    it('should set notification preferences', () => {
      const preferences = { xpNotifications: false, badgeNotifications: true };
      GamificationClientService.setNotificationPreferences(preferences);
      expect(NotificationService.setPreferences).toHaveBeenCalledWith(preferences);
    });

    it('should get notification preferences', () => {
      const result = GamificationClientService.getNotificationPreferences();
      expect(NotificationService.getPreferences).toHaveBeenCalled();
      expect(result).toEqual({
        xpNotifications: true,
        badgeNotifications: true,
        levelUpNotifications: true,
        streakNotifications: true,
        batchNotifications: true,
      });
    });
  });

  describe('utility methods', () => {
    it('should add XP to batch', () => {
      GamificationClientService.addXPToBatch(10, XPAction.QUEST_CREATED);
      expect(NotificationService.addToBatch).toHaveBeenCalledWith(10, XPAction.QUEST_CREATED);
    });

    it('should dismiss all notifications', () => {
      GamificationClientService.dismissAllNotifications();
      expect(NotificationService.dismissAll).toHaveBeenCalled();
    });
  });

  describe('API response handling', () => {
    it('should handle API response with XP award data', () => {
      const response = {
        quest: { id: '123', title: 'Test Quest' },
        xpAwarded: {
          xpAwarded: 10,
          totalXP: 110,
          levelUp: false,
          badgesEarned: [],
        },
      };

      const result = GamificationClientService.handleAPIResponse(response, XPAction.QUEST_CREATED);

      expect(NotificationService.xpAwardResult).toHaveBeenCalledWith(
        response.xpAwarded,
        XPAction.QUEST_CREATED
      );
      expect(result).toBe(response);
    });

    it('should handle API response without XP award data', () => {
      const response = {
        quest: { id: '123', title: 'Test Quest' },
      };

      const result = GamificationClientService.handleAPIResponse(response, XPAction.QUEST_CREATED);

      expect(NotificationService.xpAwardResult).not.toHaveBeenCalled();
      expect(result).toBe(response);
    });

    it('should wrap API calls correctly', async () => {
      const mockApiCall = jest.fn().mockResolvedValue({
        quest: { id: '123', title: 'Test Quest' },
        xpAwarded: {
          xpAwarded: 10,
          totalXP: 110,
          levelUp: false,
          badgesEarned: [],
        },
      });

      const wrappedCall = GamificationClientService.wrapAPICall(mockApiCall, XPAction.QUEST_CREATED);
      const result = await wrappedCall();

      expect(mockApiCall).toHaveBeenCalled();
      expect(NotificationService.xpAwardResult).toHaveBeenCalled();
      expect(result).toEqual({
        quest: { id: '123', title: 'Test Quest' },
        xpAwarded: {
          xpAwarded: 10,
          totalXP: 110,
          levelUp: false,
          badgesEarned: [],
        },
      });
    });

    it('should handle API call errors correctly', async () => {
      const mockApiCall = jest.fn().mockRejectedValue(new Error('API Error'));

      const wrappedCall = GamificationClientService.wrapAPICall(mockApiCall, XPAction.QUEST_CREATED);

      await expect(wrappedCall()).rejects.toThrow('API Error');
      expect(NotificationService.xpAwardResult).not.toHaveBeenCalled();
    });
  });
});
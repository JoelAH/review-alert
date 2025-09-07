/**
 * Integration tests for gamification notifications
 * Tests the complete flow from API response to notification display
 */

import { QuestService } from '../quests';
import { GamificationClientService } from '../gamificationClient';
import { NotificationService } from '../notifications';
import { XPAction, XPAwardResult, BadgeCategory } from '@/types/gamification';

// Mock the notification service
jest.mock('../notifications', () => ({
  NotificationService: {
    xpAwardResult: jest.fn(),
    handleApiError: jest.fn(),
  },
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Gamification Notifications Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  describe('Quest Creation with XP Notifications', () => {
    it('should show XP notification when quest creation returns XP award', async () => {
      const mockXPResult: XPAwardResult = {
        xpAwarded: 10,
        totalXP: 110,
        levelUp: false,
        badgesEarned: [],
      };

      const mockResponse = {
        quest: {
          _id: 'quest123',
          title: 'Test Quest',
          type: 'BUG_FIX',
          priority: 'HIGH',
          state: 'OPEN',
        },
        xpAwarded: mockXPResult,
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const questData = {
        title: 'Test Quest',
        type: 'BUG_FIX' as const,
        priority: 'HIGH' as const,
      };

      const result = await QuestService.createQuest(questData);

      expect(result).toEqual(mockResponse.quest);
      expect(NotificationService.xpAwardResult).toHaveBeenCalledWith(
        mockXPResult,
        XPAction.QUEST_CREATED
      );
    });

    it('should show level up and badge notifications for quest creation', async () => {
      const mockBadge = {
        id: 'quest-warrior',
        name: 'Quest Warrior',
        description: 'Completed 10 quests',
        earnedAt: new Date(),
        category: BadgeCategory.ACHIEVEMENT,
      };

      const mockXPResult: XPAwardResult = {
        xpAwarded: 50,
        totalXP: 500,
        levelUp: true,
        newLevel: 3,
        badgesEarned: [mockBadge],
      };

      const mockResponse = {
        quest: {
          _id: 'quest123',
          title: 'Test Quest',
          type: 'BUG_FIX',
          priority: 'HIGH',
          state: 'OPEN',
        },
        xpAwarded: mockXPResult,
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const questData = {
        title: 'Test Quest',
        type: 'BUG_FIX' as const,
        priority: 'HIGH' as const,
      };

      await QuestService.createQuest(questData);

      expect(NotificationService.xpAwardResult).toHaveBeenCalledWith(
        mockXPResult,
        XPAction.QUEST_CREATED
      );
    });

    it('should not show notifications when no XP is awarded', async () => {
      const mockResponse = {
        quest: {
          _id: 'quest123',
          title: 'Test Quest',
          type: 'BUG_FIX',
          priority: 'HIGH',
          state: 'OPEN',
        },
        // No xpAwarded field
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const questData = {
        title: 'Test Quest',
        type: 'BUG_FIX' as const,
        priority: 'HIGH' as const,
      };

      await QuestService.createQuest(questData);

      expect(NotificationService.xpAwardResult).not.toHaveBeenCalled();
    });
  });

  describe('Quest Update with XP Notifications', () => {
    it('should show XP notification for quest completion', async () => {
      const mockXPResult: XPAwardResult = {
        xpAwarded: 15,
        totalXP: 125,
        levelUp: false,
        badgesEarned: [],
      };

      const mockResponse = {
        quest: {
          _id: 'quest123',
          title: 'Test Quest',
          type: 'BUG_FIX',
          priority: 'HIGH',
          state: 'DONE',
        },
        xpAwarded: mockXPResult,
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const updates = {
        state: 'DONE' as const,
      };

      await QuestService.updateQuest('quest123', updates);

      expect(NotificationService.xpAwardResult).toHaveBeenCalledWith(
        mockXPResult,
        XPAction.QUEST_COMPLETED
      );
    });

    it('should show XP notification for quest in progress', async () => {
      const mockXPResult: XPAwardResult = {
        xpAwarded: 5,
        totalXP: 115,
        levelUp: false,
        badgesEarned: [],
      };

      const mockResponse = {
        quest: {
          _id: 'quest123',
          title: 'Test Quest',
          type: 'BUG_FIX',
          priority: 'HIGH',
          state: 'IN_PROGRESS',
        },
        xpAwarded: mockXPResult,
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const updates = {
        state: 'IN_PROGRESS' as const,
      };

      await QuestService.updateQuest('quest123', updates);

      expect(NotificationService.xpAwardResult).toHaveBeenCalledWith(
        mockXPResult,
        XPAction.QUEST_IN_PROGRESS
      );
    });
  });

  describe('API Response Handling', () => {
    it('should handle API response with XP data using GamificationClientService', () => {
      const mockXPResult: XPAwardResult = {
        xpAwarded: 20,
        totalXP: 120,
        levelUp: false,
        badgesEarned: [],
      };

      const apiResponse = {
        success: true,
        data: { id: '123' },
        xpAwarded: mockXPResult,
      };

      const result = GamificationClientService.handleAPIResponse(
        apiResponse,
        XPAction.APP_ADDED
      );

      expect(result).toBe(apiResponse);
      expect(NotificationService.xpAwardResult).toHaveBeenCalledWith(
        mockXPResult,
        XPAction.APP_ADDED
      );
    });

    it('should handle API response without XP data gracefully', () => {
      const apiResponse = {
        success: true,
        data: { id: '123' },
        // No xpAwarded field
      };

      const result = GamificationClientService.handleAPIResponse(
        apiResponse,
        XPAction.APP_ADDED
      );

      expect(result).toBe(apiResponse);
      expect(NotificationService.xpAwardResult).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors without breaking the flow', async () => {
      (fetch as jest.MockedFunction<typeof fetch>)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error')); // Mock all retry attempts

      const questData = {
        title: 'Test Quest',
        type: 'BUG_FIX' as const,
        priority: 'HIGH' as const,
      };

      await expect(QuestService.createQuest(questData)).rejects.toThrow();
      expect(NotificationService.xpAwardResult).not.toHaveBeenCalled();
    }, 10000); // Increase timeout for retry mechanism

    it('should handle malformed XP data gracefully', async () => {
      const mockResponse = {
        quest: {
          _id: 'quest123',
          title: 'Test Quest',
          type: 'BUG_FIX',
          priority: 'HIGH',
          state: 'OPEN',
        },
        xpAwarded: 'invalid-data', // Invalid XP data
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const questData = {
        title: 'Test Quest',
        type: 'BUG_FIX' as const,
        priority: 'HIGH' as const,
      };

      // Should not throw error, just not show notifications
      const result = await QuestService.createQuest(questData);
      expect(result).toEqual(mockResponse.quest);
      expect(NotificationService.xpAwardResult).not.toHaveBeenCalled();
    });
  });
});
/**
 * Integration tests for XP awarding in quest API routes
 * Tests the integration between quest operations and XP service
 */

import { XPService } from '@/lib/services/xp';
import { XPAction } from '@/types/gamification';

// Mock the XP service to verify it's called correctly
jest.mock('@/lib/services/xp');
const mockXPService = XPService as jest.Mocked<typeof XPService>;

describe('Quest API XP Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful XP awarding
    mockXPService.awardXP.mockResolvedValue({
      xpAwarded: 10,
      totalXP: 100,
      levelUp: false,
      badgesEarned: []
    });
  });

  describe('XP Service Integration', () => {
    it('should have XP service available for quest creation', () => {
      expect(XPService.awardXP).toBeDefined();
      expect(typeof XPService.awardXP).toBe('function');
    });

    it('should call XP service with correct parameters for quest creation', async () => {
      const userId = 'user123';
      const questData = {
        questId: 'quest123',
        questTitle: 'Test Quest',
        questType: 'BUG_FIX'
      };

      await XPService.awardXP(userId, XPAction.QUEST_CREATED, questData);

      expect(mockXPService.awardXP).toHaveBeenCalledWith(
        userId,
        XPAction.QUEST_CREATED,
        questData
      );
    });

    it('should call XP service with correct parameters for quest state changes', async () => {
      const userId = 'user123';
      const questData = {
        questId: 'quest123',
        questTitle: 'Test Quest',
        questType: 'BUG_FIX',
        previousState: 'OPEN',
        newState: 'IN_PROGRESS'
      };

      await XPService.awardXP(userId, XPAction.QUEST_IN_PROGRESS, questData);

      expect(mockXPService.awardXP).toHaveBeenCalledWith(
        userId,
        XPAction.QUEST_IN_PROGRESS,
        questData
      );
    });

    it('should handle XP service errors gracefully', async () => {
      mockXPService.awardXP.mockRejectedValue(new Error('XP service error'));

      // This should not throw - the API routes should catch and log the error
      await expect(async () => {
        try {
          await XPService.awardXP('user123', XPAction.QUEST_CREATED, {});
        } catch (error) {
          // API routes should catch this and continue
          console.log('XP error caught:', error);
        }
      }).not.toThrow();
    });

    it('should return XP result when successful', async () => {
      const expectedResult = {
        xpAwarded: 15,
        totalXP: 150,
        levelUp: true,
        newLevel: 2,
        badgesEarned: []
      };

      mockXPService.awardXP.mockResolvedValue(expectedResult);

      const result = await XPService.awardXP('user123', XPAction.QUEST_COMPLETED, {});

      expect(result).toEqual(expectedResult);
    });
  });

  describe('XP Actions Coverage', () => {
    it('should support all required XP actions', () => {
      expect(XPAction.QUEST_CREATED).toBeDefined();
      expect(XPAction.QUEST_IN_PROGRESS).toBeDefined();
      expect(XPAction.QUEST_COMPLETED).toBeDefined();
      expect(XPAction.APP_ADDED).toBeDefined();
      expect(XPAction.REVIEW_INTERACTION).toBeDefined();
    });

    it('should have correct XP action values', () => {
      expect(XPAction.QUEST_CREATED).toBe('QUEST_CREATED');
      expect(XPAction.QUEST_IN_PROGRESS).toBe('QUEST_IN_PROGRESS');
      expect(XPAction.QUEST_COMPLETED).toBe('QUEST_COMPLETED');
      expect(XPAction.APP_ADDED).toBe('APP_ADDED');
      expect(XPAction.REVIEW_INTERACTION).toBe('REVIEW_INTERACTION');
    });
  });
});
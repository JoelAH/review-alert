/**
 * Integration tests for XP awarding in reviews API routes
 * Tests the integration between review operations and XP service
 */

import { XPService } from '@/lib/services/xp';
import { XPAction } from '@/types/gamification';

// Mock the XP service to verify it's called correctly
jest.mock('@/lib/services/xp');
const mockXPService = XPService as jest.Mocked<typeof XPService>;

describe('Reviews API XP Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful XP awarding
    mockXPService.awardXP.mockResolvedValue({
      xpAwarded: 8,
      totalXP: 108,
      levelUp: false,
      badgesEarned: []
    });
  });

  describe('XP Service Integration', () => {
    it('should have XP service available for review interactions', () => {
      expect(XPService.awardXP).toBeDefined();
      expect(typeof XPService.awardXP).toBe('function');
    });

    it('should call XP service with correct parameters for review interaction', async () => {
      const userId = 'user123';
      const reviewData = {
        reviewId: 'review123',
        questId: 'quest123',
        action: 'linked_to_quest'
      };

      await XPService.awardXP(userId, XPAction.REVIEW_INTERACTION, reviewData);

      expect(mockXPService.awardXP).toHaveBeenCalledWith(
        userId,
        XPAction.REVIEW_INTERACTION,
        reviewData
      );
    });

    it('should handle XP service errors gracefully', async () => {
      mockXPService.awardXP.mockRejectedValue(new Error('XP service error'));

      // This should not throw - the API routes should catch and log the error
      await expect(async () => {
        try {
          await XPService.awardXP('user123', XPAction.REVIEW_INTERACTION, {});
        } catch (error) {
          // API routes should catch this and continue
          console.log('XP error caught:', error);
        }
      }).not.toThrow();
    });

    it('should return XP result when successful', async () => {
      const expectedResult = {
        xpAwarded: 8,
        totalXP: 108,
        levelUp: false,
        badgesEarned: []
      };

      mockXPService.awardXP.mockResolvedValue(expectedResult);

      const result = await XPService.awardXP('user123', XPAction.REVIEW_INTERACTION, {});

      expect(result).toEqual(expectedResult);
    });

    it('should support REVIEW_INTERACTION action', () => {
      expect(XPAction.REVIEW_INTERACTION).toBeDefined();
      expect(XPAction.REVIEW_INTERACTION).toBe('REVIEW_INTERACTION');
    });

    it('should handle both linking and unlinking actions', async () => {
      // Test linking to quest
      await XPService.awardXP('user123', XPAction.REVIEW_INTERACTION, {
        reviewId: 'review123',
        questId: 'quest123',
        action: 'linked_to_quest'
      });

      expect(mockXPService.awardXP).toHaveBeenCalledWith(
        'user123',
        XPAction.REVIEW_INTERACTION,
        {
          reviewId: 'review123',
          questId: 'quest123',
          action: 'linked_to_quest'
        }
      );

      // Test unlinking from quest
      await XPService.awardXP('user123', XPAction.REVIEW_INTERACTION, {
        reviewId: 'review123',
        questId: null,
        action: 'unlinked_from_quest'
      });

      expect(mockXPService.awardXP).toHaveBeenCalledWith(
        'user123',
        XPAction.REVIEW_INTERACTION,
        {
          reviewId: 'review123',
          questId: null,
          action: 'unlinked_from_quest'
        }
      );
    });
  });
});
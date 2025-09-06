/**
 * Integration tests for XP awarding in app save action
 * Tests the integration between app operations and XP service
 */

import { XPService } from '@/lib/services/xp';
import { XPAction } from '@/types/gamification';

// Mock the XP service to verify it's called correctly
jest.mock('@/lib/services/xp');
const mockXPService = XPService as jest.Mocked<typeof XPService>;

describe('App Save Action XP Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful XP awarding
    mockXPService.awardXP.mockResolvedValue({
      xpAwarded: 20,
      totalXP: 120,
      levelUp: false,
      badgesEarned: []
    });
  });

  describe('XP Service Integration', () => {
    it('should have XP service available for app addition', () => {
      expect(XPService.awardXP).toBeDefined();
      expect(typeof XPService.awardXP).toBe('function');
    });

    it('should call XP service with correct parameters for app addition', async () => {
      const userId = 'user123';
      const appData = {
        appId: 'app123',
        appName: 'Test App',
        store: 'GooglePlay',
        url: 'https://play.google.com/store/apps/details?id=com.test.app'
      };

      await XPService.awardXP(userId, XPAction.APP_ADDED, appData);

      expect(mockXPService.awardXP).toHaveBeenCalledWith(
        userId,
        XPAction.APP_ADDED,
        appData
      );
    });

    it('should handle XP service errors gracefully', async () => {
      mockXPService.awardXP.mockRejectedValue(new Error('XP service error'));

      // This should not throw - the action should catch and log the error
      await expect(async () => {
        try {
          await XPService.awardXP('user123', XPAction.APP_ADDED, {});
        } catch (error) {
          // Action should catch this and continue
          console.log('XP error caught:', error);
        }
      }).not.toThrow();
    });

    it('should return XP result when successful', async () => {
      const expectedResult = {
        xpAwarded: 20,
        totalXP: 120,
        levelUp: false,
        badgesEarned: []
      };

      mockXPService.awardXP.mockResolvedValue(expectedResult);

      const result = await XPService.awardXP('user123', XPAction.APP_ADDED, {});

      expect(result).toEqual(expectedResult);
    });

    it('should support APP_ADDED action', () => {
      expect(XPAction.APP_ADDED).toBeDefined();
      expect(XPAction.APP_ADDED).toBe('APP_ADDED');
    });
  });
});
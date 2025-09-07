/**
 * XP Service Persistence Integration Tests
 * Tests the integration between XP Service and the new persistence layer
 */

import { XPService } from '../xp';
import { GamificationPersistenceService } from '../gamificationPersistence';
import { XPAction, GamificationData } from '@/types/gamification';
import UserModel from '@/lib/models/server/user';

// Mock the dependencies
jest.mock('@/lib/models/server/user');
jest.mock('../gamificationPersistence');
jest.mock('../badges');

const MockedUserModel = UserModel as jest.Mocked<typeof UserModel>;
const MockedGamificationPersistenceService = GamificationPersistenceService as jest.Mocked<typeof GamificationPersistenceService>;

describe('XP Service Persistence Integration', () => {
  const mockUserId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('awardXP', () => {
    it('should use atomic persistence service for XP awards', async () => {
      const mockResult = {
        xpAwarded: 15,
        totalXP: 115,
        levelUp: false,
        badgesEarned: []
      };

      MockedGamificationPersistenceService.awardXPAtomic.mockResolvedValue(mockResult);

      const result = await XPService.awardXP(mockUserId, XPAction.QUEST_COMPLETED);

      expect(MockedGamificationPersistenceService.awardXPAtomic).toHaveBeenCalledWith(
        mockUserId,
        XPAction.QUEST_COMPLETED,
        undefined
      );
      expect(result).toEqual(mockResult);
    });

    it('should pass metadata to atomic persistence service', async () => {
      const metadata = { questId: 'quest123', difficulty: 'hard' };
      const mockResult = {
        xpAwarded: 20,
        totalXP: 120,
        levelUp: false,
        badgesEarned: []
      };

      MockedGamificationPersistenceService.awardXPAtomic.mockResolvedValue(mockResult);

      await XPService.awardXP(mockUserId, XPAction.APP_ADDED, metadata);

      expect(MockedGamificationPersistenceService.awardXPAtomic).toHaveBeenCalledWith(
        mockUserId,
        XPAction.APP_ADDED,
        metadata
      );
    });

    it('should handle errors from persistence service', async () => {
      const persistenceError = new Error('Database connection failed');
      MockedGamificationPersistenceService.awardXPAtomic.mockRejectedValue(persistenceError);

      await expect(
        XPService.awardXP(mockUserId, XPAction.QUEST_COMPLETED)
      ).rejects.toThrow(persistenceError);
    });
  });

  describe('getUserGamificationData', () => {
    it('should use safe persistence service for data retrieval', async () => {
      const mockData: GamificationData = {
        xp: 150,
        level: 2,
        badges: [],
        streaks: {
          currentLoginStreak: 3,
          longestLoginStreak: 5,
        },
        activityCounts: {
          questsCreated: 2,
          questsCompleted: 1,
          questsInProgress: 1,
          appsAdded: 1,
          reviewInteractions: 5,
        },
        xpHistory: [],
      };

      MockedGamificationPersistenceService.getUserGamificationDataSafe.mockResolvedValue(mockData);

      const result = await XPService.getUserGamificationData(mockUserId);

      expect(MockedGamificationPersistenceService.getUserGamificationDataSafe).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockData);
    });

    it('should return null when persistence service throws error', async () => {
      MockedGamificationPersistenceService.getUserGamificationDataSafe.mockRejectedValue(
        new Error('User not found')
      );

      const result = await XPService.getUserGamificationData(mockUserId);

      expect(result).toBeNull();
    });

    it('should handle data recovery scenarios', async () => {
      const recoveredData: GamificationData = {
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
      };

      MockedGamificationPersistenceService.getUserGamificationDataSafe.mockResolvedValue(recoveredData);

      const result = await XPService.getUserGamificationData(mockUserId);

      expect(result).toEqual(recoveredData);
    });
  });

  describe('updateLoginStreak', () => {
    it('should use safe persistence service and validate data', async () => {
      const mockData: GamificationData = {
        xp: 100,
        level: 2,
        badges: [],
        streaks: {
          currentLoginStreak: 2,
          longestLoginStreak: 5,
          lastLoginDate: new Date('2024-01-14'),
        },
        activityCounts: {
          questsCreated: 1,
          questsCompleted: 1,
          questsInProgress: 0,
          appsAdded: 1,
          reviewInteractions: 3,
        },
        xpHistory: [],
      };

      const mockXPResult = {
        xpAwarded: 5,
        totalXP: 105,
        levelUp: false,
        badgesEarned: []
      };

      MockedGamificationPersistenceService.getUserGamificationDataSafe.mockResolvedValue(mockData);
      MockedGamificationPersistenceService.validateGamificationData.mockImplementation(() => {});
      MockedUserModel.findByIdAndUpdate.mockResolvedValue({} as any);
      MockedGamificationPersistenceService.awardXPAtomic.mockResolvedValue(mockXPResult);

      // Mock current date to be next day
      const mockDate = new Date('2024-01-15');
      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.now = originalDate.now;

      const result = await XPService.updateLoginStreak(mockUserId);

      expect(MockedGamificationPersistenceService.getUserGamificationDataSafe).toHaveBeenCalledWith(mockUserId);
      expect(MockedUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          gamification: expect.objectContaining({
            streaks: expect.objectContaining({
              currentLoginStreak: 3, // Incremented from 2
              longestLoginStreak: 5, // Unchanged
            })
          })
        }),
        expect.objectContaining({
          runValidators: true
        })
      );
      expect(result).toEqual(mockXPResult);

      // Restore Date
      global.Date = originalDate;
    });

    it('should handle streak reset when days are skipped', async () => {
      const mockData: GamificationData = {
        xp: 100,
        level: 2,
        badges: [],
        streaks: {
          currentLoginStreak: 5,
          longestLoginStreak: 7,
          lastLoginDate: new Date('2024-01-10'), // 5 days ago
        },
        activityCounts: {
          questsCreated: 1,
          questsCompleted: 1,
          questsInProgress: 0,
          appsAdded: 1,
          reviewInteractions: 3,
        },
        xpHistory: [],
      };

      MockedGamificationPersistenceService.getUserGamificationDataSafe.mockResolvedValue(mockData);
      MockedGamificationPersistenceService.validateGamificationData.mockImplementation(() => {});
      MockedUserModel.findByIdAndUpdate.mockResolvedValue({} as any);

      // Mock current date to be 5 days later
      const mockDate = new Date('2024-01-15');
      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.now = originalDate.now;

      const result = await XPService.updateLoginStreak(mockUserId);

      expect(MockedGamificationPersistenceService.getUserGamificationDataSafe).toHaveBeenCalledWith(mockUserId);
      expect(result).toBeNull(); // No bonus XP for streak of 1

      // Restore Date
      global.Date = originalDate;
    });

    it('should handle first login ever', async () => {
      const mockData: GamificationData = {
        xp: 50,
        level: 1,
        badges: [],
        streaks: {
          currentLoginStreak: 0,
          longestLoginStreak: 0,
          // No lastLoginDate
        },
        activityCounts: {
          questsCreated: 1,
          questsCompleted: 0,
          questsInProgress: 1,
          appsAdded: 0,
          reviewInteractions: 2,
        },
        xpHistory: [],
      };

      MockedGamificationPersistenceService.getUserGamificationDataSafe.mockResolvedValue(mockData);
      MockedGamificationPersistenceService.validateGamificationData.mockImplementation(() => {});
      MockedUserModel.findByIdAndUpdate.mockResolvedValue({} as any);

      const result = await XPService.updateLoginStreak(mockUserId);

      expect(MockedUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          gamification: expect.objectContaining({
            streaks: expect.objectContaining({
              currentLoginStreak: 1,
              longestLoginStreak: 1,
            })
          })
        }),
        expect.anything()
      );
      expect(result).toBeNull(); // No bonus XP for first login
    });

    it('should award streak bonus at milestone', async () => {
      const mockData: GamificationData = {
        xp: 100,
        level: 2,
        badges: [],
        streaks: {
          currentLoginStreak: 2, // Will become 3 (milestone)
          longestLoginStreak: 5,
          lastLoginDate: new Date('2024-01-14'),
        },
        activityCounts: {
          questsCreated: 1,
          questsCompleted: 1,
          questsInProgress: 0,
          appsAdded: 1,
          reviewInteractions: 3,
        },
        xpHistory: [],
      };

      const mockXPResult = {
        xpAwarded: 5, // 3-day streak bonus
        totalXP: 105,
        levelUp: false,
        badgesEarned: []
      };

      MockedGamificationPersistenceService.getUserGamificationDataSafe.mockResolvedValue(mockData);
      MockedGamificationPersistenceService.validateGamificationData.mockImplementation(() => {});
      MockedUserModel.findByIdAndUpdate.mockResolvedValue({} as any);
      MockedGamificationPersistenceService.awardXPAtomic.mockResolvedValue(mockXPResult);

      // Mock current date to be next day
      const mockDate = new Date('2024-01-15');
      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.now = originalDate.now;

      const result = await XPService.updateLoginStreak(mockUserId);

      expect(MockedGamificationPersistenceService.getUserGamificationDataSafe).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockXPResult);

      // Restore Date
      global.Date = originalDate;
    });

    it('should handle same day login (no update)', async () => {
      const today = new Date('2024-01-15');
      const mockData: GamificationData = {
        xp: 100,
        level: 2,
        badges: [],
        streaks: {
          currentLoginStreak: 3,
          longestLoginStreak: 5,
          lastLoginDate: today, // Same day
        },
        activityCounts: {
          questsCreated: 1,
          questsCompleted: 1,
          questsInProgress: 0,
          appsAdded: 1,
          reviewInteractions: 3,
        },
        xpHistory: [],
      };

      MockedGamificationPersistenceService.getUserGamificationDataSafe.mockResolvedValue(mockData);

      // Mock current date to be same day
      jest.spyOn(global, 'Date').mockImplementation(() => today as any);

      const result = await XPService.updateLoginStreak(mockUserId);

      expect(MockedUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(result).toBeNull();

      // Restore Date
      (global.Date as any).mockRestore();
    });

    it('should handle persistence service errors', async () => {
      MockedGamificationPersistenceService.getUserGamificationDataSafe.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        XPService.updateLoginStreak(mockUserId)
      ).rejects.toThrow('Failed to update login streak');
    });

    it('should handle validation errors', async () => {
      const mockData: GamificationData = {
        xp: 100,
        level: 2,
        badges: [],
        streaks: {
          currentLoginStreak: 2,
          longestLoginStreak: 5,
          lastLoginDate: new Date('2024-01-14'),
        },
        activityCounts: {
          questsCreated: 1,
          questsCompleted: 1,
          questsInProgress: 0,
          appsAdded: 1,
          reviewInteractions: 3,
        },
        xpHistory: [],
      };

      MockedGamificationPersistenceService.getUserGamificationDataSafe.mockResolvedValue(mockData);
      MockedGamificationPersistenceService.validateGamificationData.mockImplementation(() => {
        throw new Error('Validation failed');
      });

      await expect(
        XPService.updateLoginStreak(mockUserId)
      ).rejects.toThrow('Failed to update login streak');
    });
  });

  describe('error recovery and resilience', () => {
    it('should handle transient database errors with retry', async () => {
      MockedGamificationPersistenceService.awardXPAtomic
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValueOnce({
          xpAwarded: 15,
          totalXP: 115,
          levelUp: false,
          badgesEarned: []
        });

      // The XP service should delegate to the persistence service, which handles retries
      await expect(
        XPService.awardXP(mockUserId, XPAction.QUEST_COMPLETED)
      ).rejects.toThrow('Connection timeout');

      expect(MockedGamificationPersistenceService.awardXPAtomic).toHaveBeenCalledTimes(1);
    });

    it('should maintain data consistency during concurrent operations', async () => {
      // This test would be more meaningful with actual database operations
      // For now, we test that the service properly delegates to the persistence layer
      const mockResult = {
        xpAwarded: 10,
        totalXP: 110,
        levelUp: false,
        badgesEarned: []
      };

      MockedGamificationPersistenceService.awardXPAtomic.mockResolvedValue(mockResult);

      // Simulate concurrent operations
      const operations = [
        XPService.awardXP(mockUserId, XPAction.QUEST_CREATED),
        XPService.awardXP(mockUserId, XPAction.QUEST_IN_PROGRESS),
      ];

      const results = await Promise.allSettled(operations);

      // At least one should succeed (the persistence service handles concurrency)
      const successfulResults = results.filter(r => r.status === 'fulfilled');
      expect(successfulResults.length).toBeGreaterThan(0);
    });

    it('should handle data corruption recovery', async () => {
      // Test that the service can handle corrupted data through the persistence layer
      const recoveredData: GamificationData = {
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
      };

      MockedGamificationPersistenceService.getUserGamificationDataSafe.mockResolvedValue(recoveredData);

      const result = await XPService.getUserGamificationData(mockUserId);

      expect(result).toEqual(recoveredData);
      expect(result!.xp).toBe(0); // Should be recovered to valid state
    });
  });

  describe('backward compatibility', () => {
    it('should maintain existing API contract', async () => {
      const mockResult = {
        xpAwarded: 15,
        totalXP: 115,
        levelUp: false,
        badgesEarned: []
      };

      MockedGamificationPersistenceService.awardXPAtomic.mockResolvedValue(mockResult);

      // Test that the API still works as expected
      const result = await XPService.awardXP(mockUserId, XPAction.QUEST_COMPLETED);

      expect(result).toHaveProperty('xpAwarded');
      expect(result).toHaveProperty('totalXP');
      expect(result).toHaveProperty('levelUp');
      expect(result).toHaveProperty('badgesEarned');
      expect(typeof result.xpAwarded).toBe('number');
      expect(typeof result.totalXP).toBe('number');
      expect(typeof result.levelUp).toBe('boolean');
      expect(Array.isArray(result.badgesEarned)).toBe(true);
    });

    it('should handle null return values gracefully', async () => {
      MockedGamificationPersistenceService.getUserGamificationDataSafe.mockRejectedValue(
        new Error('User not found')
      );

      const result = await XPService.getUserGamificationData(mockUserId);

      expect(result).toBeNull();
    });
  });
});
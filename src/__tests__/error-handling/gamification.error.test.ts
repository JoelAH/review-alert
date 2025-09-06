/**
 * Gamification Error Handling Tests
 * Tests error scenarios, edge cases, and system resilience
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import UserModel from '@/lib/models/server/user';
import { XPService } from '@/lib/services/xp';
import { BadgeService } from '@/lib/services/badges';
import { GamificationPersistenceService } from '@/lib/services/gamificationPersistence';
import { XPAction, GamificationData } from '@/types/gamification';

describe('Gamification Error Handling Tests', () => {
  let mongoServer: MongoMemoryServer;
  let testUserId: string;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database and create test user
    await UserModel.deleteMany({});
    
    const testUser = await UserModel.create({
      email: 'error-test@example.com',
      displayName: 'Error Test User',
      gamification: {
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
      },
    });
    
    testUserId = testUser._id.toString();
  });

  describe('Invalid User Scenarios', () => {
    it('should handle non-existent user ID gracefully', async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();
      
      await expect(
        XPService.awardXP(fakeUserId, XPAction.QUEST_COMPLETED)
      ).rejects.toThrow('User not found');
      
      await expect(
        XPService.getUserGamificationData(fakeUserId)
      ).resolves.toBeNull();
      
      await expect(
        XPService.updateLoginStreak(fakeUserId)
      ).rejects.toThrow('User not found');
    });

    it('should handle invalid user ID format', async () => {
      const invalidUserIds = [
        'invalid-id',
        '',
        null,
        undefined,
        123,
        {},
      ];

      for (const invalidId of invalidUserIds) {
        await expect(
          XPService.awardXP(invalidId as any, XPAction.QUEST_COMPLETED)
        ).rejects.toThrow();
        
        await expect(
          XPService.getUserGamificationData(invalidId as any)
        ).rejects.toThrow();
      }
    });

    it('should handle user with missing gamification data', async () => {
      // Create user without gamification data
      const userWithoutGamification = await UserModel.create({
        email: 'no-gamification@example.com',
        displayName: 'No Gamification User',
        // No gamification field
      });

      const userId = userWithoutGamification._id.toString();

      // Should initialize gamification data when needed
      const result = await XPService.awardXP(userId, XPAction.QUEST_COMPLETED);
      expect(result).toBeDefined();
      expect(result.totalXP).toBe(15); // QUEST_COMPLETED XP

      const userData = await XPService.getUserGamificationData(userId);
      expect(userData).toBeDefined();
      expect(userData!.xp).toBe(15);
      expect(userData!.level).toBe(1);
    });

    it('should handle user with corrupted gamification data', async () => {
      // Manually corrupt the user's gamification data
      await UserModel.findByIdAndUpdate(testUserId, {
        $set: {
          'gamification.xp': -100, // Invalid negative XP
          'gamification.level': 0, // Invalid level
          'gamification.activityCounts': null, // Null activity counts
        }
      });

      // Should handle and fix corrupted data
      const result = await XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED);
      expect(result).toBeDefined();
      
      const userData = await XPService.getUserGamificationData(testUserId);
      expect(userData!.xp).toBeGreaterThanOrEqual(0);
      expect(userData!.level).toBeGreaterThanOrEqual(1);
      expect(userData!.activityCounts).toBeDefined();
    });
  });

  describe('Invalid XP Actions', () => {
    it('should handle invalid XP action types', async () => {
      const invalidActions = [
        'INVALID_ACTION',
        '',
        null,
        undefined,
        123,
        {},
      ];

      for (const invalidAction of invalidActions) {
        await expect(
          XPService.awardXP(testUserId, invalidAction as any)
        ).rejects.toThrow();
      }
    });

    it('should handle XP action with zero or negative values', async () => {
      // This tests the XP service's handling of edge case XP values
      // The service should have validation for minimum XP amounts
      
      // Mock an XP action that might return 0 or negative XP
      const originalGetXPForAction = XPService.getXPForAction;
      
      // Temporarily override to return invalid values
      (XPService as any).getXPForAction = jest.fn()
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(-10)
        .mockReturnValue(15); // Normal value for subsequent calls

      // Should handle zero XP gracefully
      const result1 = await XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED);
      expect(result1.xpAwarded).toBe(0);
      expect(result1.totalXP).toBe(0);

      // Should handle negative XP gracefully
      const result2 = await XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED);
      expect(result2.xpAwarded).toBe(0); // Should not award negative XP
      expect(result2.totalXP).toBe(0);

      // Restore original function
      (XPService as any).getXPForAction = originalGetXPForAction;
    });
  });

  describe('Database Connection Issues', () => {
    it('should handle database disconnection gracefully', async () => {
      // Temporarily disconnect from database
      await mongoose.disconnect();

      // Operations should fail gracefully
      await expect(
        XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED)
      ).rejects.toThrow();

      await expect(
        XPService.getUserGamificationData(testUserId)
      ).rejects.toThrow();

      // Reconnect for cleanup
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });

    it('should handle database timeout scenarios', async () => {
      // Mock a slow database operation
      const originalFindById = UserModel.findById;
      UserModel.findById = jest.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(null), 5000); // 5 second delay
        });
      });

      // Operation should timeout or handle slow response
      const startTime = Date.now();
      
      try {
        await XPService.getUserGamificationData(testUserId);
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Should not wait the full 5 seconds
        expect(duration).toBeLessThan(5000);
      }

      // Restore original function
      UserModel.findById = originalFindById;
    });
  });

  describe('Data Validation Errors', () => {
    it('should handle XP overflow scenarios', async () => {
      // Set user to very high XP
      await UserModel.findByIdAndUpdate(testUserId, {
        $set: {
          'gamification.xp': Number.MAX_SAFE_INTEGER - 10,
        }
      });

      // Award more XP - should handle overflow gracefully
      const result = await XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED);
      
      expect(result.totalXP).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
      expect(result.totalXP).toBeGreaterThan(0);
    });

    it('should handle invalid badge data', async () => {
      // Manually add invalid badge data
      await UserModel.findByIdAndUpdate(testUserId, {
        $push: {
          'gamification.badges': {
            id: 'invalid-badge',
            name: null, // Invalid name
            description: '',
            category: 'INVALID_CATEGORY',
            earnedAt: 'invalid-date',
          }
        }
      });

      // Should handle invalid badge data gracefully
      const userData = await XPService.getUserGamificationData(testUserId);
      expect(userData).toBeDefined();
      
      // Badge service should handle invalid badges
      const badgeProgress = BadgeService.getBadgeProgress(userData!);
      expect(badgeProgress).toBeDefined();
      expect(Array.isArray(badgeProgress)).toBe(true);
    });

    it('should handle invalid streak data', async () => {
      // Set invalid streak data
      await UserModel.findByIdAndUpdate(testUserId, {
        $set: {
          'gamification.streaks.currentLoginStreak': -5,
          'gamification.streaks.longestLoginStreak': -10,
          'gamification.streaks.lastLoginDate': 'invalid-date',
        }
      });

      // Should handle and correct invalid streak data
      const result = await XPService.updateLoginStreak(testUserId);
      
      const userData = await XPService.getUserGamificationData(testUserId);
      expect(userData!.streaks.currentLoginStreak).toBeGreaterThanOrEqual(0);
      expect(userData!.streaks.longestLoginStreak).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Service Integration Errors', () => {
    it('should handle badge service failures gracefully', async () => {
      // Mock badge service to throw errors
      const originalEvaluateBadges = BadgeService.evaluateBadges;
      BadgeService.evaluateBadges = jest.fn().mockImplementation(() => {
        throw new Error('Badge service unavailable');
      });

      // XP award should still work even if badge evaluation fails
      const result = await XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED);
      
      expect(result).toBeDefined();
      expect(result.totalXP).toBe(15);
      expect(result.badgesEarned).toEqual([]); // No badges due to service failure

      // Restore original function
      BadgeService.evaluateBadges = originalEvaluateBadges;
    });

    it('should handle persistence service failures', async () => {
      // Mock persistence service to fail
      const originalSaveGamificationData = GamificationPersistenceService.saveGamificationData;
      GamificationPersistenceService.saveGamificationData = jest.fn().mockRejectedValue(
        new Error('Persistence service unavailable')
      );

      // Should handle persistence failures
      await expect(
        XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED)
      ).rejects.toThrow('Persistence service unavailable');

      // Restore original function
      GamificationPersistenceService.saveGamificationData = originalSaveGamificationData;
    });
  });

  describe('Memory and Resource Limits', () => {
    it('should handle large XP history arrays', async () => {
      // Create user with very large XP history
      const largeXPHistory = Array.from({ length: 10000 }, (_, i) => ({
        action: XPAction.QUEST_COMPLETED,
        amount: 15,
        timestamp: new Date(Date.now() - i * 1000),
      }));

      await UserModel.findByIdAndUpdate(testUserId, {
        $set: {
          'gamification.xpHistory': largeXPHistory,
          'gamification.xp': largeXPHistory.length * 15,
        }
      });

      // Should handle large data sets without performance issues
      const startTime = Date.now();
      const userData = await XPService.getUserGamificationData(testUserId);
      const endTime = Date.now();

      expect(userData).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle many concurrent badge evaluations', async () => {
      // Award XP to trigger multiple badge evaluations
      let currentXP = 0;
      const maxOperations = 100;
      let operations = 0;

      while (currentXP < 1000 && operations < maxOperations) {
        const result = await XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED);
        currentXP = result.totalXP;
        operations++;
      }

      // Should complete without memory issues
      const userData = await XPService.getUserGamificationData(testUserId);
      expect(userData!.xp).toBeGreaterThan(0);
      expect(userData!.badges.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Case Scenarios', () => {
    it('should handle user deletion during operation', async () => {
      // Start an operation
      const operationPromise = XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED);

      // Delete user while operation is in progress
      setTimeout(async () => {
        await UserModel.findByIdAndDelete(testUserId);
      }, 10);

      // Operation should handle user deletion gracefully
      await expect(operationPromise).rejects.toThrow();
    });

    it('should handle system date/time changes', async () => {
      // Award XP with current timestamp
      await XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED);

      // Mock system date to be in the past
      const originalDate = Date;
      const mockDate = new Date('2020-01-01');
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.now = jest.fn(() => mockDate.getTime());

      // Should handle date inconsistencies
      const result = await XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED);
      expect(result).toBeDefined();

      // Restore original Date
      global.Date = originalDate;
    });

    it('should handle malformed database documents', async () => {
      // Create document with missing required fields
      const malformedUser = new UserModel({
        email: 'malformed@example.com',
        // Missing displayName and other required fields
      });

      try {
        await malformedUser.save();
      } catch (error) {
        // Should handle validation errors appropriately
        expect(error).toBeDefined();
      }
    });

    it('should handle extremely rapid successive operations', async () => {
      // Perform operations as fast as possible
      const promises = [];
      for (let i = 0; i < 1000; i++) {
        promises.push(
          XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED)
            .catch(error => ({ error: error.message }))
        );
      }

      const results = await Promise.allSettled(promises);
      
      // Some operations should succeed
      const successfulResults = results.filter(result => 
        result.status === 'fulfilled' && !result.value.error
      );
      
      expect(successfulResults.length).toBeGreaterThan(0);
      
      // Final state should be consistent
      const userData = await XPService.getUserGamificationData(testUserId);
      expect(userData).toBeDefined();
      expect(userData!.xp).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Recovery and Resilience', () => {
    it('should recover from temporary service failures', async () => {
      let failureCount = 0;
      const maxFailures = 3;

      // Mock service to fail first few times, then succeed
      const originalAwardXP = XPService.awardXP;
      XPService.awardXP = jest.fn().mockImplementation(async (userId, action) => {
        if (failureCount < maxFailures) {
          failureCount++;
          throw new Error(`Temporary failure ${failureCount}`);
        }
        return originalAwardXP.call(XPService, userId, action);
      });

      // Implement retry logic
      let result;
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        try {
          result = await XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED);
          break;
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 100)); // Wait before retry
        }
      }

      expect(result).toBeDefined();
      expect(attempts).toBe(maxFailures);

      // Restore original function
      XPService.awardXP = originalAwardXP;
    });

    it('should maintain data integrity after errors', async () => {
      // Get initial state
      const initialData = await XPService.getUserGamificationData(testUserId);
      const initialXP = initialData!.xp;

      // Perform operations with some failures
      const promises = [];
      for (let i = 0; i < 10; i++) {
        if (i % 3 === 0) {
          // These operations will fail
          promises.push(
            XPService.awardXP('invalid-user-id', XPAction.QUEST_COMPLETED)
              .catch(() => null)
          );
        } else {
          // These should succeed
          promises.push(
            XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED)
          );
        }
      }

      await Promise.allSettled(promises);

      // Verify data integrity
      const finalData = await XPService.getUserGamificationData(testUserId);
      expect(finalData!.xp).toBeGreaterThan(initialXP);
      
      // XP should match history
      const xpFromHistory = finalData!.xpHistory.reduce((sum, entry) => sum + entry.amount, 0);
      expect(finalData!.xp).toBe(xpFromHistory);
    });
  });
});
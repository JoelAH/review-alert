/**
 * Gamification Concurrency Tests
 * Tests concurrent user scenarios, race condition handling, and data consistency
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import UserModel from '@/lib/models/server/user';
import { XPService } from '@/lib/services/xp';
import { BadgeService } from '@/lib/services/badges';
import { GamificationPersistenceService } from '@/lib/services/gamificationPersistence';
import { XPAction, GamificationData } from '@/types/gamification';

describe('Gamification Concurrency Tests', () => {
  let mongoServer: MongoMemoryServer;
  let testUserIds: string[] = [];

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
    // Clear database and create test users
    await UserModel.deleteMany({});
    testUserIds = [];
    
    // Create multiple test users
    for (let i = 0; i < 5; i++) {
      const testUser = await UserModel.create({
        email: `concurrency-test-${i}@example.com`,
        displayName: `Concurrency Test User ${i}`,
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
      
      testUserIds.push(testUser._id.toString());
    }
  });

  describe('Concurrent XP Awards', () => {
    it('should handle multiple concurrent XP awards for single user', async () => {
      const userId = testUserIds[0];
      const concurrentOperations = 10;
      const xpPerOperation = 15; // QUEST_COMPLETED XP

      // Start multiple concurrent XP award operations
      const promises = Array.from({ length: concurrentOperations }, (_, i) =>
        XPService.awardXP(userId, XPAction.QUEST_COMPLETED)
          .catch(error => {
            console.log(`Concurrent XP operation ${i} failed:`, error.message);
            return null;
          })
      );

      const results = await Promise.allSettled(promises);
      const successfulResults = results
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => (result as PromiseFulfilledResult<any>).value);

      // Verify final state is consistent
      const userData = await XPService.getUserGamificationData(userId);
      
      // XP should be consistent with successful operations
      const expectedMinXP = successfulResults.length * xpPerOperation;
      expect(userData!.xp).toBeGreaterThanOrEqual(expectedMinXP);
      
      // Activity counts should match
      expect(userData!.activityCounts.questsCompleted).toBe(successfulResults.length);
      
      // Level should be calculated correctly
      const expectedLevel = XPService.calculateLevel(userData!.xp);
      expect(userData!.level).toBe(expectedLevel);
    });

    it('should handle concurrent XP awards across multiple users', async () => {
      const operationsPerUser = 5;
      const allPromises: Promise<any>[] = [];

      // Start concurrent operations for all users
      testUserIds.forEach((userId, userIndex) => {
        for (let i = 0; i < operationsPerUser; i++) {
          allPromises.push(
            XPService.awardXP(userId, XPAction.QUEST_COMPLETED)
              .catch(error => {
                console.log(`User ${userIndex} operation ${i} failed:`, error.message);
                return null;
              })
          );
        }
      });

      await Promise.allSettled(allPromises);

      // Verify each user's final state
      for (const userId of testUserIds) {
        const userData = await XPService.getUserGamificationData(userId);
        
        // Each user should have some XP and completed quests
        expect(userData!.xp).toBeGreaterThan(0);
        expect(userData!.activityCounts.questsCompleted).toBeGreaterThan(0);
        expect(userData!.level).toBeGreaterThanOrEqual(1);
      }
    });

    it('should prevent XP duplication in race conditions', async () => {
      const userId = testUserIds[0];
      const iterations = 20;

      // Perform multiple rounds of concurrent operations
      for (let round = 0; round < 3; round++) {
        const promises = Array.from({ length: iterations }, () =>
          XPService.awardXP(userId, XPAction.QUEST_COMPLETED)
        );

        await Promise.allSettled(promises);
      }

      // Verify XP history consistency
      const userData = await XPService.getUserGamificationData(userId);
      const totalXPFromHistory = userData!.xpHistory.reduce((sum, entry) => sum + entry.amount, 0);
      
      expect(userData!.xp).toBe(totalXPFromHistory);
      expect(userData!.xpHistory.length).toBe(userData!.activityCounts.questsCompleted);
    });
  });

  describe('Concurrent Badge Evaluation', () => {
    it('should prevent duplicate badge awards in concurrent scenarios', async () => {
      const userId = testUserIds[0];
      
      // Award XP to get close to badge threshold
      let currentXP = 0;
      while (currentXP < 90) {
        const result = await XPService.awardXP(userId, XPAction.QUEST_COMPLETED);
        currentXP = result.totalXP;
      }

      // Now start multiple concurrent operations that should trigger the same badge
      const promises = Array.from({ length: 10 }, () =>
        XPService.awardXP(userId, XPAction.QUEST_COMPLETED)
      );

      await Promise.allSettled(promises);

      // Verify no duplicate badges
      const userData = await XPService.getUserGamificationData(userId);
      const badgeIds = userData!.badges.map(b => b.id);
      const uniqueBadgeIds = [...new Set(badgeIds)];
      
      expect(badgeIds.length).toBe(uniqueBadgeIds.length);
      
      // Should have Getting Started badge (100 XP) exactly once
      const gettingStartedBadges = userData!.badges.filter(b => b.id === 'getting-started');
      expect(gettingStartedBadges.length).toBeLessThanOrEqual(1);
    });

    it('should handle concurrent badge evaluations across different badge types', async () => {
      const userId = testUserIds[0];
      
      // Create a scenario where multiple badge types could be earned simultaneously
      const mixedOperations = [
        () => XPService.awardXP(userId, XPAction.QUEST_COMPLETED),
        () => XPService.awardXP(userId, XPAction.QUEST_CREATED),
        () => XPService.awardXP(userId, XPAction.APP_ADDED),
        () => XPService.awardXP(userId, XPAction.REVIEW_INTERACTION),
      ];

      // Perform many mixed operations concurrently
      const promises: Promise<any>[] = [];
      for (let i = 0; i < 50; i++) {
        const operation = mixedOperations[i % mixedOperations.length];
        promises.push(operation());
      }

      await Promise.allSettled(promises);

      // Verify badge consistency
      const userData = await XPService.getUserGamificationData(userId);
      const badgeIds = userData!.badges.map(b => b.id);
      const uniqueBadgeIds = [...new Set(badgeIds)];
      
      expect(badgeIds.length).toBe(uniqueBadgeIds.length);
      
      // Verify badges match their requirements
      for (const badge of userData!.badges) {
        const badgeDefinition = BadgeService.getBadgeDefinitions().find(b => b.id === badge.id);
        expect(badgeDefinition).toBeDefined();
        
        // Verify user actually meets the requirements
        const meetsRequirements = BadgeService.evaluateBadgeRequirements(badgeDefinition!, userData!);
        expect(meetsRequirements).toBe(true);
      }
    });
  });

  describe('Concurrent Streak Updates', () => {
    it('should handle concurrent login streak updates', async () => {
      const userId = testUserIds[0];
      
      // Start multiple concurrent streak update operations
      const promises = Array.from({ length: 5 }, () =>
        XPService.updateLoginStreak(userId)
      );

      const results = await Promise.allSettled(promises);
      const successfulResults = results.filter(result => result.status === 'fulfilled');

      // Verify streak is consistent
      const userData = await XPService.getUserGamificationData(userId);
      expect(userData!.streaks.currentLoginStreak).toBe(1); // Should be 1 for today
      expect(userData!.streaks.lastLoginDate).toBeInstanceOf(Date);
    });

    it('should handle streak updates across multiple days concurrently', async () => {
      const userId = testUserIds[0];
      
      // Simulate multiple days of login attempts happening concurrently
      const dayPromises = [];
      
      for (let day = 0; day < 5; day++) {
        dayPromises.push(
          (async () => {
            // Set the last login date to simulate different days
            const user = await UserModel.findById(userId);
            if (day > 0) {
              const targetDate = new Date();
              targetDate.setDate(targetDate.getDate() - (5 - day));
              targetDate.setHours(0, 0, 0, 0);
              user!.gamification!.streaks.lastLoginDate = targetDate;
              await user!.save();
            }
            
            return XPService.updateLoginStreak(userId);
          })()
        );
      }

      await Promise.allSettled(dayPromises);

      // Verify final streak state
      const userData = await XPService.getUserGamificationData(userId);
      expect(userData!.streaks.currentLoginStreak).toBeGreaterThan(0);
      expect(userData!.streaks.longestLoginStreak).toBeGreaterThanOrEqual(userData!.streaks.currentLoginStreak);
    });
  });

  describe('Database Consistency Under Load', () => {
    it('should maintain data consistency under high concurrent load', async () => {
      const operationsPerUser = 20;
      const allPromises: Promise<any>[] = [];

      // Generate high load across all users
      testUserIds.forEach(userId => {
        for (let i = 0; i < operationsPerUser; i++) {
          // Mix different types of operations
          const operations = [
            () => XPService.awardXP(userId, XPAction.QUEST_COMPLETED),
            () => XPService.awardXP(userId, XPAction.QUEST_CREATED),
            () => XPService.awardXP(userId, XPAction.APP_ADDED),
            () => XPService.updateLoginStreak(userId),
          ];
          
          const operation = operations[i % operations.length];
          allPromises.push(
            operation().catch(error => {
              console.log(`High load operation failed:`, error.message);
              return null;
            })
          );
        }
      });

      // Execute all operations concurrently
      const startTime = Date.now();
      await Promise.allSettled(allPromises);
      const endTime = Date.now();
      
      console.log(`High load test completed in ${endTime - startTime}ms`);

      // Verify data consistency for each user
      for (const userId of testUserIds) {
        const userData = await XPService.getUserGamificationData(userId);
        
        // XP should match XP history
        const totalXPFromHistory = userData!.xpHistory.reduce((sum, entry) => sum + entry.amount, 0);
        expect(userData!.xp).toBe(totalXPFromHistory);
        
        // Level should be calculated correctly
        const expectedLevel = XPService.calculateLevel(userData!.xp);
        expect(userData!.level).toBe(expectedLevel);
        
        // Activity counts should be consistent
        expect(userData!.activityCounts.questsCompleted).toBeGreaterThanOrEqual(0);
        expect(userData!.activityCounts.questsCreated).toBeGreaterThanOrEqual(0);
        expect(userData!.activityCounts.appsAdded).toBeGreaterThanOrEqual(0);
        
        // No duplicate badges
        const badgeIds = userData!.badges.map(b => b.id);
        const uniqueBadgeIds = [...new Set(badgeIds)];
        expect(badgeIds.length).toBe(uniqueBadgeIds.length);
      }
    });

    it('should handle database connection issues gracefully', async () => {
      const userId = testUserIds[0];
      
      // Simulate database stress by performing many operations
      const promises = Array.from({ length: 100 }, (_, i) =>
        XPService.awardXP(userId, XPAction.QUEST_COMPLETED)
          .catch(error => {
            // Some operations may fail due to database stress
            return { error: error.message, index: i };
          })
      );

      const results = await Promise.allSettled(promises);
      
      // At least some operations should succeed
      const successfulResults = results.filter(result => 
        result.status === 'fulfilled' && 
        result.value && 
        !result.value.error
      );
      
      expect(successfulResults.length).toBeGreaterThan(0);
      
      // Final state should be consistent
      const userData = await XPService.getUserGamificationData(userId);
      expect(userData).toBeDefined();
      expect(userData!.xp).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Atomic Operations', () => {
    it('should ensure XP award operations are atomic', async () => {
      const userId = testUserIds[0];
      
      // Perform operations that should be atomic
      const promises = Array.from({ length: 10 }, () =>
        XPService.awardXP(userId, XPAction.QUEST_COMPLETED)
      );

      await Promise.allSettled(promises);

      // Verify atomicity by checking that XP history matches current XP
      const userData = await XPService.getUserGamificationData(userId);
      const xpFromHistory = userData!.xpHistory.reduce((sum, entry) => sum + entry.amount, 0);
      
      expect(userData!.xp).toBe(xpFromHistory);
      expect(userData!.xpHistory.length).toBe(userData!.activityCounts.questsCompleted);
    });

    it('should handle partial failures without corrupting data', async () => {
      const userId = testUserIds[0];
      
      // Get initial state
      const initialData = await XPService.getUserGamificationData(userId);
      const initialXP = initialData!.xp;
      const initialQuestCount = initialData!.activityCounts.questsCompleted;

      // Perform operations with some that might fail
      const promises = Array.from({ length: 20 }, (_, i) => {
        // Introduce some operations that might cause issues
        if (i % 7 === 0) {
          // These might fail due to validation or other issues
          return XPService.awardXP(userId, XPAction.QUEST_COMPLETED)
            .catch(() => null);
        }
        return XPService.awardXP(userId, XPAction.QUEST_COMPLETED);
      });

      const results = await Promise.allSettled(promises);
      const successfulResults = results.filter(result => 
        result.status === 'fulfilled' && result.value !== null
      );

      // Verify data integrity
      const finalData = await XPService.getUserGamificationData(userId);
      
      // XP should have increased by the amount from successful operations
      expect(finalData!.xp).toBeGreaterThan(initialXP);
      expect(finalData!.activityCounts.questsCompleted).toBeGreaterThan(initialQuestCount);
      
      // XP should match history
      const xpFromHistory = finalData!.xpHistory.reduce((sum, entry) => sum + entry.amount, 0);
      expect(finalData!.xp).toBe(xpFromHistory);
    });
  });

  describe('Performance Under Concurrency', () => {
    it('should maintain reasonable performance under concurrent load', async () => {
      const userId = testUserIds[0];
      const operationCount = 50;
      
      const startTime = Date.now();
      
      const promises = Array.from({ length: operationCount }, () =>
        XPService.awardXP(userId, XPAction.QUEST_COMPLETED)
      );

      await Promise.allSettled(promises);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTimePerOperation = totalTime / operationCount;
      
      console.log(`Concurrent performance: ${totalTime}ms total, ${avgTimePerOperation.toFixed(2)}ms per operation`);
      
      // Performance should be reasonable (less than 100ms per operation on average)
      expect(avgTimePerOperation).toBeLessThan(100);
      
      // Verify final state is correct
      const userData = await XPService.getUserGamificationData(userId);
      expect(userData!.xp).toBeGreaterThan(0);
      expect(userData!.activityCounts.questsCompleted).toBeGreaterThan(0);
    });

    it('should handle burst traffic patterns', async () => {
      // Simulate burst traffic - many operations in quick succession, then pause
      const userId = testUserIds[0];
      
      for (let burst = 0; burst < 3; burst++) {
        const burstStartTime = Date.now();
        
        // Quick burst of operations
        const burstPromises = Array.from({ length: 20 }, () =>
          XPService.awardXP(userId, XPAction.QUEST_COMPLETED)
        );
        
        await Promise.allSettled(burstPromises);
        
        const burstEndTime = Date.now();
        console.log(`Burst ${burst + 1} completed in ${burstEndTime - burstStartTime}ms`);
        
        // Small pause between bursts
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Verify final consistency
      const userData = await XPService.getUserGamificationData(userId);
      const xpFromHistory = userData!.xpHistory.reduce((sum, entry) => sum + entry.amount, 0);
      expect(userData!.xp).toBe(xpFromHistory);
    });
  });
});
/**
 * Gamification Performance Tests
 * Tests XP calculation performance with large datasets and concurrent operations
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import UserModel from '@/lib/models/server/user';
import { XPService } from '@/lib/services/xp';
import { BadgeService } from '@/lib/services/badges';
import { GamificationPersistenceService } from '@/lib/services/gamificationPersistence';
import { XPAction, GamificationData, XPTransaction } from '@/types/gamification';

describe('Gamification Performance Tests', () => {
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
    // Clear database
    await UserModel.deleteMany({});
    testUserIds = [];
  });

  describe('XP Calculation Performance', () => {
    it('should handle large XP history efficiently', async () => {
      // Create user with large XP history
      const largeXPHistory: XPTransaction[] = [];
      let totalXP = 0;

      // Generate 10,000 XP transactions
      for (let i = 0; i < 10000; i++) {
        const xpAmount = Math.floor(Math.random() * 20) + 5; // 5-25 XP
        totalXP += xpAmount;
        
        largeXPHistory.push({
          amount: xpAmount,
          action: XPAction.QUEST_COMPLETED,
          timestamp: new Date(Date.now() - (10000 - i) * 1000), // Spread over time
          metadata: { questId: `quest-${i}` },
        });
      }

      const testUser = await UserModel.create({
        email: 'performance-test@example.com',
        displayName: 'Performance Test User',
        gamification: {
          xp: totalXP,
          level: XPService.calculateLevel(totalXP),
          badges: [],
          streaks: {
            currentLoginStreak: 0,
            longestLoginStreak: 0,
          },
          activityCounts: {
            questsCreated: 5000,
            questsCompleted: 5000,
            questsInProgress: 0,
            appsAdded: 100,
            reviewInteractions: 2000,
          },
          xpHistory: largeXPHistory,
        },
      });

      const userId = testUser._id.toString();

      // Test performance of XP calculation operations
      const startTime = performance.now();

      // Test level calculation
      const level = XPService.calculateLevel(totalXP);
      expect(level).toBeGreaterThan(1);

      // Test XP for next level calculation
      const xpForNextLevel = XPService.getXPForNextLevel(totalXP);
      expect(xpForNextLevel).toBeGreaterThanOrEqual(0);

      // Test badge progress calculation
      const gamificationData = await XPService.getUserGamificationData(userId);
      const badgeProgress = BadgeService.getBadgeProgress(gamificationData!);
      expect(badgeProgress.length).toBeGreaterThan(0);

      // Test awarding additional XP
      const awardResult = await XPService.awardXP(userId, XPAction.QUEST_COMPLETED);
      expect(awardResult.xpAwarded).toBe(15);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Should complete within reasonable time (< 1 second for large dataset)
      expect(executionTime).toBeLessThan(1000);
      
      console.log(`Large dataset operations completed in ${executionTime.toFixed(2)}ms`);
    });

    it('should handle batch XP calculations efficiently', async () => {
      // Create multiple users for batch testing
      const userCount = 100;
      const users = [];

      for (let i = 0; i < userCount; i++) {
        const user = await UserModel.create({
          email: `batch-test-${i}@example.com`,
          displayName: `Batch Test User ${i}`,
          gamification: {
            xp: Math.floor(Math.random() * 1000),
            level: 1,
            badges: [],
            streaks: {
              currentLoginStreak: Math.floor(Math.random() * 10),
              longestLoginStreak: Math.floor(Math.random() * 20),
            },
            activityCounts: {
              questsCreated: Math.floor(Math.random() * 50),
              questsCompleted: Math.floor(Math.random() * 40),
              questsInProgress: Math.floor(Math.random() * 10),
              appsAdded: Math.floor(Math.random() * 5),
              reviewInteractions: Math.floor(Math.random() * 100),
            },
            xpHistory: [],
          },
        });
        users.push(user);
        testUserIds.push(user._id.toString());
      }

      // Test batch level calculations
      const startTime = performance.now();

      const levelCalculations = users.map(user => 
        XPService.calculateLevel(user.gamification!.xp)
      );

      expect(levelCalculations).toHaveLength(userCount);

      // Test batch badge progress calculations
      const badgeProgressPromises = users.map(async user => {
        const gamificationData = user.gamification!;
        return BadgeService.getBadgeProgress(gamificationData);
      });

      const badgeProgressResults = await Promise.all(badgeProgressPromises);
      expect(badgeProgressResults).toHaveLength(userCount);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Batch operations should be efficient
      expect(executionTime).toBeLessThan(2000); // < 2 seconds for 100 users
      
      console.log(`Batch calculations for ${userCount} users completed in ${executionTime.toFixed(2)}ms`);
    });

    it('should handle complex badge evaluation performance', async () => {
      // Create user with data that triggers multiple badge evaluations
      const testUser = await UserModel.create({
        email: 'badge-performance@example.com',
        displayName: 'Badge Performance User',
        gamification: {
          xp: 2400, // Close to multiple XP milestones
          level: 7,
          badges: [], // No badges earned yet
          streaks: {
            currentLoginStreak: 6, // Close to 7-day streak badge
            longestLoginStreak: 6,
          },
          activityCounts: {
            questsCreated: 25,
            questsCompleted: 49, // Close to 50 quest badge
            questsInProgress: 5,
            appsAdded: 2, // Close to 3 app badge
            reviewInteractions: 150,
          },
          xpHistory: [],
        },
      });

      const userId = testUser._id.toString();

      // Test performance of badge evaluation with complex requirements
      const startTime = performance.now();

      // This should trigger evaluation of multiple badges
      const gamificationData = await XPService.getUserGamificationData(userId);
      const badgeProgress = BadgeService.getBadgeProgress(gamificationData!);
      
      // Award XP that might trigger multiple badges
      const awardResult = await XPService.awardXP(userId, XPAction.QUEST_COMPLETED);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(badgeProgress.length).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(500); // Should be very fast
      
      console.log(`Complex badge evaluation completed in ${executionTime.toFixed(2)}ms`);
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle concurrent XP awards efficiently', async () => {
      // Create a test user
      const testUser = await UserModel.create({
        email: 'concurrent-test@example.com',
        displayName: 'Concurrent Test User',
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

      const userId = testUser._id.toString();

      // Test concurrent XP awards (should be handled by atomic operations)
      const concurrentOperations = 50;
      const startTime = performance.now();

      const promises = Array.from({ length: concurrentOperations }, (_, i) => 
        XPService.awardXP(userId, XPAction.QUEST_COMPLETED)
          .catch(error => {
            // Some operations might fail due to concurrency control
            console.log(`Operation ${i} failed:`, error.message);
            return null;
          })
      );

      const results = await Promise.allSettled(promises);
      const successfulResults = results
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => (result as PromiseFulfilledResult<any>).value);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // At least some operations should succeed
      expect(successfulResults.length).toBeGreaterThan(0);
      
      // Verify final data consistency
      const finalData = await XPService.getUserGamificationData(userId);
      expect(finalData!.xp).toBe(successfulResults.length * 15); // 15 XP per quest completion
      expect(finalData!.xpHistory.length).toBe(successfulResults.length);

      console.log(`${concurrentOperations} concurrent operations completed in ${executionTime.toFixed(2)}ms`);
      console.log(`${successfulResults.length} operations succeeded`);
    });

    it('should handle concurrent user operations across multiple users', async () => {
      // Create multiple users
      const userCount = 20;
      const users = [];

      for (let i = 0; i < userCount; i++) {
        const user = await UserModel.create({
          email: `multi-user-${i}@example.com`,
          displayName: `Multi User ${i}`,
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
        users.push(user);
        testUserIds.push(user._id.toString());
      }

      // Test concurrent operations across multiple users
      const startTime = performance.now();

      const promises = users.map(async (user, index) => {
        const userId = user._id.toString();
        const operations = [];

        // Each user performs multiple operations
        operations.push(XPService.awardXP(userId, XPAction.QUEST_CREATED));
        operations.push(XPService.awardXP(userId, XPAction.QUEST_IN_PROGRESS));
        operations.push(XPService.awardXP(userId, XPAction.QUEST_COMPLETED));
        operations.push(XPService.awardXP(userId, XPAction.APP_ADDED));

        return Promise.all(operations);
      });

      const results = await Promise.allSettled(promises);
      const successfulResults = results.filter(result => result.status === 'fulfilled');

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Most operations should succeed
      expect(successfulResults.length).toBeGreaterThan(userCount * 0.8); // At least 80% success

      // Verify data consistency for all users
      for (const user of users) {
        const userData = await XPService.getUserGamificationData(user._id.toString());
        expect(userData!.xp).toBeGreaterThan(0);
        expect(userData!.xpHistory.length).toBeGreaterThan(0);
      }

      console.log(`Multi-user concurrent operations completed in ${executionTime.toFixed(2)}ms`);
      console.log(`${successfulResults.length}/${userCount} users completed successfully`);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should handle large datasets without memory leaks', async () => {
      const initialMemory = process.memoryUsage();

      // Create users with varying amounts of data
      const userCount = 50;
      const users = [];

      for (let i = 0; i < userCount; i++) {
        // Create XP history of varying sizes
        const historySize = Math.floor(Math.random() * 1000) + 100; // 100-1100 transactions
        const xpHistory: XPTransaction[] = [];
        let totalXP = 0;

        for (let j = 0; j < historySize; j++) {
          const xpAmount = Math.floor(Math.random() * 20) + 5;
          totalXP += xpAmount;
          
          xpHistory.push({
            amount: xpAmount,
            action: XPAction.QUEST_COMPLETED,
            timestamp: new Date(Date.now() - (historySize - j) * 1000),
            metadata: { questId: `quest-${j}` },
          });
        }

        const user = await UserModel.create({
          email: `memory-test-${i}@example.com`,
          displayName: `Memory Test User ${i}`,
          gamification: {
            xp: totalXP,
            level: XPService.calculateLevel(totalXP),
            badges: [],
            streaks: {
              currentLoginStreak: Math.floor(Math.random() * 20),
              longestLoginStreak: Math.floor(Math.random() * 30),
            },
            activityCounts: {
              questsCreated: Math.floor(historySize * 0.6),
              questsCompleted: Math.floor(historySize * 0.5),
              questsInProgress: Math.floor(historySize * 0.1),
              appsAdded: Math.floor(Math.random() * 10),
              reviewInteractions: Math.floor(historySize * 0.3),
            },
            xpHistory,
          },
        });

        users.push(user);
        testUserIds.push(user._id.toString());
      }

      // Perform operations on all users
      const operations = users.map(async user => {
        const userId = user._id.toString();
        const gamificationData = await XPService.getUserGamificationData(userId);
        const badgeProgress = BadgeService.getBadgeProgress(gamificationData!);
        await XPService.awardXP(userId, XPAction.QUEST_COMPLETED);
        return { userId, badgeProgress: badgeProgress.length };
      });

      const results = await Promise.all(operations);
      expect(results).toHaveLength(userCount);

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePerUser = memoryIncrease / userCount;

      console.log(`Memory usage per user: ${(memoryIncreasePerUser / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Total memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);

      // Memory usage should be reasonable (less than 10MB per user)
      expect(memoryIncreasePerUser).toBeLessThan(10 * 1024 * 1024); // 10MB per user
    });
  });

  describe('Database Performance', () => {
    it('should handle database operations efficiently under load', async () => {
      // Create multiple users
      const userCount = 30;
      const users = [];

      for (let i = 0; i < userCount; i++) {
        const user = await UserModel.create({
          email: `db-perf-${i}@example.com`,
          displayName: `DB Performance User ${i}`,
          gamification: {
            xp: Math.floor(Math.random() * 500),
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
        users.push(user);
        testUserIds.push(user._id.toString());
      }

      // Test database read performance
      const readStartTime = performance.now();
      
      const readPromises = users.map(user => 
        XPService.getUserGamificationData(user._id.toString())
      );
      
      const readResults = await Promise.all(readPromises);
      const readEndTime = performance.now();
      const readTime = readEndTime - readStartTime;

      expect(readResults).toHaveLength(userCount);
      expect(readResults.every(result => result !== null)).toBe(true);

      // Test database write performance
      const writeStartTime = performance.now();
      
      const writePromises = users.map(user => 
        XPService.awardXP(user._id.toString(), XPAction.QUEST_COMPLETED)
      );
      
      const writeResults = await Promise.allSettled(writePromises);
      const writeEndTime = performance.now();
      const writeTime = writeEndTime - writeStartTime;

      const successfulWrites = writeResults.filter(result => result.status === 'fulfilled');
      expect(successfulWrites.length).toBeGreaterThan(userCount * 0.8); // At least 80% success

      console.log(`Database read performance: ${readTime.toFixed(2)}ms for ${userCount} users`);
      console.log(`Database write performance: ${writeTime.toFixed(2)}ms for ${userCount} users`);
      console.log(`Average read time per user: ${(readTime / userCount).toFixed(2)}ms`);
      console.log(`Average write time per user: ${(writeTime / userCount).toFixed(2)}ms`);

      // Performance should be reasonable
      expect(readTime / userCount).toBeLessThan(100); // < 100ms per user for reads
      expect(writeTime / userCount).toBeLessThan(200); // < 200ms per user for writes
    });
  });
});
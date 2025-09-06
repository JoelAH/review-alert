/**
 * End-to-End Gamification Tests
 * Tests complete user action to XP award flow across the entire system
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';
import UserModel from '@/lib/models/server/user';
import { XPService } from '@/lib/services/xp';
import { BadgeService } from '@/lib/services/badges';
import { GamificationPersistenceService } from '@/lib/services/gamificationPersistence';
import { XPAction, BadgeCategory, GamificationData } from '@/types/gamification';

// Mock Next.js request/response for API testing
class MockNextRequest extends NextRequest {
  constructor(url: string, init?: RequestInit) {
    super(url, init);
  }
}

describe('Gamification System E2E Tests', () => {
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
      email: 'test@example.com',
      displayName: 'Test User',
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

  describe('Complete User Journey: Quest Creation to Badge Award', () => {
    it('should award XP and badges for complete quest workflow', async () => {
      // Step 1: User creates their first quest (10 XP)
      const createResult = await XPService.awardXP(testUserId, XPAction.QUEST_CREATED);
      expect(createResult.xpAwarded).toBe(10);
      expect(createResult.totalXP).toBe(10);
      expect(createResult.levelUp).toBe(false);

      // Step 2: User moves quest to in progress (5 XP)
      const progressResult = await XPService.awardXP(testUserId, XPAction.QUEST_IN_PROGRESS);
      expect(progressResult.xpAwarded).toBe(5);
      expect(progressResult.totalXP).toBe(15);

      // Step 3: User completes the quest (15 XP)
      const completeResult = await XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED);
      expect(completeResult.xpAwarded).toBe(15);
      expect(completeResult.totalXP).toBe(30);

      // Step 4: User adds an app to track (20 XP)
      const appResult = await XPService.awardXP(testUserId, XPAction.APP_ADDED);
      expect(appResult.xpAwarded).toBe(20);
      expect(appResult.totalXP).toBe(50);

      // Step 5: User interacts with reviews (8 XP each)
      const reviewResult1 = await XPService.awardXP(testUserId, XPAction.REVIEW_INTERACTION);
      const reviewResult2 = await XPService.awardXP(testUserId, XPAction.REVIEW_INTERACTION);
      expect(reviewResult2.totalXP).toBe(66);

      // Step 6: Complete more quests to reach 100 XP for first badge
      let currentXP = 66;
      while (currentXP < 100) {
        const result = await XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED);
        currentXP = result.totalXP;
        
        // Should earn "Getting Started" badge at 100 XP
        if (currentXP >= 100 && result.badgesEarned.length > 0) {
          expect(result.badgesEarned[0].id).toBe('getting-started');
          expect(result.badgesEarned[0].name).toBe('Getting Started');
          expect(result.badgesEarned[0].category).toBe(BadgeCategory.MILESTONE);
          break;
        }
      }

      // Verify final state
      const finalData = await XPService.getUserGamificationData(testUserId);
      expect(finalData).not.toBeNull();
      expect(finalData!.xp).toBeGreaterThanOrEqual(100);
      expect(finalData!.level).toBe(2); // Should have leveled up
      expect(finalData!.badges).toHaveLength(1);
      expect(finalData!.activityCounts.questsCreated).toBeGreaterThan(0);
      expect(finalData!.activityCounts.questsCompleted).toBeGreaterThan(0);
      expect(finalData!.xpHistory.length).toBeGreaterThan(5);
    });

    it('should handle login streak progression and bonus XP', async () => {
      // Day 1: First login
      let streakResult = await XPService.updateLoginStreak(testUserId);
      expect(streakResult).toBeNull(); // No bonus for first login

      // Verify streak was recorded
      let userData = await XPService.getUserGamificationData(testUserId);
      expect(userData!.streaks.currentLoginStreak).toBe(1);

      // Simulate consecutive days by manually updating last login date
      const user = await UserModel.findById(testUserId);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      user!.gamification!.streaks.lastLoginDate = yesterday;
      await user!.save();

      // Day 2: Consecutive login
      streakResult = await XPService.updateLoginStreak(testUserId);
      expect(streakResult).toBeNull(); // No bonus yet

      userData = await XPService.getUserGamificationData(testUserId);
      expect(userData!.streaks.currentLoginStreak).toBe(2);

      // Day 3: Should get streak bonus (5 XP)
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);
      twoDaysAgo.setHours(0, 0, 0, 0);
      
      const updatedUser = await UserModel.findById(testUserId);
      updatedUser!.gamification!.streaks.lastLoginDate = twoDaysAgo;
      await updatedUser!.save();

      streakResult = await XPService.updateLoginStreak(testUserId);
      expect(streakResult).not.toBeNull();
      expect(streakResult!.xpAwarded).toBe(5);

      userData = await XPService.getUserGamificationData(testUserId);
      expect(userData!.streaks.currentLoginStreak).toBe(3);
      expect(userData!.xp).toBe(5); // Bonus XP awarded
    });

    it('should handle multiple badge requirements and complex scenarios', async () => {
      // Create scenario where user earns multiple badges
      
      // First, get user to 500 XP for Quest Explorer badge
      let currentXP = 0;
      while (currentXP < 500) {
        const result = await XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED);
        currentXP = result.totalXP;
      }

      // Should have earned Getting Started (100 XP) and Quest Explorer (500 XP)
      const userData = await XPService.getUserGamificationData(testUserId);
      expect(userData!.badges.length).toBeGreaterThanOrEqual(2);
      
      const badgeIds = userData!.badges.map(b => b.id);
      expect(badgeIds).toContain('getting-started');
      expect(badgeIds).toContain('quest-explorer');

      // Now work towards Quest Warrior badge (10 completed quests)
      const questsCompleted = userData!.activityCounts.questsCompleted;
      const questsNeeded = Math.max(0, 10 - questsCompleted);
      
      for (let i = 0; i < questsNeeded; i++) {
        await XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED);
      }

      const finalData = await XPService.getUserGamificationData(testUserId);
      expect(finalData!.activityCounts.questsCompleted).toBeGreaterThanOrEqual(10);
      
      // Check if Quest Warrior badge was awarded
      const finalBadgeIds = finalData!.badges.map(b => b.id);
      expect(finalBadgeIds).toContain('quest-warrior');
    });
  });

  describe('API Integration Flow', () => {
    it('should handle complete API workflow from quest creation to gamification update', async () => {
      // This would typically test the actual API routes, but we'll simulate the flow
      
      // Step 1: Simulate quest creation API call
      const questCreationResult = await XPService.awardXP(testUserId, XPAction.QUEST_CREATED);
      expect(questCreationResult.xpAwarded).toBe(10);

      // Step 2: Simulate quest update API call
      const questUpdateResult = await XPService.awardXP(testUserId, XPAction.QUEST_IN_PROGRESS);
      expect(questUpdateResult.totalXP).toBe(15);

      // Step 3: Simulate quest completion API call
      const questCompleteResult = await XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED);
      expect(questCompleteResult.totalXP).toBe(30);

      // Step 4: Verify gamification data can be retrieved
      const gamificationData = await XPService.getUserGamificationData(testUserId);
      expect(gamificationData).not.toBeNull();
      expect(gamificationData!.xp).toBe(30);
      expect(gamificationData!.activityCounts.questsCreated).toBe(1);
      expect(gamificationData!.activityCounts.questsInProgress).toBe(1);
      expect(gamificationData!.activityCounts.questsCompleted).toBe(1);
      expect(gamificationData!.xpHistory).toHaveLength(3);
    });

    it('should handle error scenarios and recovery', async () => {
      // Test error handling in the complete flow
      
      // Try to award XP to non-existent user
      await expect(
        XPService.awardXP('nonexistent', XPAction.QUEST_CREATED)
      ).rejects.toThrow();

      // Verify original user data is unchanged
      const userData = await XPService.getUserGamificationData(testUserId);
      expect(userData!.xp).toBe(0);

      // Test recovery after error
      const result = await XPService.awardXP(testUserId, XPAction.QUEST_CREATED);
      expect(result.xpAwarded).toBe(10);
    });
  });

  describe('Data Consistency and Persistence', () => {
    it('should maintain data consistency across multiple operations', async () => {
      // Perform multiple operations and verify consistency
      const operations = [
        XPAction.QUEST_CREATED,
        XPAction.QUEST_IN_PROGRESS,
        XPAction.QUEST_COMPLETED,
        XPAction.APP_ADDED,
        XPAction.REVIEW_INTERACTION,
      ];

      let expectedXP = 0;
      const expectedXPValues = {
        [XPAction.QUEST_CREATED]: 10,
        [XPAction.QUEST_IN_PROGRESS]: 5,
        [XPAction.QUEST_COMPLETED]: 15,
        [XPAction.APP_ADDED]: 20,
        [XPAction.REVIEW_INTERACTION]: 8,
      };

      for (const action of operations) {
        const result = await XPService.awardXP(testUserId, action);
        expectedXP += expectedXPValues[action];
        expect(result.totalXP).toBe(expectedXP);
      }

      // Verify final state matches expectations
      const finalData = await XPService.getUserGamificationData(testUserId);
      expect(finalData!.xp).toBe(expectedXP);
      expect(finalData!.level).toBe(XPService.calculateLevel(expectedXP));
      expect(finalData!.xpHistory).toHaveLength(operations.length);

      // Verify activity counts
      expect(finalData!.activityCounts.questsCreated).toBe(1);
      expect(finalData!.activityCounts.questsInProgress).toBe(1);
      expect(finalData!.activityCounts.questsCompleted).toBe(1);
      expect(finalData!.activityCounts.appsAdded).toBe(1);
      expect(finalData!.activityCounts.reviewInteractions).toBe(1);
    });

    it('should handle database reconnection and data recovery', async () => {
      // Award some XP
      await XPService.awardXP(testUserId, XPAction.QUEST_CREATED);
      
      // Simulate database disconnection and reconnection
      await mongoose.disconnect();
      await mongoose.connect(mongoServer.getUri());

      // Verify data persisted through reconnection
      const userData = await XPService.getUserGamificationData(testUserId);
      expect(userData!.xp).toBe(10);
      expect(userData!.activityCounts.questsCreated).toBe(1);
    });
  });

  describe('Badge System Integration', () => {
    it('should correctly evaluate complex badge requirements', async () => {
      // Test badge evaluation with multiple requirements
      
      // Get user to a state where they're close to multiple badges
      // 1. Get to 95 XP (close to Getting Started badge at 100 XP)
      let currentXP = 0;
      while (currentXP < 95) {
        const result = await XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED);
        currentXP = result.totalXP;
      }

      // 2. Get to 9 completed quests (close to Quest Warrior at 10)
      const userData = await XPService.getUserGamificationData(testUserId);
      const questsCompleted = userData!.activityCounts.questsCompleted;
      const questsNeeded = Math.max(0, 9 - questsCompleted);
      
      for (let i = 0; i < questsNeeded; i++) {
        await XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED);
      }

      // 3. Add 2 apps (close to App Collector at 3)
      await XPService.awardXP(testUserId, XPAction.APP_ADDED);
      await XPService.awardXP(testUserId, XPAction.APP_ADDED);

      // Now complete one more quest - should trigger multiple badges
      const finalResult = await XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED);
      
      // Verify final state
      const finalData = await XPService.getUserGamificationData(testUserId);
      expect(finalData!.xp).toBeGreaterThanOrEqual(100);
      expect(finalData!.activityCounts.questsCompleted).toBeGreaterThanOrEqual(10);
      
      // Should have earned multiple badges
      const badgeIds = finalData!.badges.map(b => b.id);
      expect(badgeIds).toContain('getting-started');
      expect(badgeIds).toContain('quest-warrior');
    });

    it('should prevent duplicate badge awards', async () => {
      // Award XP to earn a badge
      let currentXP = 0;
      while (currentXP < 100) {
        const result = await XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED);
        currentXP = result.totalXP;
      }

      const userData = await XPService.getUserGamificationData(testUserId);
      const initialBadgeCount = userData!.badges.length;
      expect(initialBadgeCount).toBeGreaterThan(0);

      // Award more XP - should not duplicate badges
      await XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED);
      
      const finalData = await XPService.getUserGamificationData(testUserId);
      
      // Badge count should not increase for already earned badges
      const gettingStartedBadges = finalData!.badges.filter(b => b.id === 'getting-started');
      expect(gettingStartedBadges).toHaveLength(1);
    });
  });

  describe('Level Progression', () => {
    it('should handle level progression correctly across multiple levels', async () => {
      const levelThresholds = XPService.getLevelThresholds();
      
      // Test progression through first few levels
      for (let targetLevel = 2; targetLevel <= 4; targetLevel++) {
        const targetXP = levelThresholds[targetLevel - 1];
        
        // Award XP to reach target level
        let currentXP = 0;
        let levelUpDetected = false;
        
        while (currentXP < targetXP) {
          const result = await XPService.awardXP(testUserId, XPAction.QUEST_COMPLETED);
          currentXP = result.totalXP;
          
          if (result.levelUp && result.newLevel === targetLevel) {
            levelUpDetected = true;
          }
        }

        expect(levelUpDetected).toBe(true);
        
        const userData = await XPService.getUserGamificationData(testUserId);
        expect(userData!.level).toBe(targetLevel);
        expect(userData!.xp).toBeGreaterThanOrEqual(targetXP);
      }
    });
  });
});
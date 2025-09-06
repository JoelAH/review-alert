/**
 * Unit tests for XP Service
 * Tests XP calculation, level progression, and core logic
 */

import { XPService } from '../xp';
import { XPAction } from '@/types/gamification';

describe('XPService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateLevel', () => {
    it('should return level 1 for 0 XP', () => {
      expect(XPService.calculateLevel(0)).toBe(1);
    });

    it('should return level 1 for XP below first threshold', () => {
      expect(XPService.calculateLevel(50)).toBe(1);
      expect(XPService.calculateLevel(99)).toBe(1);
    });

    it('should return level 2 for XP at first threshold', () => {
      expect(XPService.calculateLevel(100)).toBe(2);
      expect(XPService.calculateLevel(150)).toBe(2);
      expect(XPService.calculateLevel(249)).toBe(2);
    });

    it('should return level 3 for XP at second threshold', () => {
      expect(XPService.calculateLevel(250)).toBe(3);
      expect(XPService.calculateLevel(300)).toBe(3);
      expect(XPService.calculateLevel(499)).toBe(3);
    });

    it('should return correct levels for higher XP amounts', () => {
      expect(XPService.calculateLevel(500)).toBe(4);
      expect(XPService.calculateLevel(1000)).toBe(5);
      expect(XPService.calculateLevel(1750)).toBe(6);
      expect(XPService.calculateLevel(2750)).toBe(7);
      expect(XPService.calculateLevel(4000)).toBe(8);
      expect(XPService.calculateLevel(5500)).toBe(9);
      expect(XPService.calculateLevel(7500)).toBe(10);
      expect(XPService.calculateLevel(10000)).toBe(11);
    });

    it('should return max level for XP above highest threshold', () => {
      expect(XPService.calculateLevel(15000)).toBe(11);
      expect(XPService.calculateLevel(50000)).toBe(11);
    });

    it('should return level 1 for negative XP', () => {
      expect(XPService.calculateLevel(-100)).toBe(1);
    });
  });

  describe('getXPForNextLevel', () => {
    it('should return correct XP needed for next level from level 1', () => {
      expect(XPService.getXPForNextLevel(0)).toBe(100);
      expect(XPService.getXPForNextLevel(50)).toBe(50);
      expect(XPService.getXPForNextLevel(99)).toBe(1);
    });

    it('should return correct XP needed for next level from level 2', () => {
      expect(XPService.getXPForNextLevel(100)).toBe(150);
      expect(XPService.getXPForNextLevel(150)).toBe(100);
      expect(XPService.getXPForNextLevel(249)).toBe(1);
    });

    it('should return correct XP needed for higher levels', () => {
      expect(XPService.getXPForNextLevel(250)).toBe(250); // 500 - 250
      expect(XPService.getXPForNextLevel(500)).toBe(500); // 1000 - 500
      expect(XPService.getXPForNextLevel(1000)).toBe(750); // 1750 - 1000
    });

    it('should return 0 for max level', () => {
      expect(XPService.getXPForNextLevel(10000)).toBe(0);
      expect(XPService.getXPForNextLevel(15000)).toBe(0);
    });
  });

  describe('calculateStreakBonus', () => {
    it('should return 0 for streaks less than 3 days', () => {
      expect(XPService.calculateStreakBonus(0)).toBe(0);
      expect(XPService.calculateStreakBonus(1)).toBe(0);
      expect(XPService.calculateStreakBonus(2)).toBe(0);
    });

    it('should return 5 for 3-6 day streaks', () => {
      expect(XPService.calculateStreakBonus(3)).toBe(5);
      expect(XPService.calculateStreakBonus(4)).toBe(5);
      expect(XPService.calculateStreakBonus(5)).toBe(5);
      expect(XPService.calculateStreakBonus(6)).toBe(5);
    });

    it('should return 10 for 7-13 day streaks', () => {
      expect(XPService.calculateStreakBonus(7)).toBe(10);
      expect(XPService.calculateStreakBonus(10)).toBe(10);
      expect(XPService.calculateStreakBonus(13)).toBe(10);
    });

    it('should return 15 for 14+ day streaks', () => {
      expect(XPService.calculateStreakBonus(14)).toBe(15);
      expect(XPService.calculateStreakBonus(20)).toBe(15);
      expect(XPService.calculateStreakBonus(100)).toBe(15);
    });
  });

  describe('getXPValues', () => {
    it('should return correct XP values for all actions', () => {
      const xpValues = XPService.getXPValues();
      
      expect(xpValues[XPAction.QUEST_CREATED]).toBe(10);
      expect(xpValues[XPAction.QUEST_IN_PROGRESS]).toBe(5);
      expect(xpValues[XPAction.QUEST_COMPLETED]).toBe(15);
      expect(xpValues[XPAction.APP_ADDED]).toBe(20);
      expect(xpValues[XPAction.REVIEW_INTERACTION]).toBe(8);
      expect(xpValues[XPAction.LOGIN_STREAK_BONUS]).toBe(0);
    });
  });

  describe('getLevelThresholds', () => {
    it('should return correct level thresholds', () => {
      const thresholds = XPService.getLevelThresholds();
      
      expect(thresholds).toEqual([
        0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000
      ]);
    });
  });

  describe('shouldAwardStreakBonus', () => {
    it('should return true for streak milestone days', () => {
      expect(XPService.shouldAwardStreakBonus(3)).toBe(true);
      expect(XPService.shouldAwardStreakBonus(7)).toBe(true);
      expect(XPService.shouldAwardStreakBonus(14)).toBe(true);
    });

    it('should return false for non-milestone days', () => {
      expect(XPService.shouldAwardStreakBonus(1)).toBe(false);
      expect(XPService.shouldAwardStreakBonus(2)).toBe(false);
      expect(XPService.shouldAwardStreakBonus(4)).toBe(false);
      expect(XPService.shouldAwardStreakBonus(5)).toBe(false);
      expect(XPService.shouldAwardStreakBonus(6)).toBe(false);
      expect(XPService.shouldAwardStreakBonus(8)).toBe(false);
      expect(XPService.shouldAwardStreakBonus(10)).toBe(false);
      expect(XPService.shouldAwardStreakBonus(13)).toBe(false);
      expect(XPService.shouldAwardStreakBonus(15)).toBe(false);
      expect(XPService.shouldAwardStreakBonus(20)).toBe(false);
    });

    it('should return false for zero or negative streaks', () => {
      expect(XPService.shouldAwardStreakBonus(0)).toBe(false);
      expect(XPService.shouldAwardStreakBonus(-1)).toBe(false);
    });
  });

  // Note: Database-dependent tests (awardXP, getUserGamificationData, updateLoginStreak) are omitted
  // as they require complex mocking setup. These should be tested in integration tests.
});
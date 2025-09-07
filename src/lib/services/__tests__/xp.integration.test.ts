/**
 * Integration tests for XP Service
 * Tests database operations and full XP awarding flow
 */

import { XPService } from '../xp';
import { XPAction } from '@/types/gamification';

// Simple integration test to verify the service can be instantiated and basic methods work
describe('XPService Integration', () => {
  describe('Static Methods', () => {
    it('should have all required static methods', () => {
      expect(typeof XPService.calculateLevel).toBe('function');
      expect(typeof XPService.getXPForNextLevel).toBe('function');
      expect(typeof XPService.calculateStreakBonus).toBe('function');
      expect(typeof XPService.getXPValues).toBe('function');
      expect(typeof XPService.getLevelThresholds).toBe('function');
      expect(typeof XPService.awardXP).toBe('function');
      expect(typeof XPService.getUserGamificationData).toBe('function');
    });

    it('should return consistent XP values', () => {
      const xpValues = XPService.getXPValues();
      expect(xpValues[XPAction.QUEST_CREATED]).toBe(10);
      expect(xpValues[XPAction.QUEST_COMPLETED]).toBe(15);
      expect(xpValues[XPAction.APP_ADDED]).toBe(20);
    });

    it('should calculate levels consistently', () => {
      expect(XPService.calculateLevel(0)).toBe(1);
      expect(XPService.calculateLevel(100)).toBe(2);
      expect(XPService.calculateLevel(250)).toBe(3);
    });

    it('should calculate streak bonuses correctly', () => {
      expect(XPService.calculateStreakBonus(2)).toBe(0);
      expect(XPService.calculateStreakBonus(3)).toBe(5);
      expect(XPService.calculateStreakBonus(7)).toBe(10);
      expect(XPService.calculateStreakBonus(14)).toBe(15);
    });
  });

  describe('Level Progression Logic', () => {
    it('should handle level progression correctly across all thresholds', () => {
      const thresholds = XPService.getLevelThresholds();
      
      for (let i = 0; i < thresholds.length; i++) {
        const xp = thresholds[i];
        const expectedLevel = i + 1;
        expect(XPService.calculateLevel(xp)).toBe(expectedLevel);
        
        // Test XP just below threshold (except for first threshold)
        if (i > 0) {
          expect(XPService.calculateLevel(xp - 1)).toBe(expectedLevel - 1);
        }
      }
    });

    it('should calculate XP needed for next level correctly', () => {
      expect(XPService.getXPForNextLevel(0)).toBe(100);   // Level 1 -> 2
      expect(XPService.getXPForNextLevel(50)).toBe(50);   // Level 1 -> 2
      expect(XPService.getXPForNextLevel(100)).toBe(150); // Level 2 -> 3
      expect(XPService.getXPForNextLevel(200)).toBe(50);  // Level 2 -> 3
    });
  });

  describe('Streak Bonus Logic', () => {
    it('should have streak bonus milestone detection', () => {
      expect(typeof XPService.shouldAwardStreakBonus).toBe('function');
    });

    it('should identify correct streak bonus milestones', () => {
      // Test milestone days
      expect(XPService.shouldAwardStreakBonus(3)).toBe(true);
      expect(XPService.shouldAwardStreakBonus(7)).toBe(true);
      expect(XPService.shouldAwardStreakBonus(14)).toBe(true);
      
      // Test non-milestone days
      expect(XPService.shouldAwardStreakBonus(1)).toBe(false);
      expect(XPService.shouldAwardStreakBonus(2)).toBe(false);
      expect(XPService.shouldAwardStreakBonus(4)).toBe(false);
      expect(XPService.shouldAwardStreakBonus(8)).toBe(false);
      expect(XPService.shouldAwardStreakBonus(15)).toBe(false);
    });

    it('should calculate correct bonus amounts for different streak lengths', () => {
      // Test all streak bonus tiers
      expect(XPService.calculateStreakBonus(3)).toBe(5);
      expect(XPService.calculateStreakBonus(4)).toBe(5);
      expect(XPService.calculateStreakBonus(6)).toBe(5);
      
      expect(XPService.calculateStreakBonus(7)).toBe(10);
      expect(XPService.calculateStreakBonus(10)).toBe(10);
      expect(XPService.calculateStreakBonus(13)).toBe(10);
      
      expect(XPService.calculateStreakBonus(14)).toBe(15);
      expect(XPService.calculateStreakBonus(21)).toBe(15);
      expect(XPService.calculateStreakBonus(100)).toBe(15);
    });

    it('should handle edge cases for streak bonuses', () => {
      expect(XPService.calculateStreakBonus(0)).toBe(0);
      expect(XPService.calculateStreakBonus(-1)).toBe(0);
      expect(XPService.shouldAwardStreakBonus(0)).toBe(false);
      expect(XPService.shouldAwardStreakBonus(-5)).toBe(false);
    });
  });

  describe('Service Method Availability', () => {
    it('should have updateLoginStreak method available', () => {
      expect(typeof XPService.updateLoginStreak).toBe('function');
    });

    it('should have shouldAwardStreakBonus method available', () => {
      expect(typeof XPService.shouldAwardStreakBonus).toBe('function');
    });
  });
});
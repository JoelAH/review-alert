/**
 * Badge Service Integration Tests
 * Tests integration between Badge Service and XP Service
 */

import { BadgeService } from '../badges';
import { XPService } from '../xp';
import { 
  GamificationData, 
  XPAction, 
  BadgeCategory 
} from '@/types/gamification';

// Mock the User model since we're testing service logic
jest.mock('@/lib/models/server/user', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  }
}));

import UserModel from '@/lib/models/server/user';

describe('Badge Service Integration', () => {
  const mockUserId = 'test-user-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Badge awarding through XP Service', () => {
    it('should award badges when XP thresholds are reached', async () => {
      // Mock user with 90 XP (just below Getting Started threshold)
      const mockUser = {
        _id: mockUserId,
        gamification: {
          xp: 90,
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
        }
      };

      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      // Award 15 XP for quest completion (should reach 105 XP total)
      const result = await XPService.awardXP(mockUserId, XPAction.QUEST_COMPLETED);

      // Should award XP and the Getting Started badge
      expect(result.xpAwarded).toBe(15);
      expect(result.totalXP).toBe(105);
      expect(result.badgesEarned).toHaveLength(1);
      expect(result.badgesEarned[0].id).toBe('getting-started');
      expect(result.badgesEarned[0].category).toBe(BadgeCategory.MILESTONE);

      // Verify database update was called with badge included
      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(mockUserId, {
        gamification: expect.objectContaining({
          xp: 105,
          badges: expect.arrayContaining([
            expect.objectContaining({
              id: 'getting-started',
              name: 'Getting Started'
            })
          ])
        })
      });
    });

    it('should award multiple badges when multiple thresholds are crossed', async () => {
      // Mock user with 480 XP (just below Quest Explorer threshold)
      const mockUser = {
        _id: mockUserId,
        gamification: {
          xp: 480,
          level: 4,
          badges: [
            {
              id: 'getting-started',
              name: 'Getting Started',
              description: 'Earned your first 100 XP',
              earnedAt: new Date(),
              category: BadgeCategory.MILESTONE
            }
          ],
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
        }
      };

      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      // Award 20 XP for app addition (should reach 500 XP total)
      const result = await XPService.awardXP(mockUserId, XPAction.APP_ADDED);

      // Should award XP and the Quest Explorer badge
      expect(result.xpAwarded).toBe(20);
      expect(result.totalXP).toBe(500);
      expect(result.badgesEarned).toHaveLength(1);
      expect(result.badgesEarned[0].id).toBe('quest-explorer');
    });

    it('should award activity-based badges when activity counts are reached', async () => {
      // Mock user with 9 completed quests
      const mockUser = {
        _id: mockUserId,
        gamification: {
          xp: 200,
          level: 3,
          badges: [
            {
              id: 'getting-started',
              name: 'Getting Started',
              description: 'Earned your first 100 XP',
              earnedAt: new Date(),
              category: BadgeCategory.MILESTONE
            }
          ],
          streaks: {
            currentLoginStreak: 0,
            longestLoginStreak: 0,
          },
          activityCounts: {
            questsCreated: 10,
            questsCompleted: 9, // Just below Quest Warrior threshold
            questsInProgress: 0,
            appsAdded: 0,
            reviewInteractions: 0,
          },
          xpHistory: [],
        }
      };

      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      // Complete one more quest (should reach 10 completed quests)
      const result = await XPService.awardXP(mockUserId, XPAction.QUEST_COMPLETED);

      // Should award XP and the Quest Warrior badge
      expect(result.xpAwarded).toBe(15);
      expect(result.badgesEarned).toHaveLength(1);
      expect(result.badgesEarned[0].id).toBe('quest-warrior');
      expect(result.badgesEarned[0].category).toBe(BadgeCategory.ACHIEVEMENT);
    });

    it('should not award duplicate badges', async () => {
      // Mock user who already has Getting Started badge
      const mockUser = {
        _id: mockUserId,
        gamification: {
          xp: 150,
          level: 2,
          badges: [
            {
              id: 'getting-started',
              name: 'Getting Started',
              description: 'Earned your first 100 XP',
              earnedAt: new Date(),
              category: BadgeCategory.MILESTONE
            }
          ],
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
        }
      };

      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      // Award more XP (still within same badge tier)
      const result = await XPService.awardXP(mockUserId, XPAction.QUEST_COMPLETED);

      // Should award XP but no new badges
      expect(result.xpAwarded).toBe(15);
      expect(result.totalXP).toBe(165);
      expect(result.badgesEarned).toHaveLength(0);
    });
  });

  describe('Badge progress calculation', () => {
    it('should calculate correct progress for all badge types', () => {
      const gamificationData: GamificationData = {
        xp: 250,
        level: 3,
        badges: [
          {
            id: 'getting-started',
            name: 'Getting Started',
            description: 'Earned your first 100 XP',
            earnedAt: new Date(),
            category: BadgeCategory.MILESTONE
          }
        ],
        streaks: {
          currentLoginStreak: 3,
          longestLoginStreak: 5,
        },
        activityCounts: {
          questsCreated: 5,
          questsCompleted: 7,
          questsInProgress: 2,
          appsAdded: 2,
          reviewInteractions: 10,
        },
        xpHistory: [],
      };

      const progress = BadgeService.getBadgeProgress(gamificationData);

      // Check XP-based badge progress
      const questExplorerProgress = progress.find(p => p.badge.id === 'quest-explorer');
      expect(questExplorerProgress).toEqual({
        badge: expect.objectContaining({ id: 'quest-explorer' }),
        progress: 250,
        target: 500,
        earned: false
      });

      // Check activity-based badge progress
      const questWarriorProgress = progress.find(p => p.badge.id === 'quest-warrior');
      expect(questWarriorProgress).toEqual({
        badge: expect.objectContaining({ id: 'quest-warrior' }),
        progress: 7,
        target: 10,
        earned: false
      });

      // Check streak-based badge progress
      const dedicatedUserProgress = progress.find(p => p.badge.id === 'dedicated-user');
      expect(dedicatedUserProgress).toEqual({
        badge: expect.objectContaining({ id: 'dedicated-user' }),
        progress: 5,
        target: 7,
        earned: false
      });

      // Check earned badge is marked as earned
      const gettingStartedProgress = progress.find(p => p.badge.id === 'getting-started');
      expect(gettingStartedProgress?.earned).toBe(true);
    });
  });

  describe('Badge definitions validation', () => {
    it('should have valid badge definitions that match requirements', () => {
      const definitions = BadgeService.getBadgeDefinitions();
      
      // Verify all required badges exist
      const requiredBadges = [
        'getting-started', 'quest-explorer', 'review-master', 'platform-expert',
        'quest-warrior', 'dedicated-user', 'app-collector', 'quest-legend'
      ];
      
      const definitionIds = definitions.map(d => d.id);
      requiredBadges.forEach(badgeId => {
        expect(definitionIds).toContain(badgeId);
      });

      // Verify badge categories are properly distributed
      const categories = definitions.reduce((acc, badge) => {
        acc[badge.category] = (acc[badge.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(categories[BadgeCategory.MILESTONE]).toBe(4);
      expect(categories[BadgeCategory.ACHIEVEMENT]).toBe(2);
      expect(categories[BadgeCategory.STREAK]).toBe(1);
      expect(categories[BadgeCategory.COLLECTION]).toBe(1);
    });

    it('should have properly structured requirements', () => {
      const definitions = BadgeService.getBadgeDefinitions();
      
      definitions.forEach(badge => {
        expect(badge.requirements).toBeDefined();
        expect(Array.isArray(badge.requirements)).toBe(true);
        expect(badge.requirements.length).toBeGreaterThan(0);
        
        badge.requirements.forEach(requirement => {
          expect(requirement.type).toBeDefined();
          expect(requirement.value).toBeDefined();
          expect(typeof requirement.value).toBe('number');
          
          if (requirement.type === 'activity_count') {
            expect(requirement.field).toBeDefined();
            expect(typeof requirement.field).toBe('string');
          }
        });
      });
    });
  });
});
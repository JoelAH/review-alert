import { formatUser } from '../server/user';
import { GamificationData } from '@/types/gamification';

describe('User Model Gamification', () => {
  it('should format user with default gamification data when none exists', () => {
    const mockUserObject = {
      toObject: () => ({
        _id: 'test-id',
        uid: 'test-uid',
        email: 'test@example.com',
        apps: [],
        createdAt: new Date(),
        updatedAt: new Date()
      })
    };

    const formattedUser = formatUser(mockUserObject);

    expect(formattedUser.gamification).toBeDefined();
    expect(formattedUser.gamification?.xp).toBe(0);
    expect(formattedUser.gamification?.level).toBe(1);
    expect(formattedUser.gamification?.badges).toEqual([]);
    expect(formattedUser.gamification?.streaks.currentLoginStreak).toBe(0);
    expect(formattedUser.gamification?.streaks.longestLoginStreak).toBe(0);
    expect(formattedUser.gamification?.activityCounts.questsCreated).toBe(0);
    expect(formattedUser.gamification?.activityCounts.questsCompleted).toBe(0);
    expect(formattedUser.gamification?.activityCounts.questsInProgress).toBe(0);
    expect(formattedUser.gamification?.activityCounts.appsAdded).toBe(0);
    expect(formattedUser.gamification?.activityCounts.reviewInteractions).toBe(0);
    expect(formattedUser.gamification?.xpHistory).toEqual([]);
  });

  it('should preserve existing gamification data when present', () => {
    const existingGamificationData: GamificationData = {
      xp: 150,
      level: 2,
      badges: [{
        id: 'getting-started',
        name: 'Getting Started',
        description: 'Earned your first 100 XP',
        earnedAt: new Date(),
        category: 'MILESTONE' as any
      }],
      streaks: {
        currentLoginStreak: 5,
        longestLoginStreak: 10,
        lastLoginDate: new Date()
      },
      activityCounts: {
        questsCreated: 3,
        questsCompleted: 2,
        questsInProgress: 1,
        appsAdded: 2,
        reviewInteractions: 5
      },
      xpHistory: [{
        amount: 10,
        action: 'QUEST_CREATED' as any,
        timestamp: new Date()
      }]
    };

    const mockUserObject = {
      toObject: () => ({
        _id: 'test-id',
        uid: 'test-uid',
        email: 'test@example.com',
        apps: [],
        gamification: existingGamificationData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    };

    const formattedUser = formatUser(mockUserObject);

    expect(formattedUser.gamification).toEqual(existingGamificationData);
  });
});
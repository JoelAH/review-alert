/**
 * Gamification Persistence Service Integration Tests
 * Tests atomic operations, error recovery, data validation, and backup/recovery mechanisms
 */

import { 
  GamificationPersistenceService, 
  GamificationError, 
  GamificationErrorType 
} from '../gamificationPersistence';
import { XPAction, GamificationData, BadgeCategory } from '@/types/gamification';
import UserModel from '@/lib/models/server/user';

// Mock the UserModel
jest.mock('@/lib/models/server/user');
const MockedUserModel = UserModel as jest.Mocked<typeof UserModel>;

// Mock the BadgeService
jest.mock('../badges');
import { BadgeService } from '../badges';
const MockedBadgeService = BadgeService as jest.Mocked<typeof BadgeService>;

describe('GamificationPersistenceService', () => {
  const mockUserId = '507f1f77bcf86cd799439011';
  
  // Helper function to create mock user data
  const createMockUser = (gamificationData?: Partial<GamificationData>) => ({
    _id: mockUserId,
    email: 'test@example.com',
    gamification: gamificationData ? {
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
      ...gamificationData
    } : undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Clear active transactions
    (GamificationPersistenceService as any).activeTransactions.clear();
    
    // Setup default mocks
    MockedBadgeService.checkAndAwardBadges.mockResolvedValue([]);
  });

  describe('awardXPAtomic', () => {
    it('should successfully award XP with atomic operations', async () => {
      const mockUser = createMockUser({ xp: 100, level: 2 });
      MockedUserModel.findById.mockResolvedValue(mockUser as any);
      MockedUserModel.findOneAndUpdate.mockResolvedValue({
        ...mockUser,
        gamification: {
          ...mockUser.gamification,
          xp: 115,
          level: 2,
        }
      } as any);

      const result = await GamificationPersistenceService.awardXPAtomic(
        mockUserId,
        XPAction.QUEST_COMPLETED
      );

      expect(result.xpAwarded).toBe(15);
      expect(result.totalXP).toBe(115);
      expect(result.levelUp).toBe(false);
      expect(MockedUserModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: mockUserId,
          'gamification.xp': 100,
          'gamification.level': 2
        }),
        expect.objectContaining({
          gamification: expect.objectContaining({
            xp: 115,
            level: 2
          })
        }),
        expect.objectContaining({
          new: true,
          runValidators: true
        })
      );
    });

    it('should handle level up correctly', async () => {
      const mockUser = createMockUser({ xp: 95, level: 1 });
      MockedUserModel.findById.mockResolvedValue(mockUser as any);
      MockedUserModel.findOneAndUpdate.mockResolvedValue({
        ...mockUser,
        gamification: {
          ...mockUser.gamification,
          xp: 110,
          level: 2,
        }
      } as any);

      const result = await GamificationPersistenceService.awardXPAtomic(
        mockUserId,
        XPAction.QUEST_COMPLETED
      );

      expect(result.levelUp).toBe(true);
      expect(result.newLevel).toBe(2);
    });

    it('should award badges when requirements are met', async () => {
      const mockUser = createMockUser({ xp: 85, level: 1 });
      const mockBadge = {
        id: 'getting-started',
        name: 'Getting Started',
        description: 'Earned your first 100 XP',
        category: BadgeCategory.MILESTONE,
        earnedAt: new Date()
      };

      MockedUserModel.findById.mockResolvedValue(mockUser as any);
      MockedBadgeService.checkAndAwardBadges.mockResolvedValue([mockBadge]);
      MockedUserModel.findOneAndUpdate.mockResolvedValue({
        ...mockUser,
        gamification: {
          ...mockUser.gamification,
          xp: 100,
          badges: [mockBadge]
        }
      } as any);

      const result = await GamificationPersistenceService.awardXPAtomic(
        mockUserId,
        XPAction.QUEST_COMPLETED
      );

      expect(result.badgesEarned).toHaveLength(1);
      expect(result.badgesEarned[0].id).toBe('getting-started');
    });

    it('should prevent duplicate badges', async () => {
      const existingBadge = {
        id: 'getting-started',
        name: 'Getting Started',
        description: 'Earned your first 100 XP',
        category: BadgeCategory.MILESTONE,
        earnedAt: new Date()
      };
      
      const mockUser = createMockUser({ 
        xp: 85, 
        level: 1,
        badges: [existingBadge]
      });

      MockedUserModel.findById.mockResolvedValue(mockUser as any);
      MockedBadgeService.checkAndAwardBadges.mockResolvedValue([existingBadge]); // Try to award same badge
      MockedUserModel.findOneAndUpdate.mockResolvedValue({
        ...mockUser,
        gamification: {
          ...mockUser.gamification,
          xp: 100,
          badges: [existingBadge] // Should not duplicate
        }
      } as any);

      const result = await GamificationPersistenceService.awardXPAtomic(
        mockUserId,
        XPAction.QUEST_COMPLETED
      );

      expect(result.badgesEarned).toHaveLength(0); // No new badges awarded
    });

    it('should handle concurrent modification errors with retry', async () => {
      const mockUser = createMockUser({ xp: 100, level: 2 });
      MockedUserModel.findById.mockResolvedValue(mockUser as any);
      
      // First call fails due to concurrent modification (returns null)
      MockedUserModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        GamificationPersistenceService.awardXPAtomic(mockUserId, XPAction.QUEST_COMPLETED)
      ).rejects.toThrow(GamificationError);
      
      expect(MockedUserModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: mockUserId,
          'gamification.xp': 100,
          'gamification.level': 2
        }),
        expect.anything(),
        expect.anything()
      );
    });

    it('should prevent concurrent operations on same user', async () => {
      const mockUser = createMockUser({ xp: 100, level: 2 });
      MockedUserModel.findById.mockResolvedValue(mockUser as any);
      MockedUserModel.findOneAndUpdate.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockUser as any), 100))
      );

      // Start first operation
      const firstOperation = GamificationPersistenceService.awardXPAtomic(
        mockUserId,
        XPAction.QUEST_COMPLETED
      );

      // Try to start second operation immediately
      const secondOperation = GamificationPersistenceService.awardXPAtomic(
        mockUserId,
        XPAction.QUEST_CREATED
      );

      // Second operation should fail with concurrency error
      await expect(secondOperation).rejects.toThrow(GamificationError);
      await expect(secondOperation).rejects.toThrow(/Concurrent gamification operation/);

      // First operation should complete
      await expect(firstOperation).resolves.toBeDefined();
    });

    it('should validate XP values and prevent negative XP', async () => {
      const mockUser = createMockUser({ xp: -10, level: 1 }); // Invalid negative XP
      MockedUserModel.findById.mockResolvedValue(mockUser as any);

      await expect(
        GamificationPersistenceService.awardXPAtomic(mockUserId, XPAction.QUEST_COMPLETED)
      ).rejects.toThrow(GamificationError);
    });

    it('should handle user not found error', async () => {
      MockedUserModel.findById.mockResolvedValue(null);

      await expect(
        GamificationPersistenceService.awardXPAtomic(mockUserId, XPAction.QUEST_COMPLETED)
      ).rejects.toThrow(GamificationError);
    });

    it('should update activity counts correctly', async () => {
      const mockUser = createMockUser({ 
        xp: 100, 
        level: 2,
        activityCounts: {
          questsCreated: 5,
          questsCompleted: 3,
          questsInProgress: 2,
          appsAdded: 1,
          reviewInteractions: 10,
        }
      });

      MockedUserModel.findById.mockResolvedValue(mockUser as any);
      MockedUserModel.findOneAndUpdate.mockResolvedValue({
        ...mockUser,
        gamification: {
          ...mockUser.gamification,
          xp: 115,
          activityCounts: {
            ...mockUser.gamification!.activityCounts,
            questsCompleted: 4, // Should increment
          }
        }
      } as any);

      await GamificationPersistenceService.awardXPAtomic(
        mockUserId,
        XPAction.QUEST_COMPLETED
      );

      expect(MockedUserModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          gamification: expect.objectContaining({
            activityCounts: expect.objectContaining({
              questsCompleted: 4
            })
          })
        }),
        expect.anything()
      );
    });
  });

  describe('validateGamificationData', () => {
    it('should pass validation for valid data', () => {
      const validData: GamificationData = {
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
        xpHistory: [
          {
            amount: 10,
            action: XPAction.QUEST_CREATED,
            timestamp: new Date('2024-01-01'),
          },
          {
            amount: 15,
            action: XPAction.QUEST_COMPLETED,
            timestamp: new Date('2024-01-02'),
          }
        ],
      };

      expect(() => {
        GamificationPersistenceService.validateGamificationData(validData);
      }).not.toThrow();
    });

    it('should reject negative XP', () => {
      const invalidData: GamificationData = {
        xp: -10,
        level: 1,
        badges: [],
        streaks: { currentLoginStreak: 0, longestLoginStreak: 0 },
        activityCounts: {
          questsCreated: 0,
          questsCompleted: 0,
          questsInProgress: 0,
          appsAdded: 0,
          reviewInteractions: 0,
        },
        xpHistory: [],
      };

      expect(() => {
        GamificationPersistenceService.validateGamificationData(invalidData);
      }).toThrow(GamificationError);
    });

    it('should reject inconsistent level', () => {
      const invalidData: GamificationData = {
        xp: 150, // Should be level 2
        level: 1, // But level is 1
        badges: [],
        streaks: { currentLoginStreak: 0, longestLoginStreak: 0 },
        activityCounts: {
          questsCreated: 0,
          questsCompleted: 0,
          questsInProgress: 0,
          appsAdded: 0,
          reviewInteractions: 0,
        },
        xpHistory: [],
      };

      expect(() => {
        GamificationPersistenceService.validateGamificationData(invalidData);
      }).toThrow(GamificationError);
    });

    it('should reject negative activity counts', () => {
      const invalidData: GamificationData = {
        xp: 100,
        level: 2,
        badges: [],
        streaks: { currentLoginStreak: 0, longestLoginStreak: 0 },
        activityCounts: {
          questsCreated: -1, // Invalid negative count
          questsCompleted: 0,
          questsInProgress: 0,
          appsAdded: 0,
          reviewInteractions: 0,
        },
        xpHistory: [],
      };

      expect(() => {
        GamificationPersistenceService.validateGamificationData(invalidData);
      }).toThrow(GamificationError);
    });

    it('should reject duplicate badges', () => {
      const duplicateBadge = {
        id: 'getting-started',
        name: 'Getting Started',
        description: 'Test badge',
        category: BadgeCategory.MILESTONE,
        earnedAt: new Date()
      };

      const invalidData: GamificationData = {
        xp: 100,
        level: 2,
        badges: [duplicateBadge, duplicateBadge], // Duplicate badges
        streaks: { currentLoginStreak: 0, longestLoginStreak: 0 },
        activityCounts: {
          questsCreated: 0,
          questsCompleted: 0,
          questsInProgress: 0,
          appsAdded: 0,
          reviewInteractions: 0,
        },
        xpHistory: [],
      };

      expect(() => {
        GamificationPersistenceService.validateGamificationData(invalidData);
      }).toThrow(GamificationError);
    });

    it('should reject unsorted XP history', () => {
      const invalidData: GamificationData = {
        xp: 100,
        level: 2,
        badges: [],
        streaks: { currentLoginStreak: 0, longestLoginStreak: 0 },
        activityCounts: {
          questsCreated: 0,
          questsCompleted: 0,
          questsInProgress: 0,
          appsAdded: 0,
          reviewInteractions: 0,
        },
        xpHistory: [
          {
            amount: 15,
            action: XPAction.QUEST_COMPLETED,
            timestamp: new Date('2024-01-02'), // Later timestamp first
          },
          {
            amount: 10,
            action: XPAction.QUEST_CREATED,
            timestamp: new Date('2024-01-01'), // Earlier timestamp second
          }
        ],
      };

      expect(() => {
        GamificationPersistenceService.validateGamificationData(invalidData);
      }).toThrow(GamificationError);
    });
  });

  describe('getUserGamificationDataSafe', () => {
    it('should return valid gamification data', async () => {
      const mockUser = createMockUser({ xp: 100, level: 2 });
      MockedUserModel.findById.mockResolvedValue(mockUser as any);

      const result = await GamificationPersistenceService.getUserGamificationDataSafe(mockUserId);

      expect(result.xp).toBe(100);
      expect(result.level).toBe(2);
    });

    it('should initialize default data for user without gamification data', async () => {
      const mockUser = createMockUser(); // No gamification data
      MockedUserModel.findById.mockResolvedValue(mockUser as any);
      MockedUserModel.findByIdAndUpdate.mockResolvedValue(mockUser as any);

      const result = await GamificationPersistenceService.getUserGamificationDataSafe(mockUserId);

      expect(result.xp).toBe(0);
      expect(result.level).toBe(1);
      expect(result.badges).toHaveLength(0);
    });

    it('should recover from corrupted data', async () => {
      const corruptedUser = createMockUser({ 
        xp: -100, // Invalid negative XP
        level: 1 
      });
      MockedUserModel.findById.mockResolvedValue(corruptedUser as any);
      MockedUserModel.findByIdAndUpdate.mockResolvedValue(corruptedUser as any);

      const result = await GamificationPersistenceService.getUserGamificationDataSafe(mockUserId);

      // Should return default data after recovery
      expect(result.xp).toBe(0);
      expect(result.level).toBe(1);
      expect(MockedUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          gamification: expect.objectContaining({
            xp: 0,
            level: 1
          })
        })
      );
    });

    it('should retry on database errors', async () => {
      MockedUserModel.findById
        .mockRejectedValueOnce(new Error('Database connection error'))
        .mockResolvedValueOnce(createMockUser({ xp: 100, level: 2 }) as any);

      const result = await GamificationPersistenceService.getUserGamificationDataSafe(mockUserId);

      expect(result.xp).toBe(100);
      expect(MockedUserModel.findById).toHaveBeenCalledTimes(2);
    });

    it('should throw error for non-existent user', async () => {
      MockedUserModel.findById.mockResolvedValue(null);

      await expect(
        GamificationPersistenceService.getUserGamificationDataSafe(mockUserId)
      ).rejects.toThrow(GamificationError);
    });
  });

  describe('createBackup', () => {
    it('should create valid backup', async () => {
      const mockUser = createMockUser({ xp: 100, level: 2 });
      MockedUserModel.findById.mockResolvedValue(mockUser as any);

      const backup = await GamificationPersistenceService.createBackup(mockUserId);

      expect(backup).toBeDefined();
      expect(backup!.userId).toBe(mockUserId);
      expect(backup!.data.xp).toBe(100);
      expect(backup!.checksum).toBeDefined();
      expect(backup!.version).toBe(1);
    });

    it('should return null for user without gamification data', async () => {
      const mockUser = createMockUser(); // No gamification data
      MockedUserModel.findById.mockResolvedValue(mockUser as any);

      const backup = await GamificationPersistenceService.createBackup(mockUserId);

      expect(backup).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      MockedUserModel.findById.mockResolvedValue(null);

      const backup = await GamificationPersistenceService.createBackup(mockUserId);

      expect(backup).toBeNull();
    });
  });

  describe('recoverFromBackup', () => {
    it('should successfully recover from valid backup', async () => {
      const backupData: GamificationData = {
        xp: 100,
        level: 2,
        badges: [],
        streaks: { currentLoginStreak: 0, longestLoginStreak: 0 },
        activityCounts: {
          questsCreated: 1,
          questsCompleted: 1,
          questsInProgress: 0,
          appsAdded: 0,
          reviewInteractions: 0,
        },
        xpHistory: [],
      };

      const backup = {
        userId: mockUserId,
        timestamp: new Date(),
        data: backupData,
        version: 1,
        checksum: (GamificationPersistenceService as any).calculateChecksum(backupData)
      };

      MockedUserModel.findByIdAndUpdate.mockResolvedValue({} as any);

      const result = await GamificationPersistenceService.recoverFromBackup(mockUserId, backup);

      expect(result).toBe(true);
      expect(MockedUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          gamification: backupData
        }),
        expect.objectContaining({
          runValidators: true
        })
      );
    });

    it('should reject backup with invalid checksum', async () => {
      const backupData: GamificationData = {
        xp: 100,
        level: 2,
        badges: [],
        streaks: { currentLoginStreak: 0, longestLoginStreak: 0 },
        activityCounts: {
          questsCreated: 1,
          questsCompleted: 1,
          questsInProgress: 0,
          appsAdded: 0,
          reviewInteractions: 0,
        },
        xpHistory: [],
      };

      const backup = {
        userId: mockUserId,
        timestamp: new Date(),
        data: backupData,
        version: 1,
        checksum: 'invalid-checksum' // Invalid checksum
      };

      await expect(
        GamificationPersistenceService.recoverFromBackup(mockUserId, backup)
      ).rejects.toThrow(GamificationError);
    });

    it('should reject backup with invalid data', async () => {
      const invalidBackupData: GamificationData = {
        xp: -100, // Invalid negative XP
        level: 1,
        badges: [],
        streaks: { currentLoginStreak: 0, longestLoginStreak: 0 },
        activityCounts: {
          questsCreated: 0,
          questsCompleted: 0,
          questsInProgress: 0,
          appsAdded: 0,
          reviewInteractions: 0,
        },
        xpHistory: [],
      };

      const backup = {
        userId: mockUserId,
        timestamp: new Date(),
        data: invalidBackupData,
        version: 1,
        checksum: (GamificationPersistenceService as any).calculateChecksum(invalidBackupData)
      };

      await expect(
        GamificationPersistenceService.recoverFromBackup(mockUserId, backup)
      ).rejects.toThrow(GamificationError);
    });
  });

  describe('resolveDataConflicts', () => {
    it('should resolve conflicts in favor of higher values', () => {
      const localData: GamificationData = {
        xp: 100,
        level: 2,
        badges: [{
          id: 'badge1',
          name: 'Badge 1',
          description: 'First badge',
          category: BadgeCategory.MILESTONE,
          earnedAt: new Date('2024-01-01')
        }],
        streaks: { currentLoginStreak: 3, longestLoginStreak: 5 },
        activityCounts: {
          questsCreated: 5,
          questsCompleted: 3,
          questsInProgress: 2,
          appsAdded: 1,
          reviewInteractions: 10,
        },
        xpHistory: [
          {
            amount: 10,
            action: XPAction.QUEST_CREATED,
            timestamp: new Date('2024-01-01'),
          }
        ],
      };

      const remoteData: GamificationData = {
        xp: 150, // Higher XP
        level: 2,
        badges: [{
          id: 'badge2',
          name: 'Badge 2',
          description: 'Second badge',
          category: BadgeCategory.ACHIEVEMENT,
          earnedAt: new Date('2024-01-02')
        }],
        streaks: { currentLoginStreak: 2, longestLoginStreak: 7 }, // Higher longest streak
        activityCounts: {
          questsCreated: 3,
          questsCompleted: 5, // Higher completed count
          questsInProgress: 1,
          appsAdded: 2, // Higher apps added
          reviewInteractions: 8,
        },
        xpHistory: [
          {
            amount: 15,
            action: XPAction.QUEST_COMPLETED,
            timestamp: new Date('2024-01-02'),
          }
        ],
      };

      const resolved = GamificationPersistenceService.resolveDataConflicts(localData, remoteData);

      expect(resolved.xp).toBe(150); // Higher XP
      expect(resolved.level).toBe(2); // Calculated from XP
      expect(resolved.badges).toHaveLength(2); // Both badges
      expect(resolved.streaks.currentLoginStreak).toBe(3); // Higher current streak
      expect(resolved.streaks.longestLoginStreak).toBe(7); // Higher longest streak
      expect(resolved.activityCounts.questsCompleted).toBe(5); // Higher completed count
      expect(resolved.activityCounts.appsAdded).toBe(2); // Higher apps added
      expect(resolved.xpHistory).toHaveLength(2); // Merged and sorted
    });

    it('should merge unique badges without duplicates', () => {
      const sharedBadge = {
        id: 'shared-badge',
        name: 'Shared Badge',
        description: 'Badge in both datasets',
        category: BadgeCategory.MILESTONE,
        earnedAt: new Date('2024-01-01')
      };

      const localData: GamificationData = {
        xp: 100,
        level: 2,
        badges: [
          sharedBadge,
          {
            id: 'local-badge',
            name: 'Local Badge',
            description: 'Local only badge',
            category: BadgeCategory.ACHIEVEMENT,
            earnedAt: new Date('2024-01-02')
          }
        ],
        streaks: { currentLoginStreak: 0, longestLoginStreak: 0 },
        activityCounts: {
          questsCreated: 0,
          questsCompleted: 0,
          questsInProgress: 0,
          appsAdded: 0,
          reviewInteractions: 0,
        },
        xpHistory: [],
      };

      const remoteData: GamificationData = {
        xp: 100,
        level: 2,
        badges: [
          sharedBadge, // Same badge
          {
            id: 'remote-badge',
            name: 'Remote Badge',
            description: 'Remote only badge',
            category: BadgeCategory.STREAK,
            earnedAt: new Date('2024-01-03')
          }
        ],
        streaks: { currentLoginStreak: 0, longestLoginStreak: 0 },
        activityCounts: {
          questsCreated: 0,
          questsCompleted: 0,
          questsInProgress: 0,
          appsAdded: 0,
          reviewInteractions: 0,
        },
        xpHistory: [],
      };

      const resolved = GamificationPersistenceService.resolveDataConflicts(localData, remoteData);

      expect(resolved.badges).toHaveLength(3); // No duplicates
      const badgeIds = resolved.badges.map(b => b.id);
      expect(badgeIds).toContain('shared-badge');
      expect(badgeIds).toContain('local-badge');
      expect(badgeIds).toContain('remote-badge');
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors with retry', async () => {
      // Mock the backup creation to fail initially, then succeed
      const mockUser = createMockUser({ xp: 100, level: 2 });
      MockedUserModel.findById
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValueOnce(mockUser as any); // For backup creation
      
      MockedUserModel.findOneAndUpdate.mockResolvedValue({
        ...mockUser,
        gamification: { ...mockUser.gamification, xp: 115, level: 2 }
      } as any);

      // The operation should eventually succeed after retry
      const result = await GamificationPersistenceService.awardXPAtomic(
        mockUserId,
        XPAction.QUEST_COMPLETED
      );

      expect(result.xpAwarded).toBe(15);
    });

    it('should eventually fail after max retries', async () => {
      // Mock persistent failure for backup creation
      MockedUserModel.findById.mockRejectedValue(new Error('Persistent database error'));

      await expect(
        GamificationPersistenceService.awardXPAtomic(mockUserId, XPAction.QUEST_COMPLETED)
      ).rejects.toThrow(GamificationError);

      // The exact number of calls depends on the retry logic in executeTransaction
      expect(MockedUserModel.findById).toHaveBeenCalled();
    });
  });
});
// Mock the database connection and User model
jest.mock('@/lib/db/db', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({}),
}));

jest.mock('mongoose', () => ({
  models: {
    User: {
      find: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn(),
    },
  },
  model: jest.fn().mockReturnValue({
    find: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
  }),
  Schema: jest.fn(),
}));

import { migrateGamificationData, rollbackGamificationData } from '../001-add-gamification-data';

describe('Gamification Migration', () => {
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    
    const mongoose = require('mongoose');
    mockUser = mongoose.models.User || mongoose.model();
  });

  describe('migrateGamificationData', () => {
    it('should initialize gamification data for users without it', async () => {
      const mockUsersWithoutGamification = [
        { _id: 'user1', apps: [{ store: 'GooglePlay' }, { store: 'AppleStore' }] },
        { _id: 'user2', apps: [] },
      ];

      mockUser.find.mockResolvedValue(mockUsersWithoutGamification);
      mockUser.updateOne.mockResolvedValue({ acknowledged: true });

      const result = await migrateGamificationData();

      expect(result.success).toBe(true);
      expect(result.usersUpdated).toBe(2);
      expect(mockUser.find).toHaveBeenCalledWith({
        $or: [
          { gamification: { $exists: false } },
          { gamification: null }
        ]
      });
      expect(mockUser.updateOne).toHaveBeenCalledTimes(2);
      
      // Check that the first user's gamification data includes their app count
      const firstUpdateCall = mockUser.updateOne.mock.calls[0];
      expect(firstUpdateCall[1].$set.gamification.activityCounts.appsAdded).toBe(2);
      
      // Check that the second user's gamification data has 0 apps
      const secondUpdateCall = mockUser.updateOne.mock.calls[1];
      expect(secondUpdateCall[1].$set.gamification.activityCounts.appsAdded).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      mockUser.find.mockRejectedValue(new Error('Database error'));

      await expect(migrateGamificationData()).rejects.toThrow('Database error');
      expect(console.error).toHaveBeenCalledWith('Error during gamification migration:', expect.any(Error));
    });
  });

  describe('rollbackGamificationData', () => {
    it('should remove gamification data from all users', async () => {
      mockUser.updateMany.mockResolvedValue({ modifiedCount: 5 });

      const result = await rollbackGamificationData();

      expect(result.success).toBe(true);
      expect(result.usersUpdated).toBe(5);
      expect(mockUser.updateMany).toHaveBeenCalledWith(
        {},
        { 
          $unset: { gamification: "" },
          $set: { updatedAt: expect.any(Date) }
        }
      );
    });

    it('should handle errors gracefully', async () => {
      mockUser.updateMany.mockRejectedValue(new Error('Database error'));

      await expect(rollbackGamificationData()).rejects.toThrow('Database error');
      expect(console.error).toHaveBeenCalledWith('Error during gamification rollback:', expect.any(Error));
    });
  });
});
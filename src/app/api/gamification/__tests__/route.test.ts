/**
 * @jest-environment node
 */

// Polyfills for Node.js environment
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import { NextRequest } from 'next/server';
import { GET } from '../route';
import { POST } from '../award-xp/route';
import { cookies } from 'next/headers';
import { auth } from 'firebase-admin';
import dbConnect from '@/lib/db/db';
import UserModel from '@/lib/models/server/user';
import { XPAction, BadgeCategory } from '@/types/gamification';
import { XPService } from '@/lib/services/xp';
import { BadgeService } from '@/lib/services/badges';

// Mock dependencies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('firebase-admin', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/firebase/admin.config', () => ({
  initAdminApp: jest.fn(),
}));

jest.mock('@/lib/db/db', () => jest.fn());

jest.mock('@/lib/models/server/user', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock('@/lib/constants', () => ({
  __esModule: true,
  default: {
    sessionCookieName: 'session',
  },
}));

jest.mock('@/lib/services/xp', () => ({
  XPService: {
    getUserGamificationData: jest.fn(),
    getXPForNextLevel: jest.fn(),
    getLevelThresholds: jest.fn(),
    awardXP: jest.fn(),
  },
}));

jest.mock('@/lib/services/badges', () => ({
  BadgeService: {
    getBadgeProgress: jest.fn(),
  },
}));

const mockCookies = cookies as jest.MockedFunction<typeof cookies>;
const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockXPService = XPService as jest.Mocked<typeof XPService>;
const mockBadgeService = BadgeService as jest.Mocked<typeof BadgeService>;

// Mock user data
const mockUser = {
  _id: 'user123',
  uid: 'firebase-uid-123',
  email: 'test@example.com',
  gamification: {
    xp: 150,
    level: 2,
    badges: [
      {
        id: 'getting-started',
        name: 'Getting Started',
        description: 'Earned your first 100 XP',
        category: BadgeCategory.MILESTONE,
        earnedAt: new Date('2024-01-01T00:00:00.000Z'),
      }
    ],
    streaks: {
      currentLoginStreak: 3,
      longestLoginStreak: 5,
      lastLoginDate: new Date('2024-01-15T00:00:00.000Z'),
    },
    activityCounts: {
      questsCreated: 5,
      questsCompleted: 3,
      questsInProgress: 2,
      appsAdded: 1,
      reviewInteractions: 8,
    },
    xpHistory: [
      {
        amount: 10,
        action: XPAction.QUEST_CREATED,
        timestamp: new Date('2024-01-01T10:00:00.000Z'),
        metadata: { questId: 'quest1' },
      },
      {
        amount: 15,
        action: XPAction.QUEST_COMPLETED,
        timestamp: new Date('2024-01-02T10:00:00.000Z'),
        metadata: { questId: 'quest2' },
      },
    ],
  },
};

describe('Gamification API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful authentication by default
    mockCookies.mockReturnValue({
      get: jest.fn().mockReturnValue({ value: 'valid-session-cookie' }),
    } as any);
    
    mockAuth.mockReturnValue({
      verifySessionCookie: jest.fn().mockResolvedValue({ uid: 'firebase-uid-123' }),
    } as any);
    
    mockDbConnect.mockResolvedValue(undefined);
    mockUserModel.findOne.mockResolvedValue(mockUser);
    
    // Mock XP and Badge services
    mockXPService.getUserGamificationData.mockResolvedValue(mockUser.gamification);
    mockXPService.getXPForNextLevel.mockReturnValue(100);
    mockXPService.getLevelThresholds.mockReturnValue([0, 100, 250, 500, 1000]);
    mockBadgeService.getBadgeProgress.mockReturnValue([]);
    mockXPService.awardXP.mockResolvedValue({
      xpAwarded: 10,
      totalXP: 160,
      levelUp: false,
      badgesEarned: [],
    });
  });

  describe('GET /api/gamification', () => {
    it('should return user gamification data successfully', async () => {
      // Setup mocks
      mockUserModel.findOne.mockResolvedValue(mockUser);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/gamification');

      // Execute
      const response = await GET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.gamificationData).toBeDefined();
      expect(data.gamificationData.xp).toBe(150);
      expect(data.gamificationData.level).toBe(2);
      expect(data.gamificationData.badges).toHaveLength(1);
      expect(data.badgeProgress).toBeDefined();
      expect(data.xpForNextLevel).toBeDefined();
      expect(data.levelThresholds).toBeDefined();
      
      // Check date serialization
      expect(typeof data.gamificationData.badges[0].earnedAt).toBe('string');
      expect(typeof data.gamificationData.xpHistory[0].timestamp).toBe('string');
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue(undefined),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/gamification');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should return 401 for invalid session cookie', async () => {
      // Mock invalid session cookie
      mockAuth.mockReturnValue({
        verifySessionCookie: jest.fn().mockRejectedValue(new Error('Invalid session')),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/gamification');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should return 404 when user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/gamification');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should return 503 when database connection fails', async () => {
      mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/gamification');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Database connection failed');
    });

    it('should handle user with no gamification data', async () => {
      const defaultGamificationData = {
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
      };
      
      mockXPService.getUserGamificationData.mockResolvedValue(defaultGamificationData);

      const request = new NextRequest('http://localhost:3000/api/gamification');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.gamificationData.xp).toBe(0);
      expect(data.gamificationData.level).toBe(1);
      expect(data.gamificationData.badges).toHaveLength(0);
    });
  });

  describe('POST /api/gamification/award-xp', () => {
    beforeEach(() => {
      // Mock UserModel methods for XP awarding
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUser);
      
      // Clear rate limiting store
      const { rateLimitStore } = require('../award-xp/route');
      rateLimitStore.clear();
    });

    it('should award XP successfully', async () => {
      const requestBody = {
        action: XPAction.QUEST_CREATED,
        metadata: { questId: 'quest123' },
      };

      const request = new NextRequest('http://localhost:3000/api/gamification/award-xp', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.xpAwarded).toBe(10); // QUEST_CREATED awards 10 XP
      expect(data.totalXP).toBeDefined();
      expect(data.levelUp).toBeDefined();
      expect(data.badgesEarned).toBeDefined();
    });

    it('should validate required action field', async () => {
      const requestBody = {
        metadata: { questId: 'quest123' },
      };

      const request = new NextRequest('http://localhost:3000/api/gamification/award-xp', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Action is required');
    });

    it('should validate action type', async () => {
      const requestBody = {
        action: 'INVALID_ACTION',
      };

      const request = new NextRequest('http://localhost:3000/api/gamification/award-xp', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid action');
    });

    it('should validate LOGIN_STREAK_BONUS metadata', async () => {
      const requestBody = {
        action: XPAction.LOGIN_STREAK_BONUS,
        metadata: { invalidField: 'test' },
      };

      const request = new NextRequest('http://localhost:3000/api/gamification/award-xp', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('streakDays');
    });

    it('should handle LOGIN_STREAK_BONUS with valid metadata', async () => {
      const requestBody = {
        action: XPAction.LOGIN_STREAK_BONUS,
        metadata: { streakDays: 7 },
      };

      const request = new NextRequest('http://localhost:3000/api/gamification/award-xp', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.xpAwarded).toBe(10); // 7-day streak awards 10 XP
    });

    it('should return 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/gamification/award-xp', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON in request body');
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue(undefined),
      } as any);

      const requestBody = {
        action: XPAction.QUEST_CREATED,
      };

      const request = new NextRequest('http://localhost:3000/api/gamification/award-xp', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should enforce rate limiting', async () => {
      const requestBody = {
        action: XPAction.QUEST_CREATED,
      };

      // Make 11 requests (exceeding the 10 request limit)
      const requests = Array.from({ length: 11 }, () =>
        new NextRequest('http://localhost:3000/api/gamification/award-xp', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );

      const responses = await Promise.all(requests.map(req => POST(req)));
      const lastResponse = responses[responses.length - 1];
      const lastData = await lastResponse.json();

      expect(lastResponse.status).toBe(429);
      expect(lastData.error).toBe('Rate limit exceeded');
    });

    it('should validate metadata type', async () => {
      const requestBody = {
        action: XPAction.QUEST_CREATED,
        metadata: 'invalid metadata type',
      };

      const request = new NextRequest('http://localhost:3000/api/gamification/award-xp', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Metadata must be an object if provided');
    });

    it('should validate positive streakDays for LOGIN_STREAK_BONUS', async () => {
      const requestBody = {
        action: XPAction.LOGIN_STREAK_BONUS,
        metadata: { streakDays: -1 },
      };

      const request = new NextRequest('http://localhost:3000/api/gamification/award-xp', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('streakDays must be a positive number');
    });

    it('should handle XP service errors gracefully', async () => {
      mockXPService.awardXP.mockRejectedValue(new Error('Database error'));

      const requestBody = {
        action: XPAction.QUEST_CREATED,
      };

      const request = new NextRequest('http://localhost:3000/api/gamification/award-xp', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors in GET', async () => {
      mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/gamification');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Database connection failed');
    });

    it('should handle database connection errors in POST', async () => {
      mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

      const requestBody = {
        action: XPAction.QUEST_CREATED,
      };

      const request = new NextRequest('http://localhost:3000/api/gamification/award-xp', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Database connection failed');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockUserModel.findOne.mockRejectedValue(new Error('Unexpected error'));

      const request = new NextRequest('http://localhost:3000/api/gamification');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
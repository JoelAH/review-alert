/**
 * @jest-environment node
 */

// Polyfills for Node.js environment
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import { NextRequest } from 'next/server';
import { GET, POST, PUT } from '../route';
import { cookies } from 'next/headers';
import { auth } from 'firebase-admin';
import dbConnect from '@/lib/db/db';
import QuestModel, { QuestType, QuestPriority, QuestState } from '@/lib/models/server/quest';
import UserModel from '@/lib/models/server/user';
import ReviewModel from '@/lib/models/server/review';

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

jest.mock('@/lib/models/server/quest', () => ({
  __esModule: true,
  default: jest.fn(),
  QuestType: {
    BUG_FIX: 'BUG_FIX',
    FEATURE_REQUEST: 'FEATURE_REQUEST',
    IMPROVEMENT: 'IMPROVEMENT',
    RESEARCH: 'RESEARCH',
    OTHER: 'OTHER',
  },
  QuestPriority: {
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
  },
  QuestState: {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    DONE: 'DONE',
  },
  formatQuest: jest.fn(),
}));

jest.mock('@/lib/models/server/user', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

jest.mock('@/lib/models/server/review', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

jest.mock('@/lib/constants', () => ({
  __esModule: true,
  default: {
    sessionCookieName: 'session',
  },
}));

const mockCookies = cookies as jest.MockedFunction<typeof cookies>;
const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockQuestModel = QuestModel as jest.Mocked<typeof QuestModel>;
const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockReviewModel = ReviewModel as jest.Mocked<typeof ReviewModel>;

describe('/api/quests', () => {
  const mockUser = {
    _id: 'user123',
    uid: 'firebase-uid-123',
    email: 'test@example.com',
  };

  const mockQuest = {
    _id: 'quest123',
    user: 'user123',
    title: 'Fix login bug',
    details: 'Users cannot log in with Google',
    type: QuestType.BUG_FIX,
    priority: QuestPriority.HIGH,
    state: QuestState.OPEN,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    toObject: () => ({
      _id: 'quest123',
      user: 'user123',
      title: 'Fix login bug',
      details: 'Users cannot log in with Google',
      type: QuestType.BUG_FIX,
      priority: QuestPriority.HIGH,
      state: QuestState.OPEN,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    }),
  };

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
  });

  describe('GET /api/quests', () => {
    beforeEach(() => {
      (mockQuestModel as any).countDocuments = jest.fn().mockResolvedValue(1);
      (mockQuestModel as any).aggregate = jest.fn().mockResolvedValue([
        {
          _id: 'quest123',
          user: 'user123',
          title: 'Fix login bug',
          details: 'Users cannot log in with Google',
          type: QuestType.BUG_FIX,
          priority: QuestPriority.HIGH,
          state: QuestState.OPEN,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
      ]);
    });

    it('should fetch user quests successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/quests');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quests).toHaveLength(1);
      expect(data.totalCount).toBe(1);
      expect(data.quests[0].title).toBe('Fix login bug');
    });

    it('should handle pagination parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/quests?page=2&limit=10');
      
      await GET(request);

      expect((mockQuestModel as any).aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ $skip: 10 }),
          expect.objectContaining({ $limit: 10 }),
        ])
      );
    });

    it('should filter by state', async () => {
      const request = new NextRequest('http://localhost:3000/api/quests?state=OPEN');
      
      await GET(request);

      expect((mockQuestModel as any).aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ $match: { user: 'user123', state: 'OPEN' } }),
        ])
      );
    });

    it('should filter by priority', async () => {
      const request = new NextRequest('http://localhost:3000/api/quests?priority=HIGH');
      
      await GET(request);

      expect((mockQuestModel as any).aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ $match: { user: 'user123', priority: 'HIGH' } }),
        ])
      );
    });

    it('should filter by type', async () => {
      const request = new NextRequest('http://localhost:3000/api/quests?type=BUG_FIX');
      
      await GET(request);

      expect((mockQuestModel as any).aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ $match: { user: 'user123', type: 'BUG_FIX' } }),
        ])
      );
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/quests?page=0&limit=-1');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid pagination parameters');
    });

    it('should return 400 for invalid state parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/quests?state=INVALID');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid state');
    });

    it('should return 400 for invalid priority parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/quests?priority=INVALID');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid priority');
    });

    it('should return 400 for invalid type parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/quests?type=INVALID');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid type');
    });

    it('should return 401 when no session cookie', async () => {
      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue(undefined),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/quests');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should return 401 when session cookie is invalid', async () => {
      mockAuth.mockReturnValue({
        verifySessionCookie: jest.fn().mockRejectedValue(new Error('Invalid session')),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/quests');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should return 404 when user not found', async () => {
      mockUserModel.findOne = jest.fn().mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/quests');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should return 500 on database error', async () => {
      (mockQuestModel as any).countDocuments = jest.fn().mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/quests');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/quests', () => {
    const validQuestData = {
      title: 'Fix login bug',
      details: 'Users cannot log in with Google',
      type: QuestType.BUG_FIX,
      priority: QuestPriority.HIGH,
    };

    beforeEach(() => {
      (mockQuestModel as any).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockQuest),
      }));
      // Mock formatQuest function
      const { formatQuest } = require('@/lib/models/server/quest');
      formatQuest.mockReturnValue({
        _id: 'quest123',
        user: 'user123',
        title: 'Fix login bug',
        details: 'Users cannot log in with Google',
        type: QuestType.BUG_FIX,
        priority: QuestPriority.HIGH,
        state: QuestState.OPEN,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      });
    });

    it('should create quest successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'POST',
        body: JSON.stringify(validQuestData),
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe('Fix login bug');
      expect(data.type).toBe(QuestType.BUG_FIX);
      expect(data.priority).toBe(QuestPriority.HIGH);
      expect(data.state).toBe(QuestState.OPEN);
    });

    it('should create quest with reviewId', async () => {
      const mockReview = { _id: 'review123', user: 'user123' };
      mockReviewModel.findOne.mockResolvedValue(mockReview);

      const questDataWithReview = {
        ...validQuestData,
        reviewId: 'review123',
      };

      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'POST',
        body: JSON.stringify(questDataWithReview),
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockReviewModel.findOne).toHaveBeenCalledWith({
        _id: 'review123',
        user: 'user123',
      });
    });

    it('should return 400 for missing title', async () => {
      const invalidData = { ...validQuestData };
      delete (invalidData as any).title;

      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Title is required');
    });

    it('should return 400 for empty title', async () => {
      const invalidData = { ...validQuestData, title: '   ' };

      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Title is required');
    });

    it('should return 400 for missing type', async () => {
      const invalidData = { ...validQuestData };
      delete (invalidData as any).type;

      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Type is required');
    });

    it('should return 400 for invalid type', async () => {
      const invalidData = { ...validQuestData, type: 'INVALID_TYPE' };

      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Type is required');
    });

    it('should return 400 for missing priority', async () => {
      const invalidData = { ...validQuestData };
      delete (invalidData as any).priority;

      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Priority is required');
    });

    it('should return 400 for invalid priority', async () => {
      const invalidData = { ...validQuestData, priority: 'INVALID_PRIORITY' };

      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Priority is required');
    });

    it('should return 400 for invalid state', async () => {
      const invalidData = { ...validQuestData, state: 'INVALID_STATE' };

      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('State must be one of');
    });

    it('should return 400 for non-string details', async () => {
      const invalidData = { ...validQuestData, details: 123 };

      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Details must be a string');
    });

    it('should return 404 for invalid reviewId', async () => {
      mockReviewModel.findOne.mockResolvedValue(null);

      const invalidData = { ...validQuestData, reviewId: 'invalid-review-id' };

      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Review not found');
    });

    it('should return 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'POST',
        body: 'invalid json',
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid JSON');
    });

    it('should return 401 when not authenticated', async () => {
      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue(undefined),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'POST',
        body: JSON.stringify(validQuestData),
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('PUT /api/quests', () => {
    const validUpdateData = {
      questId: 'quest123',
      title: 'Updated title',
      state: QuestState.IN_PROGRESS,
    };

    beforeEach(() => {
      (mockQuestModel as any).findOneAndUpdate = jest.fn().mockResolvedValue(mockQuest);
      // Mock formatQuest function
      const { formatQuest } = require('@/lib/models/server/quest');
      formatQuest.mockReturnValue({
        _id: 'quest123',
        user: 'user123',
        title: 'Updated title',
        details: 'Users cannot log in with Google',
        type: QuestType.BUG_FIX,
        priority: QuestPriority.HIGH,
        state: QuestState.IN_PROGRESS,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      });
    });

    it('should update quest successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });
      
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect((mockQuestModel as any).findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'quest123', user: 'user123' },
        expect.objectContaining({
          title: 'Updated title',
          state: QuestState.IN_PROGRESS,
          updatedAt: expect.any(Date),
        }),
        { new: true, runValidators: true }
      );
    });

    it('should update only provided fields', async () => {
      const partialUpdate = {
        questId: 'quest123',
        state: QuestState.DONE,
      };

      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'PUT',
        body: JSON.stringify(partialUpdate),
      });
      
      await PUT(request);

      expect((mockQuestModel as any).findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'quest123', user: 'user123' },
        expect.objectContaining({
          state: QuestState.DONE,
          updatedAt: expect.any(Date),
        }),
        { new: true, runValidators: true }
      );
    });

    it('should return 400 for missing questId', async () => {
      const invalidData = { ...validUpdateData };
      delete (invalidData as any).questId;

      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      });
      
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('questId is required');
    });

    it('should return 400 for empty title', async () => {
      const invalidData = { ...validUpdateData, title: '   ' };

      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      });
      
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Title must be a non-empty string');
    });

    it('should return 400 for invalid type', async () => {
      const invalidData = { ...validUpdateData, type: 'INVALID_TYPE' };

      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      });
      
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Type must be one of');
    });

    it('should return 400 for invalid priority', async () => {
      const invalidData = { ...validUpdateData, priority: 'INVALID_PRIORITY' };

      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      });
      
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Priority must be one of');
    });

    it('should return 400 for invalid state', async () => {
      const invalidData = { ...validUpdateData, state: 'INVALID_STATE' };

      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      });
      
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('State must be one of');
    });

    it('should return 400 when no update fields provided', async () => {
      const emptyUpdate = { questId: 'quest123' };

      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'PUT',
        body: JSON.stringify(emptyUpdate),
      });
      
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('No valid update fields provided');
    });

    it('should return 404 when quest not found', async () => {
      (mockQuestModel as any).findOneAndUpdate = jest.fn().mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });
      
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Quest not found');
    });

    it('should return 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'PUT',
        body: 'invalid json',
      });
      
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid JSON');
    });

    it('should return 401 when not authenticated', async () => {
      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue(undefined),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/quests', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData),
      });
      
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });
  });
});
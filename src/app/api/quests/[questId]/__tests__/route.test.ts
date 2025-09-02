/**
 * @jest-environment node
 */

// Polyfills for Node.js environment
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import { NextRequest } from 'next/server';
import { PUT, DELETE } from '../route';
import { cookies } from 'next/headers';
import { auth } from 'firebase-admin';
import dbConnect from '@/lib/db/db';
import QuestModel, { QuestType, QuestPriority, QuestState } from '@/lib/models/server/quest';
import UserModel from '@/lib/models/server/user';

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

jest.mock('@/lib/db/db');
jest.mock('@/lib/models/server/quest', () => ({
  __esModule: true,
  default: {
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
  QuestType: {
    BUG_FIX: "BUG_FIX",
    FEATURE_REQUEST: "FEATURE_REQUEST",
    IMPROVEMENT: "IMPROVEMENT",
    RESEARCH: "RESEARCH",
    OTHER: "OTHER"
  },
  QuestPriority: {
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW"
  },
  QuestState: {
    OPEN: "OPEN",
    IN_PROGRESS: "IN_PROGRESS",
    DONE: "DONE"
  },
  formatQuest: jest.fn((quest) => ({
    _id: quest._id?.toString() || quest._id,
    user: quest.user?.toString() || quest.user,
    reviewId: quest.reviewId?.toString() || quest.reviewId,
    title: quest.title,
    details: quest.details,
    type: quest.type,
    priority: quest.priority,
    state: quest.state,
    createdAt: quest.createdAt,
    updatedAt: quest.updatedAt,
  })),
}));

jest.mock('@/lib/models/server/user');

const mockCookies = cookies as jest.MockedFunction<typeof cookies>;
const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockQuestModel = QuestModel as jest.MockedClass<typeof QuestModel>;
const mockUserModel = UserModel as jest.MockedClass<typeof UserModel>;

// Mock data
const mockUser = {
  _id: 'user123',
  uid: 'firebase-uid-123',
  email: 'test@example.com',
};

const mockQuest = {
  _id: 'quest123',
  user: 'user123',
  title: 'Test Quest',
  details: 'Test details',
  type: QuestType.BUG_FIX,
  priority: QuestPriority.HIGH,
  state: QuestState.OPEN,
  createdAt: new Date(),
  updatedAt: new Date(),
  toObject: () => ({
    _id: 'quest123',
    user: 'user123',
    title: 'Test Quest',
    details: 'Test details',
    type: QuestType.BUG_FIX,
    priority: QuestPriority.HIGH,
    state: QuestState.OPEN,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
};

describe('/api/quests/[questId] - PUT', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful authentication
    mockCookies.mockReturnValue({
      get: jest.fn().mockReturnValue({ value: 'valid-session-cookie' }),
    } as any);
    
    mockAuth.mockReturnValue({
      verifySessionCookie: jest.fn().mockResolvedValue({ uid: 'firebase-uid-123' }),
    } as any);
    
    mockDbConnect.mockResolvedValue(undefined);
    mockUserModel.findOne = jest.fn().mockResolvedValue(mockUser);
  });

  it('should update quest successfully', async () => {
    const updatedQuest = {
      ...mockQuest,
      state: QuestState.IN_PROGRESS,
      toObject: () => ({
        ...mockQuest.toObject(),
        state: QuestState.IN_PROGRESS,
      }),
    };

    mockQuestModel.findOneAndUpdate = jest.fn().mockResolvedValue(updatedQuest);

    const request = new NextRequest('http://localhost/api/quests/quest123', {
      method: 'PUT',
      body: JSON.stringify({
        state: QuestState.IN_PROGRESS,
      }),
    });

    const response = await PUT(request, { params: { questId: 'quest123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.quest).toBeDefined();
    expect(data.quest.state).toBe(QuestState.IN_PROGRESS);
    expect(mockQuestModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'quest123', user: 'user123' },
      { state: QuestState.IN_PROGRESS, updatedAt: expect.any(Date) },
      { new: true, runValidators: true }
    );
  });

  it('should update multiple fields', async () => {
    const updatedQuest = {
      ...mockQuest,
      title: 'Updated Title',
      priority: QuestPriority.LOW,
      toObject: () => ({
        ...mockQuest.toObject(),
        title: 'Updated Title',
        priority: QuestPriority.LOW,
      }),
    };

    mockQuestModel.findOneAndUpdate = jest.fn().mockResolvedValue(updatedQuest);

    const request = new NextRequest('http://localhost/api/quests/quest123', {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Updated Title',
        priority: QuestPriority.LOW,
      }),
    });

    const response = await PUT(request, { params: { questId: 'quest123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.quest.title).toBe('Updated Title');
    expect(data.quest.priority).toBe(QuestPriority.LOW);
  });

  it('should return 400 for invalid quest ID', async () => {
    const request = new NextRequest('http://localhost/api/quests/', {
      method: 'PUT',
      body: JSON.stringify({ state: QuestState.IN_PROGRESS }),
    });

    const response = await PUT(request, { params: { questId: '' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid quest ID');
  });

  it('should return 400 for invalid JSON', async () => {
    const request = new NextRequest('http://localhost/api/quests/quest123', {
      method: 'PUT',
      body: 'invalid json',
    });

    const response = await PUT(request, { params: { questId: 'quest123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid JSON in request body');
  });

  it('should return 400 for empty title', async () => {
    const request = new NextRequest('http://localhost/api/quests/quest123', {
      method: 'PUT',
      body: JSON.stringify({ title: '' }),
    });

    const response = await PUT(request, { params: { questId: 'quest123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Title must be a non-empty string');
  });

  it('should return 400 for invalid state', async () => {
    const request = new NextRequest('http://localhost/api/quests/quest123', {
      method: 'PUT',
      body: JSON.stringify({ state: 'INVALID_STATE' }),
    });

    const response = await PUT(request, { params: { questId: 'quest123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('State must be one of');
  });

  it('should return 400 for no update fields', async () => {
    const request = new NextRequest('http://localhost/api/quests/quest123', {
      method: 'PUT',
      body: JSON.stringify({}),
    });

    const response = await PUT(request, { params: { questId: 'quest123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('No valid update fields provided');
  });

  it('should return 404 for non-existent quest', async () => {
    mockQuestModel.findOneAndUpdate = jest.fn().mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/quests/quest123', {
      method: 'PUT',
      body: JSON.stringify({ state: QuestState.IN_PROGRESS }),
    });

    const response = await PUT(request, { params: { questId: 'quest123' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Quest not found or does not belong to user');
  });

  it('should return 401 for missing session cookie', async () => {
    mockCookies.mockReturnValue({
      get: jest.fn().mockReturnValue(undefined),
    } as any);

    const request = new NextRequest('http://localhost/api/quests/quest123', {
      method: 'PUT',
      body: JSON.stringify({ state: QuestState.IN_PROGRESS }),
    });

    const response = await PUT(request, { params: { questId: 'quest123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Unauthorized');
  });

  it('should return 404 for non-existent user', async () => {
    mockUserModel.findOne = jest.fn().mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/quests/quest123', {
      method: 'PUT',
      body: JSON.stringify({ state: QuestState.IN_PROGRESS }),
    });

    const response = await PUT(request, { params: { questId: 'quest123' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should handle validation errors', async () => {
    const validationError = new Error('Validation failed');
    validationError.name = 'ValidationError';
    mockQuestModel.findOneAndUpdate = jest.fn().mockRejectedValue(validationError);

    const request = new NextRequest('http://localhost/api/quests/quest123', {
      method: 'PUT',
      body: JSON.stringify({ state: QuestState.IN_PROGRESS }),
    });

    const response = await PUT(request, { params: { questId: 'quest123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation error');
  });

  it('should handle cast errors', async () => {
    const castError = new Error('Cast failed');
    castError.name = 'CastError';
    mockQuestModel.findOneAndUpdate = jest.fn().mockRejectedValue(castError);

    const request = new NextRequest('http://localhost/api/quests/quest123', {
      method: 'PUT',
      body: JSON.stringify({ state: QuestState.IN_PROGRESS }),
    });

    const response = await PUT(request, { params: { questId: 'quest123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid quest ID format');
  });
});

describe('/api/quests/[questId] - DELETE', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful authentication
    mockCookies.mockReturnValue({
      get: jest.fn().mockReturnValue({ value: 'valid-session-cookie' }),
    } as any);
    
    mockAuth.mockReturnValue({
      verifySessionCookie: jest.fn().mockResolvedValue({ uid: 'firebase-uid-123' }),
    } as any);
    
    mockDbConnect.mockResolvedValue(undefined);
    mockUserModel.findOne = jest.fn().mockResolvedValue(mockUser);
  });

  it('should delete quest successfully', async () => {
    mockQuestModel.findOneAndDelete = jest.fn().mockResolvedValue(mockQuest);

    const request = new NextRequest('http://localhost/api/quests/quest123', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { questId: 'quest123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Quest deleted successfully');
    expect(mockQuestModel.findOneAndDelete).toHaveBeenCalledWith({
      _id: 'quest123',
      user: 'user123',
    });
  });

  it('should return 400 for invalid quest ID', async () => {
    const request = new NextRequest('http://localhost/api/quests/', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { questId: '' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid quest ID');
  });

  it('should return 404 for non-existent quest', async () => {
    mockQuestModel.findOneAndDelete = jest.fn().mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/quests/quest123', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { questId: 'quest123' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Quest not found or does not belong to user');
  });

  it('should return 401 for missing session cookie', async () => {
    mockCookies.mockReturnValue({
      get: jest.fn().mockReturnValue(undefined),
    } as any);

    const request = new NextRequest('http://localhost/api/quests/quest123', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { questId: 'quest123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Unauthorized');
  });

  it('should return 404 for non-existent user', async () => {
    mockUserModel.findOne = jest.fn().mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/quests/quest123', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { questId: 'quest123' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should handle cast errors', async () => {
    const castError = new Error('Cast failed');
    castError.name = 'CastError';
    mockQuestModel.findOneAndDelete = jest.fn().mockRejectedValue(castError);

    const request = new NextRequest('http://localhost/api/quests/quest123', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { questId: 'quest123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid quest ID format');
  });

  it('should handle database connection errors', async () => {
    mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost/api/quests/quest123', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { questId: 'quest123' } });
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Database connection failed');
  });

  it('should handle unexpected errors', async () => {
    mockQuestModel.findOneAndDelete = jest.fn().mockRejectedValue(new Error('Unexpected error'));

    const request = new NextRequest('http://localhost/api/quests/quest123', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { questId: 'quest123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
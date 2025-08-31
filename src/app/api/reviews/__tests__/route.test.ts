/**
 * @jest-environment node
 */

// Polyfills for Node.js environment
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import { NextRequest } from 'next/server';
import { GET } from '../route';
import { cookies } from 'next/headers';
import { auth } from 'firebase-admin';
import dbConnect from '@/lib/db/db';
import ReviewModel, { ReviewSentiment, ReviewQuest, ReviewPriority } from '@/lib/models/server/review';
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

jest.mock('@/lib/db/db', () => jest.fn());

jest.mock('@/lib/models/server/review', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
  ReviewSentiment: {
    POSITIVE: 'POSITIVE',
    NEGATIVE: 'NEGATIVE',
  },
  ReviewQuest: {
    BUG: 'BUG',
    FEATURE_REQUEST: 'FEATURE_REQUEST',
    OTHER: 'OTHER',
  },
  ReviewPriority: {
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
  },
}));

jest.mock('@/lib/models/server/user', () => ({
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
const mockReviewModel = ReviewModel as jest.Mocked<typeof ReviewModel>;
const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;

const mockUser = {
  _id: 'user123',
  uid: 'firebase-uid-123',
  email: 'test@example.com',
  name: 'Test User',
  apps: [
    {
      _id: 'app1',
      appId: 'app1',
      url: 'https://play.google.com/store/apps/details?id=com.example.app1',
      store: 'GooglePlay',
    },
    {
      _id: 'app2',
      appId: 'app2',
      url: 'https://apps.apple.com/app/example-app/id123456789',
      store: 'AppleStore',
    },
    {
      _id: 'app3',
      appId: 'app3',
      url: 'https://chrome.google.com/webstore/detail/example-extension/abcdefghijklmnop',
      store: 'ChromeExt',
    },
  ],
};

const mockReviews = [
  {
    _id: 'review1',
    user: 'user123',
    appId: 'app1',
    name: 'John Doe',
    comment: 'Great app! Love the new features.',
    date: new Date('2024-01-15'),
    rating: 5,
    sentiment: ReviewSentiment.POSITIVE,
    quest: ReviewQuest.FEATURE_REQUEST,
    priority: ReviewPriority.HIGH,
  },
  {
    _id: 'review2',
    user: 'user123',
    appId: 'app2',
    name: 'Jane Smith',
    comment: 'App crashes frequently. Please fix.',
    date: new Date('2024-01-14'),
    rating: 2,
    sentiment: ReviewSentiment.NEGATIVE,
    quest: ReviewQuest.BUG,
    priority: ReviewPriority.HIGH,
  },
  {
    _id: 'review3',
    user: 'user123',
    appId: 'app3',
    name: 'Bob Johnson',
    comment: 'Extension works well but could use more features.',
    date: new Date('2024-01-13'),
    rating: 4,
    sentiment: ReviewSentiment.POSITIVE,
    quest: ReviewQuest.OTHER,
    priority: ReviewPriority.MEDIUM,
  },
];

describe('/api/reviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful mocks
    mockCookies.mockReturnValue({
      get: jest.fn().mockReturnValue({ value: 'valid-session-cookie' }),
    } as any);
    
    mockAuth.mockReturnValue({
      verifySessionCookie: jest.fn().mockResolvedValue({ uid: 'firebase-uid-123' }),
    } as any);
    
    mockDbConnect.mockResolvedValue(undefined);
    mockUserModel.findOne.mockResolvedValue(mockUser);
    mockReviewModel.countDocuments.mockResolvedValue(3);
    mockReviewModel.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockReviews),
    } as any);
  });

  describe('Authentication', () => {
    it('returns 401 when no session cookie is provided', async () => {
      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue(undefined),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized - No session cookie');
    });

    it('returns 401 when session cookie is invalid', async () => {
      mockAuth.mockReturnValue({
        verifySessionCookie: jest.fn().mockRejectedValue(new Error('Invalid session')),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized - Invalid session');
    });

    it('successfully authenticates with valid session cookie', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockAuth().verifySessionCookie).toHaveBeenCalledWith('valid-session-cookie', true);
    });
  });

  describe('Database Connection', () => {
    it('returns 503 when database connection fails', async () => {
      mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Database connection failed');
    });
  });

  describe('User Validation', () => {
    it('returns 404 when user is not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('returns 500 when user fetch fails', async () => {
      mockUserModel.findOne.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Error fetching user data');
    });
  });

  describe('Parameter Validation', () => {
    it('validates page parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews?page=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid pagination parameters. Page and limit must be positive integers.');
    });

    it('validates limit parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews?limit=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid pagination parameters. Page and limit must be positive integers.');
    });

    it('caps limit at 100', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews?limit=200');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockReviewModel.find().limit).toHaveBeenCalledWith(100);
    });

    it('validates platform parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews?platform=InvalidPlatform');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid platform. Must be one of: GooglePlay, AppleStore, ChromeExt');
    });

    it('validates rating parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews?rating=6');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid rating. Must be between 1 and 5.');
    });

    it('validates sentiment parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews?sentiment=INVALID');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid sentiment. Must be one of: POSITIVE, NEGATIVE');
    });

    it('validates quest parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews?quest=INVALID');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid quest. Must be one of: BUG, FEATURE_REQUEST, OTHER');
    });
  });

  describe('Filtering', () => {
    it('filters by platform correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews?platform=GooglePlay');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockReviewModel.find).toHaveBeenCalledWith({
        user: mockUser._id,
        appId: { $in: ['app1'] },
      });
    });

    it('returns empty result when no apps match platform', async () => {
      const userWithoutGooglePlayApps = {
        ...mockUser,
        apps: mockUser.apps?.filter(app => app.store !== 'GooglePlay'),
      };
      mockUserModel.findOne.mockResolvedValue(userWithoutGooglePlayApps);

      const request = new NextRequest('http://localhost:3000/api/reviews?platform=GooglePlay');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reviews).toEqual([]);
      expect(data.totalCount).toBe(0);
      expect(data.hasMore).toBe(false);
    });

    it('filters by rating correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews?rating=5');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockReviewModel.find).toHaveBeenCalledWith({
        user: mockUser._id,
        rating: 5,
      });
    });

    it('filters by sentiment correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews?sentiment=POSITIVE');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockReviewModel.find).toHaveBeenCalledWith({
        user: mockUser._id,
        sentiment: 'POSITIVE',
      });
    });

    it('filters by quest correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews?quest=BUG');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockReviewModel.find).toHaveBeenCalledWith({
        user: mockUser._id,
        quest: 'BUG',
      });
    });

    it('combines multiple filters correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews?platform=GooglePlay&rating=5&sentiment=POSITIVE');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockReviewModel.find).toHaveBeenCalledWith({
        user: mockUser._id,
        appId: { $in: ['app1'] },
        rating: 5,
        sentiment: 'POSITIVE',
      });
    });
  });

  describe('Pagination', () => {
    it('implements pagination correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews?page=2&limit=10');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockReviewModel.find().skip).toHaveBeenCalledWith(10);
      expect(mockReviewModel.find().limit).toHaveBeenCalledWith(10);
    });

    it('calculates hasMore correctly when there are more reviews', async () => {
      mockReviewModel.countDocuments.mockResolvedValue(25);

      const request = new NextRequest('http://localhost:3000/api/reviews?page=1&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasMore).toBe(true);
      expect(data.totalCount).toBe(25);
    });

    it('calculates hasMore correctly when no more reviews', async () => {
      mockReviewModel.countDocuments.mockResolvedValue(10);

      const request = new NextRequest('http://localhost:3000/api/reviews?page=1&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasMore).toBe(false);
      expect(data.totalCount).toBe(10);
    });
  });

  describe('Data Formatting', () => {
    it('formats reviews with app information correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reviews).toHaveLength(3);
      
      const firstReview = data.reviews[0];
      expect(firstReview._id).toBe('review1');
      expect(firstReview.platform).toBe('GooglePlay');
      expect(firstReview.appName).toBe('details?id=com.example.app1');
    });

    it('handles unknown apps gracefully', async () => {
      const reviewsWithUnknownApp = [
        {
          ...mockReviews[0],
          appId: 'unknown-app-id',
        },
      ];
      
      mockReviewModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(reviewsWithUnknownApp),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const firstReview = data.reviews[0];
      expect(firstReview.platform).toBe('Unknown');
      expect(firstReview.appName).toBe('Unknown App');
    });
  });

  describe('Overview Statistics', () => {
    it('calculates sentiment breakdown correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.overview.sentimentBreakdown).toEqual({
        positive: 2,
        negative: 1,
      });
    });

    it('calculates platform breakdown correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.overview.platformBreakdown).toEqual({
        GooglePlay: 1,
        AppleStore: 1,
        ChromeExt: 1,
      });
    });

    it('calculates quest breakdown correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.overview.questBreakdown).toEqual({
        bug: 1,
        featureRequest: 1,
        other: 1,
      });
    });

    it('handles overview calculation errors gracefully', async () => {
      // Mock the second find call (for overview) to fail
      mockReviewModel.find
        .mockReturnValueOnce({
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(mockReviews),
        } as any)
        .mockReturnValueOnce({
          lean: jest.fn().mockRejectedValue(new Error('Database error')),
        } as any);

      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Error calculating overview statistics');
    });
  });

  describe('Error Handling', () => {
    it('handles review counting errors', async () => {
      mockReviewModel.countDocuments.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Error counting reviews');
    });

    it('handles review fetching errors', async () => {
      mockReviewModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error('Database error')),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Error fetching reviews');
    });

    it('handles unexpected errors gracefully', async () => {
      mockUserModel.findOne.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Error fetching user data');
    });
  });

  describe('Sorting', () => {
    it('sorts reviews by date in descending order', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockReviewModel.find().sort).toHaveBeenCalledWith({ date: -1 });
    });
  });

  describe('Default Parameters', () => {
    it('uses default pagination parameters when not provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockReviewModel.find().skip).toHaveBeenCalledWith(0);
      expect(mockReviewModel.find().limit).toHaveBeenCalledWith(20);
    });
  });
});
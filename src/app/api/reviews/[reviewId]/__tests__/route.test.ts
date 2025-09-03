import { NextRequest } from 'next/server';
import { PUT } from '../route';
import { cookies } from 'next/headers';
import { auth } from 'firebase-admin';
import dbConnect from '@/lib/db/db';
import ReviewModel from '@/lib/models/server/review';
import UserModel from '@/lib/models/server/user';

// Mock dependencies
jest.mock('next/headers');
jest.mock('firebase-admin');
jest.mock('@/lib/firebase/admin.config');
jest.mock('@/lib/db/db');
jest.mock('@/lib/models/server/review');
jest.mock('@/lib/models/server/user');

const mockCookies = cookies as jest.MockedFunction<typeof cookies>;
const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockReviewModel = ReviewModel as jest.MockedClass<typeof ReviewModel>;
const mockUserModel = UserModel as jest.MockedClass<typeof UserModel>;

describe('/api/reviews/[reviewId] PUT', () => {
  const mockUserId = 'user123';
  const mockReviewId = 'review123';
  const mockQuestId = 'quest123';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock cookies
    mockCookies.mockReturnValue({
      get: jest.fn().mockReturnValue({ value: 'valid-session-cookie' }),
    } as any);

    // Mock Firebase auth
    mockAuth.mockReturnValue({
      verifySessionCookie: jest.fn().mockResolvedValue({ uid: mockUserId }),
    } as any);

    // Mock database connection
    mockDbConnect.mockResolvedValue(undefined);

    // Mock user model
    mockUserModel.findOne = jest.fn().mockResolvedValue({
      _id: 'user-object-id',
      uid: mockUserId,
    });

    // Mock review model
    mockReviewModel.findOneAndUpdate = jest.fn();
  });

  it('successfully updates review with quest ID', async () => {
    const mockUpdatedReview = {
      _id: mockReviewId,
      user: 'user-object-id',
      appId: 'app-object-id',
      questId: mockQuestId,
      updatedAt: new Date(),
    };

    mockReviewModel.findOneAndUpdate.mockResolvedValue(mockUpdatedReview);

    const request = new NextRequest('http://localhost/api/reviews/review123', {
      method: 'PUT',
      body: JSON.stringify({ questId: mockQuestId }),
    });

    const response = await PUT(request, { params: { reviewId: mockReviewId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.review.questId).toBe(mockQuestId);
    expect(mockReviewModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: mockReviewId, user: 'user-object-id' },
      { questId: mockQuestId, updatedAt: expect.any(Date) },
      { new: true, lean: true }
    );
  });

  it('successfully removes quest ID when null is provided', async () => {
    const mockUpdatedReview = {
      _id: mockReviewId,
      user: 'user-object-id',
      appId: 'app-object-id',
      questId: null,
      updatedAt: new Date(),
    };

    mockReviewModel.findOneAndUpdate.mockResolvedValue(mockUpdatedReview);

    const request = new NextRequest('http://localhost/api/reviews/review123', {
      method: 'PUT',
      body: JSON.stringify({ questId: null }),
    });

    const response = await PUT(request, { params: { reviewId: mockReviewId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.review.questId).toBe(null);
  });

  it('returns 401 when no session cookie is provided', async () => {
    mockCookies.mockReturnValue({
      get: jest.fn().mockReturnValue(undefined),
    } as any);

    const request = new NextRequest('http://localhost/api/reviews/review123', {
      method: 'PUT',
      body: JSON.stringify({ questId: mockQuestId }),
    });

    const response = await PUT(request, { params: { reviewId: mockReviewId } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized - No session cookie');
  });

  it('returns 401 when session cookie is invalid', async () => {
    mockAuth.mockReturnValue({
      verifySessionCookie: jest.fn().mockRejectedValue(new Error('Invalid session')),
    } as any);

    const request = new NextRequest('http://localhost/api/reviews/review123', {
      method: 'PUT',
      body: JSON.stringify({ questId: mockQuestId }),
    });

    const response = await PUT(request, { params: { reviewId: mockReviewId } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized - Invalid session');
  });

  it('returns 400 when review ID is missing', async () => {
    const request = new NextRequest('http://localhost/api/reviews/', {
      method: 'PUT',
      body: JSON.stringify({ questId: mockQuestId }),
    });

    const response = await PUT(request, { params: { reviewId: '' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Review ID is required');
  });

  it('returns 400 when request body is invalid JSON', async () => {
    const request = new NextRequest('http://localhost/api/reviews/review123', {
      method: 'PUT',
      body: 'invalid-json',
    });

    const response = await PUT(request, { params: { reviewId: mockReviewId } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid JSON in request body');
  });

  it('returns 404 when user is not found', async () => {
    mockUserModel.findOne = jest.fn().mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/reviews/review123', {
      method: 'PUT',
      body: JSON.stringify({ questId: mockQuestId }),
    });

    const response = await PUT(request, { params: { reviewId: mockReviewId } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('returns 404 when review is not found or access denied', async () => {
    mockReviewModel.findOneAndUpdate.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/reviews/review123', {
      method: 'PUT',
      body: JSON.stringify({ questId: mockQuestId }),
    });

    const response = await PUT(request, { params: { reviewId: mockReviewId } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Review not found or access denied');
  });

  it('returns 503 when database connection fails', async () => {
    mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost/api/reviews/review123', {
      method: 'PUT',
      body: JSON.stringify({ questId: mockQuestId }),
    });

    const response = await PUT(request, { params: { reviewId: mockReviewId } });
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Database connection failed');
  });

  it('returns 500 when user fetch fails', async () => {
    mockUserModel.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/reviews/review123', {
      method: 'PUT',
      body: JSON.stringify({ questId: mockQuestId }),
    });

    const response = await PUT(request, { params: { reviewId: mockReviewId } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Error fetching user data');
  });

  it('returns 500 when review update fails', async () => {
    mockReviewModel.findOneAndUpdate.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/reviews/review123', {
      method: 'PUT',
      body: JSON.stringify({ questId: mockQuestId }),
    });

    const response = await PUT(request, { params: { reviewId: mockReviewId } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Error updating review');
  });
});
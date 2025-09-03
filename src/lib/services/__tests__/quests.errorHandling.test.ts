import { QuestService, QuestError, QuestCache } from '../quests';
import { QuestType, QuestPriority, QuestState } from '@/lib/models/client/quest';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Response for Node.js environment
global.Response = class MockResponse {
  ok: boolean;
  status: number;
  statusText: string;
  body: any;

  constructor(body: any, init: { status?: number; statusText?: string } = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.ok = this.status >= 200 && this.status < 300;
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }

  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }
} as any;

describe('QuestService Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    QuestCache.clear();
  });

  describe('QuestError', () => {
    it('should create error with correct properties', () => {
      const error = new QuestError('Test error', 'TEST_CODE', 500, true);
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.status).toBe(500);
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('QuestError');
    });

    it('should identify retryable errors correctly', () => {
      const retryableError = new QuestError('Server error', 'HTTP_ERROR', 500, true);
      const nonRetryableError = new QuestError('Bad request', 'HTTP_ERROR', 400, false);
      
      expect(retryableError.shouldRetry).toBe(true);
      expect(nonRetryableError.shouldRetry).toBe(false);
    });

    it('should identify network errors correctly', () => {
      const networkError = new QuestError('Network error', 'FETCH_ERROR');
      const serverError = new QuestError('Server error', 'HTTP_ERROR', 500);
      const clientError = new QuestError('Bad request', 'HTTP_ERROR', 400);
      
      expect(networkError.isNetworkError).toBe(true);
      expect(serverError.isNetworkError).toBe(true);
      expect(clientError.isNetworkError).toBe(false);
    });

    it('should identify auth errors correctly', () => {
      const unauthorizedError = new QuestError('Unauthorized', 'HTTP_ERROR', 401);
      const forbiddenError = new QuestError('Forbidden', 'HTTP_ERROR', 403);
      const serverError = new QuestError('Server error', 'HTTP_ERROR', 500);
      
      expect(unauthorizedError.isAuthError).toBe(true);
      expect(forbiddenError.isAuthError).toBe(true);
      expect(serverError.isAuthError).toBe(false);
    });

    it('should create error from response correctly', () => {
      const response = new Response(null, { status: 500, statusText: 'Internal Server Error' });
      const error = QuestError.fromResponse(response, 'Custom message');
      
      expect(error.message).toBe('Custom message');
      expect(error.code).toBe('HTTP_ERROR');
      expect(error.status).toBe(500);
      expect(error.retryable).toBe(true);
    });

    it('should create error from unknown error correctly', () => {
      const jsError = new Error('JavaScript error');
      const questError = QuestError.fromError(jsError);
      
      expect(questError.message).toBe('JavaScript error');
      expect(questError.code).toBe('UNKNOWN_ERROR');
      expect(questError.retryable).toBe(false);
    });

    it('should handle network-related errors as retryable', () => {
      const networkError = new Error('fetch failed');
      const questError = QuestError.fromError(networkError);
      
      expect(questError.retryable).toBe(true);
    });
  });

  describe('Retry Mechanism', () => {
    it('should retry on server errors', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Server error'))
        .mockRejectedValueOnce(new Error('Server error'))
        .mockResolvedValueOnce(new Response(JSON.stringify({
          quests: [],
          hasMore: false,
          totalCount: 0,
          overview: {
            stateBreakdown: { open: 0, inProgress: 0, done: 0 },
            priorityBreakdown: { high: 0, medium: 0, low: 0 },
            typeBreakdown: { bugFix: 0, featureRequest: 0, improvement: 0, research: 0, other: 0 }
          }
        }), { status: 200 }));

      const result = await QuestService.fetchQuests();
      
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.quests).toEqual([]);
    });

    it('should not retry on client errors', async () => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 }));

      await expect(QuestService.fetchQuests()).rejects.toThrow('Bad request');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on 429 rate limit errors', async () => {
      mockFetch
        .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({
          quests: [],
          hasMore: false,
          totalCount: 0,
          overview: {
            stateBreakdown: { open: 0, inProgress: 0, done: 0 },
            priorityBreakdown: { high: 0, medium: 0, low: 0 },
            typeBreakdown: { bugFix: 0, featureRequest: 0, improvement: 0, research: 0, other: 0 }
          }
        }), { status: 200 }));

      const result = await QuestService.fetchQuests();
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.quests).toEqual([]);
    });

    it('should stop retrying after max attempts', async () => {
      // Mock the sleep function to make retries instant
      const originalSleep = (QuestService as any).sleep;
      (QuestService as any).sleep = jest.fn().mockResolvedValue(undefined);
      
      mockFetch.mockRejectedValue(new Error('Server error'));

      await expect(QuestService.fetchQuests()).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(4); // Initial + 3 retries
      
      // Restore original sleep function
      (QuestService as any).sleep = originalSleep;
    });

    it('should not retry if request is aborted', async () => {
      const abortController = new AbortController();
      abortController.abort();

      mockFetch.mockRejectedValueOnce(new Error('AbortError'));

      await expect(QuestService.fetchQuests({ signal: abortController.signal })).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Messages', () => {
    it('should return user-friendly error messages', () => {
      const fetchError = new QuestError('Failed to fetch', 'FETCH_ERROR');
      const createError = new QuestError('Failed to create', 'CREATE_ERROR');
      const updateError = new QuestError('Failed to update', 'UPDATE_ERROR');
      const deleteError = new QuestError('Failed to delete', 'DELETE_ERROR');
      
      expect(QuestService.getErrorMessage(fetchError)).toBe('Failed to load quests. Please check your connection and try again.');
      expect(QuestService.getErrorMessage(createError)).toBe('Failed to create quest. Please try again.');
      expect(QuestService.getErrorMessage(updateError)).toBe('Failed to update quest. Please try again.');
      expect(QuestService.getErrorMessage(deleteError)).toBe('Failed to delete quest. Please try again.');
    });

    it('should return specific messages for HTTP errors', () => {
      const unauthorizedError = new QuestError('Unauthorized', 'HTTP_ERROR', 401);
      const forbiddenError = new QuestError('Forbidden', 'HTTP_ERROR', 403);
      const notFoundError = new QuestError('Not found', 'HTTP_ERROR', 404);
      const rateLimitError = new QuestError('Rate limited', 'HTTP_ERROR', 429);
      const serverError = new QuestError('Server error', 'HTTP_ERROR', 500);
      
      expect(QuestService.getErrorMessage(unauthorizedError)).toBe('You need to sign in to manage quests.');
      expect(QuestService.getErrorMessage(forbiddenError)).toBe('You don\'t have permission to perform this action.');
      expect(QuestService.getErrorMessage(notFoundError)).toBe('Quest not found. It may have been deleted.');
      expect(QuestService.getErrorMessage(rateLimitError)).toBe('Too many requests. Please wait a moment and try again.');
      expect(QuestService.getErrorMessage(serverError)).toBe('Server error. Please try again later.');
    });

    it('should handle unknown errors gracefully', () => {
      const unknownError = { message: 'Unknown error' };
      
      expect(QuestService.getErrorMessage(unknownError)).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('Health Check', () => {
    it('should return true when API is available', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

      const isHealthy = await QuestService.healthCheck();
      
      expect(isHealthy).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/quests/health', {
        method: 'GET',
        signal: undefined,
      });
    });

    it('should return false when API is unavailable', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }));

      const isHealthy = await QuestService.healthCheck();
      
      expect(isHealthy).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const isHealthy = await QuestService.healthCheck();
      
      expect(isHealthy).toBe(false);
    });
  });

  describe('CRUD Operations with Error Handling', () => {
    const mockQuest = {
      _id: 'quest-1',
      title: 'Test Quest',
      details: 'Test details',
      type: QuestType.BUG_FIX,
      priority: QuestPriority.HIGH,
      state: QuestState.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should handle create quest errors', async () => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Validation failed' }), { status: 400 }));

      await expect(QuestService.createQuest({
        title: 'Test Quest',
        type: QuestType.BUG_FIX,
        priority: QuestPriority.HIGH,
      })).rejects.toThrow('Validation failed');
    });

    it('should handle update quest errors', async () => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Quest not found' }), { status: 404 }));

      await expect(QuestService.updateQuest('quest-1', { title: 'Updated' })).rejects.toThrow('Quest not found');
    });

    it('should handle delete quest errors', async () => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));

      await expect(QuestService.deleteQuest('quest-1')).rejects.toThrow('Forbidden');
    });

    it('should clear cache on successful operations', async () => {
      // Set up cache
      QuestCache.set('test-key', {
        quests: [mockQuest],
        hasMore: false,
        totalCount: 1,
        overview: {
          stateBreakdown: { open: 1, inProgress: 0, done: 0 },
          priorityBreakdown: { high: 1, medium: 0, low: 0 },
          typeBreakdown: { bugFix: 1, featureRequest: 0, improvement: 0, research: 0, other: 0 }
        }
      });

      // Mock successful create
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ quest: mockQuest }), { status: 201 }));

      await QuestService.createQuest({
        title: 'Test Quest',
        type: QuestType.BUG_FIX,
        priority: QuestPriority.HIGH,
      });

      // Cache should be cleared
      expect(QuestCache.get('test-key')).toBeNull();
    });
  });
});
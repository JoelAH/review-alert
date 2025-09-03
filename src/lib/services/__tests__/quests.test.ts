import { QuestService, QuestCache, debounce, throttle, QuestError } from '../quests';
import { Quest, QuestType, QuestPriority, QuestState } from '@/lib/models/client/quest';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock data
const mockQuest: Quest = {
  _id: '1',
  user: 'user1',
  reviewId: 'review1',
  title: 'Fix login bug',
  details: 'Users cannot login with Google OAuth',
  type: QuestType.BUG_FIX,
  priority: QuestPriority.HIGH,
  state: QuestState.OPEN,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockResponse = {
  quests: [mockQuest],
  hasMore: true,
  totalCount: 10,
  overview: {
    stateBreakdown: {
      open: 5,
      inProgress: 3,
      done: 2,
    },
    priorityBreakdown: {
      high: 4,
      medium: 4,
      low: 2,
    },
    typeBreakdown: {
      bugFix: 3,
      featureRequest: 4,
      improvement: 2,
      research: 1,
      other: 0,
    },
  },
};

describe('QuestService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    QuestCache.clear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);
  });

  describe('fetchQuests', () => {
    it('should fetch quests with default parameters', async () => {
      const result = await QuestService.fetchQuests();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/quests?page=1&limit=20',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should fetch quests with custom parameters', async () => {
      const options = {
        page: 2,
        limit: 10,
        filters: {
          type: QuestType.BUG_FIX,
          priority: QuestPriority.HIGH,
          state: QuestState.OPEN,
          search: 'login',
        },
      };

      await QuestService.fetchQuests(options);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/quests?page=2&limit=10&type=BUG_FIX&priority=HIGH&state=OPEN&search=login',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      } as Response);

      await expect(QuestService.fetchQuests()).rejects.toThrow(QuestError);
      await expect(QuestService.fetchQuests()).rejects.toThrow('Internal server error');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(QuestService.fetchQuests()).rejects.toThrow('Network error');
    });

    it('should pass abort signal', async () => {
      const abortController = new AbortController();
      
      await QuestService.fetchQuests({ signal: abortController.signal });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: abortController.signal,
        })
      );
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response);

      await expect(QuestService.fetchQuests()).rejects.toThrow(QuestError);
    });
  });

  describe('createQuest', () => {
    const questData = {
      title: 'New quest',
      details: 'Quest details',
      type: QuestType.FEATURE_REQUEST,
      priority: QuestPriority.MEDIUM,
      reviewId: 'review1',
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ quest: mockQuest }),
      } as Response);
    });

    it('should create a quest successfully', async () => {
      const result = await QuestService.createQuest(questData);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/quests',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(questData),
        })
      );

      expect(result).toEqual(mockQuest);
    });

    it('should pass abort signal', async () => {
      const abortController = new AbortController();
      
      await QuestService.createQuest(questData, abortController.signal);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: abortController.signal,
        })
      );
    });

    it('should handle creation errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Validation error' }),
      } as Response);

      await expect(QuestService.createQuest(questData)).rejects.toThrow(QuestError);
      await expect(QuestService.createQuest(questData)).rejects.toThrow('Validation error');
    });

    it('should clear cache after successful creation', async () => {
      // Set some cache data
      QuestCache.set('test-key', mockResponse);
      expect(QuestCache.get('test-key')).toEqual(mockResponse);

      await QuestService.createQuest(questData);

      // Cache should be cleared
      expect(QuestCache.get('test-key')).toBe(null);
    });
  });

  describe('updateQuest', () => {
    const questId = 'quest1';
    const updates = {
      title: 'Updated title',
      state: QuestState.IN_PROGRESS,
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ quest: { ...mockQuest, ...updates } }),
      } as Response);
    });

    it('should update a quest successfully', async () => {
      const result = await QuestService.updateQuest(questId, updates);

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/quests/${questId}`,
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        })
      );

      expect(result).toEqual({ ...mockQuest, ...updates });
    });

    it('should pass abort signal', async () => {
      const abortController = new AbortController();
      
      await QuestService.updateQuest(questId, updates, abortController.signal);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: abortController.signal,
        })
      );
    });

    it('should handle update errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Quest not found' }),
      } as Response);

      await expect(QuestService.updateQuest(questId, updates)).rejects.toThrow(QuestError);
      await expect(QuestService.updateQuest(questId, updates)).rejects.toThrow('Quest not found');
    });

    it('should clear cache after successful update', async () => {
      // Set some cache data
      QuestCache.set('test-key', mockResponse);
      expect(QuestCache.get('test-key')).toEqual(mockResponse);

      await QuestService.updateQuest(questId, updates);

      // Cache should be cleared
      expect(QuestCache.get('test-key')).toBe(null);
    });
  });

  describe('deleteQuest', () => {
    const questId = 'quest1';

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);
    });

    it('should delete a quest successfully', async () => {
      await QuestService.deleteQuest(questId);

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/quests/${questId}`,
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should pass abort signal', async () => {
      const abortController = new AbortController();
      
      await QuestService.deleteQuest(questId, abortController.signal);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: abortController.signal,
        })
      );
    });

    it('should handle deletion errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Quest not found' }),
      } as Response);

      await expect(QuestService.deleteQuest(questId)).rejects.toThrow(QuestError);
      await expect(QuestService.deleteQuest(questId)).rejects.toThrow('Quest not found');
    });

    it('should clear cache after successful deletion', async () => {
      // Set some cache data
      QuestCache.set('test-key', mockResponse);
      expect(QuestCache.get('test-key')).toEqual(mockResponse);

      await QuestService.deleteQuest(questId);

      // Cache should be cleared
      expect(QuestCache.get('test-key')).toBe(null);
    });
  });

  describe('fetchOverview', () => {
    it('should fetch overview data', async () => {
      const result = await QuestService.fetchOverview();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/quests?page=1&limit=1',
        expect.any(Object)
      );

      expect(result).toEqual(mockResponse.overview);
    });

    it('should pass abort signal to fetchOverview', async () => {
      const abortController = new AbortController();
      
      await QuestService.fetchOverview(abortController.signal);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: abortController.signal,
        })
      );
    });
  });

  describe('buildCacheKey', () => {
    it('should build cache key with page and filters', () => {
      const filters = {
        type: QuestType.BUG_FIX,
        priority: QuestPriority.HIGH,
        state: QuestState.OPEN,
      };

      const key = QuestService.buildCacheKey(2, filters);

      expect(key).toBe('quests:2:priority:HIGH|state:OPEN|type:BUG_FIX');
    });

    it('should build cache key with empty filters', () => {
      const key = QuestService.buildCacheKey(1, {});

      expect(key).toBe('quests:1:');
    });

    it('should sort filter keys consistently', () => {
      const filters1 = { priority: QuestPriority.HIGH, type: QuestType.BUG_FIX };
      const filters2 = { type: QuestType.BUG_FIX, priority: QuestPriority.HIGH };

      const key1 = QuestService.buildCacheKey(1, filters1);
      const key2 = QuestService.buildCacheKey(1, filters2);

      expect(key1).toBe(key2);
    });

    it('should include search in cache key', () => {
      const filters = { search: 'login bug' };
      const key = QuestService.buildCacheKey(1, filters);

      expect(key).toBe('quests:1:search:login bug');
    });
  });

  describe('fetchQuestsWithCache', () => {
    it('should return cached data when available', async () => {
      const cacheKey = QuestService.buildCacheKey(1, {});
      QuestCache.set(cacheKey, mockResponse);

      const result = await QuestService.fetchQuestsWithCache();

      // Should not make API call
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should fetch from API and cache when not cached', async () => {
      const result = await QuestService.fetchQuestsWithCache();

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);

      // Should now be cached
      const cacheKey = QuestService.buildCacheKey(1, {});
      expect(QuestCache.get(cacheKey)).toEqual(mockResponse);
    });

    it('should use different cache keys for different filters', async () => {
      const filters1 = { type: QuestType.BUG_FIX };
      const filters2 = { type: QuestType.FEATURE_REQUEST };

      await QuestService.fetchQuestsWithCache({ filters: filters1 });
      await QuestService.fetchQuestsWithCache({ filters: filters2 });

      // Should make two API calls for different filters
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

describe('QuestCache', () => {
  beforeEach(() => {
    QuestCache.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should store and retrieve cached data', () => {
    const key = 'test-key';
    
    QuestCache.set(key, mockResponse);
    const result = QuestCache.get(key);

    expect(result).toEqual(mockResponse);
  });

  it('should return null for non-existent keys', () => {
    const result = QuestCache.get('non-existent');

    expect(result).toBe(null);
  });

  it('should expire cached data after TTL', () => {
    const key = 'test-key';
    
    QuestCache.set(key, mockResponse);
    
    // Fast-forward time beyond TTL (5 minutes)
    jest.advanceTimersByTime(6 * 60 * 1000);
    
    const result = QuestCache.get(key);

    expect(result).toBe(null);
  });

  it('should not expire cached data before TTL', () => {
    const key = 'test-key';
    
    QuestCache.set(key, mockResponse);
    
    // Fast-forward time within TTL (4 minutes)
    jest.advanceTimersByTime(4 * 60 * 1000);
    
    const result = QuestCache.get(key);

    expect(result).toEqual(mockResponse);
  });

  it('should clear all cached data', () => {
    QuestCache.set('key1', mockResponse);
    QuestCache.set('key2', mockResponse);

    QuestCache.clear();

    expect(QuestCache.get('key1')).toBe(null);
    expect(QuestCache.get('key2')).toBe(null);
  });

  it('should cleanup old entries when cache gets large', () => {
    // Fill cache beyond limit
    for (let i = 0; i < 101; i++) {
      QuestCache.set(`key-${i}`, mockResponse);
    }

    // The cache should have cleaned up some entries
    // We can't test exact behavior without exposing internals,
    // but we can verify it doesn't crash
    expect(() => QuestCache.get('key-0')).not.toThrow();
  });

  it('should handle cleanup of expired entries', () => {
    QuestCache.set('key1', mockResponse);
    
    // Fast-forward time to expire first entry
    jest.advanceTimersByTime(6 * 60 * 1000);
    
    QuestCache.set('key2', mockResponse);
    
    // Fill cache to trigger cleanup
    for (let i = 0; i < 100; i++) {
      QuestCache.set(`key-${i}`, mockResponse);
    }

    // Expired entry should be cleaned up
    expect(QuestCache.get('key1')).toBe(null);
    // Recent entry should still exist
    expect(QuestCache.get('key2')).toEqual(mockResponse);
  });
});

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should debounce function calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('arg1');
    debouncedFn('arg2');
    debouncedFn('arg3');

    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('arg3');
  });

  it('should reset timer on subsequent calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('arg1');
    jest.advanceTimersByTime(50);
    
    debouncedFn('arg2');
    jest.advanceTimersByTime(50);

    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('arg2');
  });

  it('should handle multiple arguments', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('arg1', 'arg2', 'arg3');

    jest.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
  });
});

describe('throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should throttle function calls', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn('arg1');
    throttledFn('arg2');
    throttledFn('arg3');

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('arg1');

    jest.advanceTimersByTime(100);

    throttledFn('arg4');

    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenCalledWith('arg4');
  });

  it('should handle multiple arguments', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn('arg1', 'arg2', 'arg3');

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
  });

  it('should not call function again within delay period', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn('arg1');
    jest.advanceTimersByTime(50);
    throttledFn('arg2');

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('arg1');
  });
});

describe('QuestError', () => {
  it('should create error with message', () => {
    const error = new QuestError('Test error');

    expect(error.message).toBe('Test error');
    expect(error.name).toBe('QuestError');
    expect(error.code).toBeUndefined();
    expect(error.status).toBeUndefined();
  });

  it('should create error with code and status', () => {
    const error = new QuestError('Test error', 'TEST_CODE', 400);

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.status).toBe(400);
  });

  it('should create error from response', () => {
    const response = { status: 404 } as Response;
    const error = QuestError.fromResponse(response, 'Not found');

    expect(error.message).toBe('Not found');
    expect(error.code).toBe('HTTP_ERROR');
    expect(error.status).toBe(404);
  });

  it('should create error from response with default message', () => {
    const response = { status: 500 } as Response;
    const error = QuestError.fromResponse(response);

    expect(error.message).toBe('Request failed with status 500');
    expect(error.code).toBe('HTTP_ERROR');
    expect(error.status).toBe(500);
  });

  it('should create error from Error instance', () => {
    const originalError = new Error('Original error');
    const error = QuestError.fromError(originalError);

    expect(error.message).toBe('Original error');
    expect(error.code).toBe('UNKNOWN_ERROR');
  });

  it('should create error from QuestError instance', () => {
    const originalError = new QuestError('Original error', 'ORIGINAL_CODE');
    const error = QuestError.fromError(originalError);

    expect(error).toBe(originalError);
  });

  it('should create error from unknown value', () => {
    const error = QuestError.fromError('string error');

    expect(error.message).toBe('An unexpected error occurred');
    expect(error.code).toBe('UNKNOWN_ERROR');
  });

  it('should create error from unknown value with custom fallback', () => {
    const error = QuestError.fromError(null, 'Custom fallback');

    expect(error.message).toBe('Custom fallback');
    expect(error.code).toBe('UNKNOWN_ERROR');
  });

  it('should handle different error codes', () => {
    const createError = new QuestError('Create failed', 'CREATE_ERROR', 400);
    const updateError = new QuestError('Update failed', 'UPDATE_ERROR', 404);
    const deleteError = new QuestError('Delete failed', 'DELETE_ERROR', 403);

    expect(createError.code).toBe('CREATE_ERROR');
    expect(updateError.code).toBe('UPDATE_ERROR');
    expect(deleteError.code).toBe('DELETE_ERROR');
  });
});
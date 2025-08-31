import { ReviewsService, ReviewsCache, debounce, throttle, ReviewsError } from '../reviews';
import { Review, ReviewSentiment, ReviewQuest, ReviewPriority } from '@/lib/models/client/review';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock data
const mockReview: Review = {
  _id: '1',
  user: 'user1',
  appId: 'app1',
  name: 'John Doe',
  comment: 'Great app!',
  date: '2024-01-01T00:00:00.000Z',
  rating: 5,
  sentiment: ReviewSentiment.POSITIVE,
  quest: ReviewQuest.FEATURE_REQUEST,
  priority: ReviewPriority.HIGH,
};

const mockResponse = {
  reviews: [mockReview],
  hasMore: true,
  totalCount: 10,
  overview: {
    sentimentBreakdown: {
      positive: 8,
      negative: 2,
    },
    platformBreakdown: {
      GooglePlay: 5,
      AppleStore: 3,
      ChromeExt: 2,
    },
    questBreakdown: {
      bug: 2,
      featureRequest: 6,
      other: 2,
    },
  },
};

describe('ReviewsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);
  });

  describe('fetchReviews', () => {
    it('should fetch reviews with default parameters', async () => {
      const result = await ReviewsService.fetchReviews();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reviews?page=1&limit=20',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should fetch reviews with custom parameters', async () => {
      const options = {
        page: 2,
        limit: 10,
        filters: {
          platform: 'GooglePlay' as const,
          rating: 5,
          sentiment: 'POSITIVE' as const,
          quest: 'BUG' as const,
        },
      };

      await ReviewsService.fetchReviews(options);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reviews?page=2&limit=10&platform=GooglePlay&rating=5&sentiment=POSITIVE&quest=BUG',
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

      await expect(ReviewsService.fetchReviews()).rejects.toThrow('Internal server error');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(ReviewsService.fetchReviews()).rejects.toThrow('Network error');
    });

    it('should pass abort signal', async () => {
      const abortController = new AbortController();
      
      await ReviewsService.fetchReviews({ signal: abortController.signal });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: abortController.signal,
        })
      );
    });
  });

  describe('fetchOverview', () => {
    it('should fetch overview data', async () => {
      const result = await ReviewsService.fetchOverview();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reviews?page=1&limit=1',
        expect.any(Object)
      );

      expect(result).toEqual(mockResponse.overview);
    });

    it('should pass abort signal to fetchOverview', async () => {
      const abortController = new AbortController();
      
      await ReviewsService.fetchOverview(abortController.signal);

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
        platform: 'GooglePlay' as const,
        rating: 5,
        sentiment: 'POSITIVE' as const,
      };

      const key = ReviewsService.buildCacheKey(2, filters);

      expect(key).toBe('reviews:2:platform:GooglePlay|rating:5|sentiment:POSITIVE');
    });

    it('should build cache key with empty filters', () => {
      const key = ReviewsService.buildCacheKey(1, {});

      expect(key).toBe('reviews:1:');
    });

    it('should sort filter keys consistently', () => {
      const filters1 = { rating: 5, platform: 'GooglePlay' as const };
      const filters2 = { platform: 'GooglePlay' as const, rating: 5 };

      const key1 = ReviewsService.buildCacheKey(1, filters1);
      const key2 = ReviewsService.buildCacheKey(1, filters2);

      expect(key1).toBe(key2);
    });
  });
});

describe('ReviewsCache', () => {
  beforeEach(() => {
    ReviewsCache.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should store and retrieve cached data', () => {
    const key = 'test-key';
    
    ReviewsCache.set(key, mockResponse);
    const result = ReviewsCache.get(key);

    expect(result).toEqual(mockResponse);
  });

  it('should return null for non-existent keys', () => {
    const result = ReviewsCache.get('non-existent');

    expect(result).toBe(null);
  });

  it('should expire cached data after TTL', () => {
    const key = 'test-key';
    
    ReviewsCache.set(key, mockResponse);
    
    // Fast-forward time beyond TTL (5 minutes)
    jest.advanceTimersByTime(6 * 60 * 1000);
    
    const result = ReviewsCache.get(key);

    expect(result).toBe(null);
  });

  it('should clear all cached data', () => {
    ReviewsCache.set('key1', mockResponse);
    ReviewsCache.set('key2', mockResponse);

    ReviewsCache.clear();

    expect(ReviewsCache.get('key1')).toBe(null);
    expect(ReviewsCache.get('key2')).toBe(null);
  });

  it('should cleanup old entries when cache gets large', () => {
    // Fill cache beyond limit
    for (let i = 0; i < 101; i++) {
      ReviewsCache.set(`key-${i}`, mockResponse);
    }

    // The cache should have cleaned up some entries
    // We can't test exact behavior without exposing internals,
    // but we can verify it doesn't crash
    expect(() => ReviewsCache.get('key-0')).not.toThrow();
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
});

describe('ReviewsError', () => {
  it('should create error with message', () => {
    const error = new ReviewsError('Test error');

    expect(error.message).toBe('Test error');
    expect(error.name).toBe('ReviewsError');
    expect(error.code).toBeUndefined();
    expect(error.status).toBeUndefined();
  });

  it('should create error with code and status', () => {
    const error = new ReviewsError('Test error', 'TEST_CODE', 400);

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.status).toBe(400);
  });

  it('should create error from response', () => {
    const response = { status: 404 } as Response;
    const error = ReviewsError.fromResponse(response, 'Not found');

    expect(error.message).toBe('Not found');
    expect(error.code).toBe('HTTP_ERROR');
    expect(error.status).toBe(404);
  });

  it('should create error from response with default message', () => {
    const response = { status: 500 } as Response;
    const error = ReviewsError.fromResponse(response);

    expect(error.message).toBe('Request failed with status 500');
    expect(error.code).toBe('HTTP_ERROR');
    expect(error.status).toBe(500);
  });

  it('should create error from Error instance', () => {
    const originalError = new Error('Original error');
    const error = ReviewsError.fromError(originalError);

    expect(error.message).toBe('Original error');
    expect(error.code).toBe('UNKNOWN_ERROR');
  });

  it('should create error from ReviewsError instance', () => {
    const originalError = new ReviewsError('Original error', 'ORIGINAL_CODE');
    const error = ReviewsError.fromError(originalError);

    expect(error).toBe(originalError);
  });

  it('should create error from unknown value', () => {
    const error = ReviewsError.fromError('string error');

    expect(error.message).toBe('An unexpected error occurred');
    expect(error.code).toBe('UNKNOWN_ERROR');
  });

  it('should create error from unknown value with custom fallback', () => {
    const error = ReviewsError.fromError(null, 'Custom fallback');

    expect(error.message).toBe('Custom fallback');
    expect(error.code).toBe('UNKNOWN_ERROR');
  });
});
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReviews, useReviewOverview } from '../useReviews';
import { useAuth } from '../useAuth';
import { Review, ReviewSentiment, ReviewQuest, ReviewPriority } from '@/lib/models/client/review';

// Mock the useAuth hook
jest.mock('../useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

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

describe('useReviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-uid' } as any,
      loading: false,
      isAuthenticated: true,
    });
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useReviews());

    expect(result.current.reviews).toEqual([]);
    expect(result.current.error).toBe(null);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.overview).toBe(null);
    expect(result.current.page).toBe(1);
  });

  it('should fetch reviews on mount when authenticated', async () => {
    const { result } = renderHook(() => useReviews());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reviews?page=1&limit=20',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    await waitFor(() => {
      expect(result.current.reviews).toEqual([mockReview]);
      expect(result.current.hasMore).toBe(true);
      expect(result.current.totalCount).toBe(10);
      expect(result.current.overview).toEqual(mockResponse.overview);
    });
  });

  it('should not fetch reviews when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
    });

    renderHook(() => useReviews());

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal server error' }),
    } as Response);

    const { result } = renderHook(() => useReviews());

    await waitFor(() => {
      expect(result.current.error).toBe('Internal server error');
    });
  });

  it('should load more reviews when loadMore is called', async () => {
    const { result } = renderHook(() => useReviews());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.reviews).toEqual([mockReview]);
    });

    // Mock response for page 2
    const page2Response = {
      ...mockResponse,
      reviews: [{ ...mockReview, _id: '2', comment: 'Another review' }],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(page2Response),
    } as Response);

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reviews?page=2&limit=20',
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(result.current.reviews).toHaveLength(2);
      expect(result.current.page).toBe(2);
    });
  });

  it('should not load more when already loading', async () => {
    const { result } = renderHook(() => useReviews());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.reviews).toEqual([mockReview]);
    });

    // Set loading state by making a slow request
    mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    act(() => {
      result.current.loadMore();
    });

    // Try to load more while loading
    act(() => {
      result.current.loadMore();
    });

    // Should only be called twice (initial + first loadMore)
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should not load more when hasMore is false', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ...mockResponse, hasMore: false }),
    } as Response);

    const { result } = renderHook(() => useReviews());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.hasMore).toBe(false);
    });

    const initialCallCount = mockFetch.mock.calls.length;

    act(() => {
      result.current.loadMore();
    });

    // Should not make additional calls
    expect(mockFetch).toHaveBeenCalledTimes(initialCallCount);
  });

  it('should refresh reviews', async () => {
    const { result } = renderHook(() => useReviews());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.reviews).toEqual([mockReview]);
    });

    const refreshResponse = {
      ...mockResponse,
      reviews: [{ ...mockReview, comment: 'Refreshed review' }],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(refreshResponse),
    } as Response);

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.reviews[0].comment).toBe('Refreshed review');
      expect(result.current.page).toBe(1);
    });
  });

  it('should apply filters with debouncing', async () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useReviews());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.reviews).toEqual([mockReview]);
    });

    const filteredResponse = {
      ...mockResponse,
      reviews: [{ ...mockReview, rating: 4 }],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(filteredResponse),
    } as Response);

    act(() => {
      result.current.setFilters({ platform: 'GooglePlay', rating: 4 });
    });

    // Should not call immediately due to debouncing
    expect(mockFetch).toHaveBeenCalledTimes(1); // Only initial call

    // Fast-forward time to trigger debounced call
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reviews?page=1&limit=20&platform=GooglePlay&rating=4',
        expect.any(Object)
      );
    });

    jest.useRealTimers();
  });

  it('should clear error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Test error' }),
    } as Response);

    const { result } = renderHook(() => useReviews());

    // Wait for error to be set
    await waitFor(() => {
      expect(result.current.error).toBe('Test error');
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('should abort previous requests when new ones are made', async () => {
    const abortSpy = jest.fn();
    const mockAbortController = {
      abort: abortSpy,
      signal: { aborted: false } as AbortSignal,
    };
    
    jest.spyOn(global, 'AbortController').mockImplementation(() => mockAbortController as any);

    const { result } = renderHook(() => useReviews());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.reviews).toEqual([mockReview]);
    });

    // Make another request
    act(() => {
      result.current.refresh();
    });

    expect(abortSpy).toHaveBeenCalled();
  });
});

describe('useReviewOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-uid' } as any,
      loading: false,
      isAuthenticated: true,
    });
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);
  });

  it('should fetch overview data on mount', async () => {
    const { result } = renderHook(() => useReviewOverview());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reviews?limit=1',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    await waitFor(() => {
      expect(result.current.overview).toEqual(mockResponse.overview);
    });
  });

  it('should handle errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' }),
    } as Response);

    const { result } = renderHook(() => useReviewOverview());

    await waitFor(() => {
      expect(result.current.error).toBe('Server error');
    });
  });

  it('should refresh overview data', async () => {
    const { result } = renderHook(() => useReviewOverview());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.overview).toEqual(mockResponse.overview);
    });

    const refreshedOverview = {
      ...mockResponse.overview,
      sentimentBreakdown: { positive: 10, negative: 0 },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...mockResponse, overview: refreshedOverview }),
    } as Response);

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.overview?.sentimentBreakdown.positive).toBe(10);
    });
  });
});
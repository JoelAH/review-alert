'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Review } from '@/lib/models/client/review';
import { useAuth } from './useAuth';
import { NotificationService } from '@/lib/services/notifications';
import { ApiRetryMechanism } from '@/lib/utils/retryMechanism';

export interface ReviewFilters {
  platform?: 'GooglePlay' | 'AppleStore' | 'ChromeExt';
  rating?: number;
  sentiment?: 'POSITIVE' | 'NEGATIVE';
  quest?: 'BUG' | 'FEATURE_REQUEST' | 'OTHER';
  search?: string;
}

export interface ReviewOverview {
  sentimentBreakdown: {
    positive: number;
    negative: number;
  };
  platformBreakdown: {
    GooglePlay: number;
    AppleStore: number;
    ChromeExt: number;
  };
  questBreakdown: {
    bug: number;
    featureRequest: number;
    other: number;
  };
}

export interface ReviewsResponse {
  reviews: Review[];
  hasMore: boolean;
  totalCount: number;
  overview: ReviewOverview;
}

export interface UseReviewsState {
  reviews: Review[];
  loading: boolean;
  initialLoading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasError: boolean;
  retryCount: number;
  hasMore: boolean;
  totalCount: number;
  overview: ReviewOverview | null;
  page: number;
}

export interface UseReviewsActions {
  loadMore: () => void;
  refresh: () => void;
  setFilters: (filters: ReviewFilters) => void;
  clearError: () => void;
  retry: () => void;
}

export interface UseReviewsReturn extends UseReviewsState, UseReviewsActions {}

const DEBOUNCE_DELAY = 300; // ms
const DEFAULT_LIMIT = 20;
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Custom hook for fetching reviews with pagination and filtering
 * Includes debounced API calls, comprehensive error handling, and retry mechanisms
 */
export function useReviews(initialFilters: ReviewFilters = {}): UseReviewsReturn {
  const { isAuthenticated } = useAuth();
  
  // State management
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [overview, setOverview] = useState<ReviewOverview | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFiltersState] = useState<ReviewFilters>(initialFilters);
  
  // Refs for managing debounced calls and preventing race conditions
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();
  const isInitialLoadRef = useRef(true);
  const retryMechanismRef = useRef<ApiRetryMechanism>();

  // Initialize retry mechanism
  useEffect(() => {
    retryMechanismRef.current = new ApiRetryMechanism({
      maxAttempts: MAX_RETRY_ATTEMPTS,
      onRetry: (error, attempt) => {
        console.log(`Retrying API call (attempt ${attempt}):`, error);
        setRetryCount(attempt);
      },
      onMaxAttemptsReached: (error) => {
        console.error('Max retry attempts reached:', error);
        NotificationService.handleApiError(error, 'Failed to load reviews after multiple attempts');
      },
    });
  }, []);

  /**
   * Fetch reviews from the API with current filters and pagination
   */
  const fetchReviews = useCallback(async (
    currentPage: number,
    currentFilters: ReviewFilters,
    append: boolean = false
  ) => {
    if (!isAuthenticated) {
      const errorMsg = 'User not authenticated';
      setError(errorMsg);
      setHasError(true);
      NotificationService.error('Please sign in to view your reviews');
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Set appropriate loading states
      if (currentPage === 1 && !append) {
        setInitialLoading(true);
      } else if (append) {
        setLoadingMore(true);
      }
      
      setLoading(true);
      setError(null);
      setHasError(false);
      setRetryCount(0);

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: DEFAULT_LIMIT.toString(),
      });

      // Add filters to query params
      if (currentFilters.platform) {
        params.append('platform', currentFilters.platform);
      }
      if (currentFilters.rating) {
        params.append('rating', currentFilters.rating.toString());
      }
      if (currentFilters.sentiment) {
        params.append('sentiment', currentFilters.sentiment);
      }
      if (currentFilters.quest) {
        params.append('quest', currentFilters.quest);
      }

      // Use retry mechanism for the API call
      const data = await retryMechanismRef.current!.execute(async () => {
        const response = await fetch(`/api/reviews?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortControllerRef.current!.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(errorData.error || `HTTP error! status: ${response.status}`);
          (error as any).status = response.status;
          throw error;
        }

        return response.json();
      });

      // Update state based on whether we're appending or replacing
      if (append) {
        setReviews(prev => [...prev, ...data.reviews]);
      } else {
        setReviews(data.reviews);
      }

      setHasMore(data.hasMore);
      setTotalCount(data.totalCount);
      setOverview(data.overview);
      setPage(currentPage);

      // Show success notification for initial loads if there were previous errors
      if (hasError && currentPage === 1) {
        NotificationService.success('Reviews loaded successfully');
      }

    } catch (err) {
      // Don't set error for aborted requests
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reviews';
      setError(errorMessage);
      setHasError(true);
      console.error('Error fetching reviews:', err);

      // Show toast notification for errors
      NotificationService.handleApiError(err, 'Failed to load reviews');

    } finally {
      setLoading(false);
      setInitialLoading(false);
      setLoadingMore(false);
    }
  }, [isAuthenticated, hasError]);

  /**
   * Debounced version of fetchReviews for filter changes
   */
  const debouncedFetchReviews = useCallback((
    currentPage: number,
    currentFilters: ReviewFilters,
    append: boolean = false
  ) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      fetchReviews(currentPage, currentFilters, append);
    }, DEBOUNCE_DELAY);
  }, [fetchReviews]);

  /**
   * Load more reviews (pagination)
   */
  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      fetchReviews(nextPage, filters, true);
    }
  }, [loading, loadingMore, hasMore, page, filters, fetchReviews]);

  /**
   * Refresh reviews (reset to first page)
   */
  const refresh = useCallback(() => {
    setPage(1);
    setRetryCount(0);
    fetchReviews(1, filters, false);
  }, [filters, fetchReviews]);

  /**
   * Retry the last failed operation
   */
  const retry = useCallback(() => {
    if (hasError) {
      fetchReviews(page, filters, false);
    }
  }, [hasError, page, filters, fetchReviews]);

  /**
   * Update filters and trigger new search
   */
  const setFilters = useCallback((newFilters: ReviewFilters) => {
    setFiltersState(newFilters);
    setPage(1);
    setRetryCount(0);
    
    // Use debounced fetch for filter changes to avoid excessive API calls
    debouncedFetchReviews(1, newFilters, false);
  }, [debouncedFetchReviews]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setHasError(false);
    setRetryCount(0);
  }, []);

  // Initial load effect
  useEffect(() => {
    if (isAuthenticated && isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      fetchReviews(1, filters, false);
    }
  }, [isAuthenticated, fetchReviews, filters]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clear debounce timeout on unmount
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      // Abort any ongoing request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    reviews,
    loading,
    initialLoading,
    loadingMore,
    error,
    hasError,
    retryCount,
    hasMore,
    totalCount,
    overview,
    page,
    
    // Actions
    loadMore,
    refresh,
    setFilters,
    clearError,
    retry,
  };
}

/**
 * Simplified hook for just fetching review overview statistics
 * Useful for components that only need overview data
 */
export function useReviewOverview(): {
  overview: ReviewOverview | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const [overview, setOverview] = useState<ReviewOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchOverview = useCallback(async () => {
    if (!isAuthenticated) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/reviews?limit=1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: ReviewsResponse = await response.json();
      setOverview(data.overview);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch overview';
      setError(errorMessage);
      console.error('Error fetching overview:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const refresh = useCallback(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOverview();
    }
  }, [isAuthenticated, fetchOverview]);

  return {
    overview,
    loading,
    error,
    refresh,
  };
}
'use client';

import { Review } from '@/lib/models/client/review';

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

export interface FetchReviewsOptions {
  page?: number;
  limit?: number;
  filters?: ReviewFilters;
  signal?: AbortSignal;
}

/**
 * Service class for handling review API operations
 */
export class ReviewsService {
  private static readonly DEFAULT_LIMIT = 20;
  private static readonly API_BASE_URL = '/api/reviews';

  /**
   * Fetch reviews with pagination and filtering
   */
  static async fetchReviews(options: FetchReviewsOptions = {}): Promise<ReviewsResponse> {
    const {
      page = 1,
      limit = this.DEFAULT_LIMIT,
      filters = {},
      signal
    } = options;

    // Build query parameters
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    // Add filters to query params
    if (filters.platform) {
      params.append('platform', filters.platform);
    }
    if (filters.rating) {
      params.append('rating', filters.rating.toString());
    }
    if (filters.sentiment) {
      params.append('sentiment', filters.sentiment);
    }
    if (filters.quest) {
      params.append('quest', filters.quest);
    }

    const response = await fetch(`${this.API_BASE_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Fetch only the overview statistics
   */
  static async fetchOverview(signal?: AbortSignal): Promise<ReviewOverview> {
    const response = await this.fetchReviews({
      page: 1,
      limit: 1,
      signal
    });
    
    return response.overview;
  }

  /**
   * Build cache key for review requests
   */
  static buildCacheKey(page: number, filters: ReviewFilters): string {
    const filterKeys = Object.keys(filters).sort();
    const filterString = filterKeys
      .map(key => `${key}:${filters[key as keyof ReviewFilters]}`)
      .join('|');
    
    return `reviews:${page}:${filterString}`;
  }
}

/**
 * Simple cache implementation for review data
 */
export class ReviewsCache {
  private static cache = new Map<string, { data: ReviewsResponse; timestamp: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data if it exists and is not expired
   */
  static get(key: string): ReviewsResponse | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    const isExpired = Date.now() - cached.timestamp > this.CACHE_TTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached data
   */
  static set(key: string, data: ReviewsResponse): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Clean up old entries if cache gets too large
    if (this.cache.size > 100) {
      this.cleanup();
    }
  }

  /**
   * Clear all cached data
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  private static cleanup(): void {
    const now = Date.now();
    Array.from(this.cache.entries()).map(([key, value]) => {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    })
  }
}

/**
 * Utility function to create a debounced version of any function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Utility function to create a throttled version of any function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * Error handling utility for review operations
 */
export class ReviewsError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'ReviewsError';
  }

  static fromResponse(response: Response, message?: string): ReviewsError {
    return new ReviewsError(
      message || `Request failed with status ${response.status}`,
      'HTTP_ERROR',
      response.status
    );
  }

  static fromError(error: unknown, fallbackMessage = 'An unexpected error occurred'): ReviewsError {
    if (error instanceof ReviewsError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new ReviewsError(error.message, 'UNKNOWN_ERROR');
    }
    
    return new ReviewsError(fallbackMessage, 'UNKNOWN_ERROR');
  }
}
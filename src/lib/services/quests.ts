'use client';

import { Quest, QuestType, QuestPriority, QuestState } from '@/lib/models/client/quest';

export interface QuestFilters {
  type?: QuestType;
  priority?: QuestPriority;
  state?: QuestState;
  search?: string;
}

export interface QuestOverview {
  stateBreakdown: {
    open: number;
    inProgress: number;
    done: number;
  };
  priorityBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
  typeBreakdown: {
    bugFix: number;
    featureRequest: number;
    improvement: number;
    research: number;
    other: number;
  };
}

export interface QuestsResponse {
  quests: Quest[];
  hasMore: boolean;
  totalCount: number;
  overview: QuestOverview;
}

export interface FetchQuestsOptions {
  page?: number;
  limit?: number;
  filters?: QuestFilters;
  signal?: AbortSignal;
}

export interface CreateQuestData {
  title: string;
  details?: string;
  type: QuestType;
  priority: QuestPriority;
  reviewId?: string;
  state?: QuestState;
}

export interface UpdateQuestData {
  title?: string;
  details?: string;
  type?: QuestType;
  priority?: QuestPriority;
  state?: QuestState;
}

/**
 * Service class for handling quest API operations
 */
export class QuestService {
  private static readonly DEFAULT_LIMIT = 20;
  private static readonly API_BASE_URL = '/api/quests';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Fetch quests with pagination and filtering
   */
  static async fetchQuests(options: FetchQuestsOptions = {}): Promise<QuestsResponse> {
    const {
      page = 1,
      limit = this.DEFAULT_LIMIT,
      filters = {},
      signal
    } = options;

    return this.withRetry(async () => {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Add filters to query params
      if (filters.type) {
        params.append('type', filters.type);
      }
      if (filters.priority) {
        params.append('priority', filters.priority);
      }
      if (filters.state) {
        params.append('state', filters.state);
      }
      if (filters.search) {
        params.append('search', filters.search);
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
        throw new QuestError(
          errorData.error || `Failed to fetch quests: ${response.status}`,
          'FETCH_ERROR',
          response.status
        );
      }

      return response.json();
    }, signal);
  }

  /**
   * Create a new quest
   */
  static async createQuest(questData: CreateQuestData, signal?: AbortSignal): Promise<Quest> {
    return this.withRetry(async () => {
      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questData),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new QuestError(
          errorData.error || `Failed to create quest: ${response.status}`,
          'CREATE_ERROR',
          response.status
        );
      }

      const result = await response.json();

      // Handle XP award result if present and valid
      if (result.xpAwarded && typeof result.xpAwarded === 'object' && result.xpAwarded.xpAwarded) {
        // Import dynamically to avoid circular dependencies
        const { GamificationClientService } = await import('./gamificationClient');
        const { XPAction } = await import('@/types/gamification');

        GamificationClientService.handleXPAwardResult(result.xpAwarded, XPAction.QUEST_CREATED);
      }

      // Clear cache after successful creation
      QuestCache.clear();

      return result.quest;
    }, signal);
  }

  /**
   * Update an existing quest
   */
  static async updateQuest(questId: string, updates: UpdateQuestData, signal?: AbortSignal): Promise<Quest> {
    return this.withRetry(async () => {
      const response = await fetch(`${this.API_BASE_URL}/${questId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new QuestError(
          errorData.error || `Failed to update quest: ${response.status}`,
          'UPDATE_ERROR',
          response.status
        );
      }

      const result = await response.json();

      // Handle XP award result if present and valid (for state changes)
      if (result.xpAwarded && typeof result.xpAwarded === 'object' && result.xpAwarded.xpAwarded) {
        // Import dynamically to avoid circular dependencies
        const { GamificationClientService } = await import('./gamificationClient');
        const { XPAction } = await import('@/types/gamification');

        // Determine XP action based on state change
        let xpAction = XPAction.QUEST_IN_PROGRESS; // Default
        if (updates.state === QuestState.IN_PROGRESS) {
          xpAction = XPAction.QUEST_IN_PROGRESS;
        } else if (updates.state === QuestState.DONE) {
          xpAction = XPAction.QUEST_COMPLETED;
        }

        GamificationClientService.handleXPAwardResult(result.xpAwarded, xpAction);
      }

      // Clear cache after successful update
      QuestCache.clear();

      return result.quest;
    }, signal);
  }

  /**
   * Delete a quest
   */
  static async deleteQuest(questId: string, signal?: AbortSignal): Promise<void> {
    return this.withRetry(async () => {
      const response = await fetch(`${this.API_BASE_URL}/${questId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new QuestError(
          errorData.error || `Failed to delete quest: ${response.status}`,
          'DELETE_ERROR',
          response.status
        );
      }

      // Clear cache after successful deletion
      QuestCache.clear();
    }, signal);
  }

  /**
   * Fetch only the overview statistics
   */
  static async fetchOverview(signal?: AbortSignal): Promise<QuestOverview> {
    const response = await this.fetchQuests({
      page: 1,
      limit: 1,
      signal
    });

    return response.overview;
  }

  /**
   * Build cache key for quest requests
   */
  static buildCacheKey(page: number, filters: QuestFilters): string {
    const filterKeys = Object.keys(filters).sort();
    const filterString = filterKeys
      .map(key => `${key}:${filters[key as keyof QuestFilters]}`)
      .join('|');

    return `quests:${page}:${filterString}`;
  }

  /**
   * Fetch quests with caching
   */
  static async fetchQuestsWithCache(options: FetchQuestsOptions = {}): Promise<QuestsResponse> {
    const { page = 1, filters = {} } = options;
    const cacheKey = this.buildCacheKey(page, filters);

    // Try to get from cache first
    const cached = QuestCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API and cache the result
    const result = await this.fetchQuests(options);
    QuestCache.set(cacheKey, result);

    return result;
  }

  /**
   * Retry mechanism for API calls
   */
  private static async withRetry<T>(
    operation: () => Promise<T>,
    signal?: AbortSignal,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Don't retry if request was aborted
      if (signal?.aborted) {
        throw error;
      }

      // Don't retry client errors (4xx) except for 408 (timeout) and 429 (rate limit)
      if (error instanceof QuestError && error.status) {
        const shouldRetry = error.status >= 500 || error.status === 408 || error.status === 429;
        if (!shouldRetry || retryCount >= this.MAX_RETRIES) {
          throw error;
        }
      } else if (retryCount >= this.MAX_RETRIES) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      const delay = this.RETRY_DELAY * Math.pow(2, retryCount);
      await this.sleep(delay);

      return this.withRetry(operation, signal, retryCount + 1);
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if the quest API is available
   */
  static async healthCheck(signal?: AbortSignal): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/health`, {
        method: 'GET',
        signal,
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get user-friendly error message
   */
  static getErrorMessage(error: unknown): string {
    if (error instanceof QuestError) {
      switch (error.code) {
        case 'FETCH_ERROR':
          return 'Failed to load quests. Please check your connection and try again.';
        case 'CREATE_ERROR':
          return 'Failed to create quest. Please try again.';
        case 'UPDATE_ERROR':
          return 'Failed to update quest. Please try again.';
        case 'DELETE_ERROR':
          return 'Failed to delete quest. Please try again.';
        case 'HTTP_ERROR':
          if (error.status === 401) {
            return 'You need to sign in to manage quests.';
          }
          if (error.status === 403) {
            return 'You don\'t have permission to perform this action.';
          }
          if (error.status === 404) {
            return 'Quest not found. It may have been deleted.';
          }
          if (error.status === 429) {
            return 'Too many requests. Please wait a moment and try again.';
          }
          if (error.status && error.status >= 500) {
            return 'Server error. Please try again later.';
          }
          break;
        default:
          return error.message;
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Simple cache implementation for quest data
 */
export class QuestCache {
  private static cache = new Map<string, { data: QuestsResponse; timestamp: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data if it exists and is not expired
   */
  static get(key: string): QuestsResponse | null {
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
  static set(key: string, data: QuestsResponse): void {
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
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    });
  }
}

/**
 * Error handling utility for quest operations
 */
export class QuestError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'QuestError';
  }

  static fromResponse(response: Response, message?: string): QuestError {
    const retryable = response.status >= 500 || response.status === 408 || response.status === 429;
    return new QuestError(
      message || `Request failed with status ${response.status}`,
      'HTTP_ERROR',
      response.status,
      retryable
    );
  }

  static fromError(error: unknown, fallbackMessage = 'An unexpected error occurred'): QuestError {
    if (error instanceof QuestError) {
      return error;
    }

    if (error instanceof Error) {
      // Network errors are typically retryable
      const isNetworkError = error.message.toLowerCase().includes('fetch') ||
        error.message.toLowerCase().includes('network') ||
        error.message.toLowerCase().includes('connection') ||
        error.name === 'TypeError' && error.message.includes('fetch');
      return new QuestError(error.message, 'UNKNOWN_ERROR', undefined, isNetworkError);
    }

    return new QuestError(fallbackMessage, 'UNKNOWN_ERROR');
  }

  /**
   * Check if this error indicates the user should retry
   */
  get shouldRetry(): boolean {
    return this.retryable;
  }

  /**
   * Check if this error indicates a network/connectivity issue
   */
  get isNetworkError(): boolean {
    return this.code === 'FETCH_ERROR' ||
      this.code === 'HTTP_ERROR' && (this.status === undefined || this.status >= 500) ||
      this.message.toLowerCase().includes('network') ||
      this.message.toLowerCase().includes('connection');
  }

  /**
   * Check if this error indicates an authentication issue
   */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
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
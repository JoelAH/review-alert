'use client';

import { Quest, QuestType, QuestPriority, QuestState, CreateQuestInput, UpdateQuestInput } from '@/lib/models/client/quest';

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
      throw new QuestError(errorData.error || `HTTP error! status: ${response.status}`, 'HTTP_ERROR', response.status);
    }

    return response.json();
  }

  /**
   * Create a new quest
   */
  static async createQuest(questData: CreateQuestData, signal?: AbortSignal): Promise<Quest> {
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
      throw new QuestError(errorData.error || `Failed to create quest: ${response.status}`, 'CREATE_ERROR', response.status);
    }

    const result = await response.json();
    
    // Clear cache after successful creation
    QuestCache.clear();
    
    return result.quest;
  }

  /**
   * Update an existing quest
   */
  static async updateQuest(questId: string, updates: UpdateQuestData, signal?: AbortSignal): Promise<Quest> {
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
      throw new QuestError(errorData.error || `Failed to update quest: ${response.status}`, 'UPDATE_ERROR', response.status);
    }

    const result = await response.json();
    
    // Clear cache after successful update
    QuestCache.clear();
    
    return result.quest;
  }

  /**
   * Delete a quest
   */
  static async deleteQuest(questId: string, signal?: AbortSignal): Promise<void> {
    const response = await fetch(`${this.API_BASE_URL}/${questId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new QuestError(errorData.error || `Failed to delete quest: ${response.status}`, 'DELETE_ERROR', response.status);
    }

    // Clear cache after successful deletion
    QuestCache.clear();
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
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Error handling utility for quest operations
 */
export class QuestError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'QuestError';
  }

  static fromResponse(response: Response, message?: string): QuestError {
    return new QuestError(
      message || `Request failed with status ${response.status}`,
      'HTTP_ERROR',
      response.status
    );
  }

  static fromError(error: unknown, fallbackMessage = 'An unexpected error occurred'): QuestError {
    if (error instanceof QuestError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new QuestError(error.message, 'UNKNOWN_ERROR');
    }
    
    return new QuestError(fallbackMessage, 'UNKNOWN_ERROR');
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
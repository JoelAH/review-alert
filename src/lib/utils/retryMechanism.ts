'use client';

/**
 * Configuration options for retry mechanism
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts?: number;
  /** Initial delay between retries in milliseconds */
  initialDelay?: number;
  /** Maximum delay between retries in milliseconds */
  maxDelay?: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier?: number;
  /** Whether to use exponential backoff */
  useExponentialBackoff?: boolean;
  /** Function to determine if an error should trigger a retry */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Callback called before each retry attempt */
  onRetry?: (error: unknown, attempt: number) => void;
  /** Callback called when all retries are exhausted */
  onMaxAttemptsReached?: (error: unknown) => void;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  useExponentialBackoff: true,
  shouldRetry: (error: unknown) => {
    // Default: retry on network errors, server errors, and timeouts
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('fetch') ||
        message.includes('timeout') ||
        message.includes('500') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504')
      );
    }
    return false;
  },
  onRetry: () => {},
  onMaxAttemptsReached: () => {},
};

/**
 * Utility class for implementing retry mechanisms with exponential backoff
 */
export class RetryMechanism {
  private options: Required<RetryOptions>;

  constructor(options: RetryOptions = {}) {
    this.options = { ...DEFAULT_RETRY_OPTIONS, ...options };
  }

  /**
   * Execute a function with retry logic
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    
    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Check if we should retry this error
        if (!this.options.shouldRetry(error, attempt)) {
          throw error;
        }
        
        // If this was the last attempt, don't wait
        if (attempt === this.options.maxAttempts) {
          this.options.onMaxAttemptsReached(error);
          throw error;
        }
        
        // Call retry callback
        this.options.onRetry(error, attempt);
        
        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt);
        
        // Wait before next attempt
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Calculate delay for the given attempt number
   */
  private calculateDelay(attempt: number): number {
    if (!this.options.useExponentialBackoff) {
      return this.options.initialDelay;
    }
    
    const delay = this.options.initialDelay * Math.pow(this.options.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.options.maxDelay);
  }

  /**
   * Sleep for the specified number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a retryable version of a function
   */
  static wrap<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: RetryOptions = {}
  ): T {
    const retryMechanism = new RetryMechanism(options);
    
    return ((...args: Parameters<T>) => {
      return retryMechanism.execute(() => fn(...args));
    }) as T;
  }
}

/**
 * Simple retry function for one-off operations
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const retryMechanism = new RetryMechanism(options);
  return retryMechanism.execute(fn);
}

/**
 * Retry mechanism specifically for API calls
 */
export class ApiRetryMechanism extends RetryMechanism {
  constructor(options: RetryOptions = {}) {
    super({
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      shouldRetry: (error: unknown) => {
        // Retry on network errors and 5xx server errors
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          return (
            message.includes('network') ||
            message.includes('fetch') ||
            message.includes('timeout') ||
            message.includes('500') ||
            message.includes('502') ||
            message.includes('503') ||
            message.includes('504')
          );
        }
        
        // If it's a Response object, check status
        if (typeof error === 'object' && error !== null && 'status' in error) {
          const status = (error as any).status;
          return status >= 500 && status < 600;
        }
        
        return false;
      },
      ...options,
    });
  }
}

/**
 * Hook for using retry mechanism in React components
 */
export function useRetry(options: RetryOptions = {}) {
  const retryMechanism = new RetryMechanism(options);
  
  return {
    execute: retryMechanism.execute.bind(retryMechanism),
    retry: (fn: () => Promise<any>) => retryMechanism.execute(fn),
  };
}

/**
 * Hook specifically for API retry operations
 */
export function useApiRetry(options: RetryOptions = {}) {
  const retryMechanism = new ApiRetryMechanism(options);
  
  return {
    execute: retryMechanism.execute.bind(retryMechanism),
    retry: (fn: () => Promise<any>) => retryMechanism.execute(fn),
  };
}

/**
 * Utility function to create a retryable fetch function
 */
export function createRetryableFetch(options: RetryOptions = {}) {
  const retryMechanism = new ApiRetryMechanism(options);
  
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    return retryMechanism.execute(async () => {
      const response = await fetch(input, init);
      
      // Throw error for non-ok responses to trigger retry logic
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        (error as any).status = response.status;
        (error as any).response = response;
        throw error;
      }
      
      return response;
    });
  };
}

export default RetryMechanism;
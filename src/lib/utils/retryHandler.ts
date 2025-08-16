import { AuthError } from 'firebase/auth';
import { 
  isRetryableError, 
  getRetryDelay, 
  logAuthAttempt, 
  AUTH_ERROR_CODES,
  type AuthAttemptLog 
} from './authErrorHandler';

/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 16000
};

/**
 * Retry wrapper for authentication operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  logContext?: Partial<AuthAttemptLog>
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const result = await operation();
      
      // Log successful attempt if there were previous failures
      if (attempt > 1 && logContext) {
        logAuthAttempt({
          ...logContext,
          timestamp: new Date(),
          success: true,
          retryAttempt: attempt,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
        } as AuthAttemptLog);
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      const errorCode = error && typeof error === 'object' && 'code' in error ? (error as AuthError).code : 'unknown';
      
      // Log failed attempt
      if (logContext) {
        logAuthAttempt({
          ...logContext,
          timestamp: new Date(),
          success: false,
          errorCode,
          retryAttempt: attempt,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
        } as AuthAttemptLog);
      }
      
      // Check if we should retry
      const shouldRetry = config.shouldRetry 
        ? config.shouldRetry(error as Error)
        : isRetryableError(errorCode);
      
      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === config.maxAttempts || !shouldRetry) {
        // If we've exhausted retries, throw a specific error
        if (attempt === config.maxAttempts && shouldRetry) {
          const retryError = {
            code: AUTH_ERROR_CODES.RETRY_LIMIT_EXCEEDED,
            message: 'Maximum retry attempts exceeded',
            name: 'FirebaseError'
          } as AuthError;
          throw retryError;
        }
        throw error;
      }
      
      // Calculate delay for next attempt
      const delay = Math.min(
        getRetryDelay(attempt),
        config.maxDelay
      );
      
      // Call retry callback if provided
      config.onRetry?.(attempt, error as Error);
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Specialized retry wrapper for Firebase Auth operations
 */
export async function withAuthRetry<T>(
  operation: () => Promise<T>,
  action: 'signup' | 'login' | 'password-reset',
  email?: string,
  customOptions?: Partial<RetryOptions>
): Promise<T> {
  const logContext: Partial<AuthAttemptLog> = {
    action,
    email
  };
  
  const options: Partial<RetryOptions> = {
    ...customOptions,
    onRetry: (attempt, error) => {
      console.warn(`Auth operation retry ${attempt}:`, error.message);
      customOptions?.onRetry?.(attempt, error);
    }
  };
  
  return withRetry(operation, options, logContext);
}

/**
 * Network connectivity checker
 */
export function checkNetworkConnectivity(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.onLine) {
      resolve(false);
      return;
    }
    
    // Try to fetch a small resource to verify connectivity
    const timeout = setTimeout(() => resolve(false), 5000);
    
    fetch('/favicon.ico', { 
      method: 'HEAD',
      cache: 'no-cache'
    })
      .then(() => {
        clearTimeout(timeout);
        resolve(true);
      })
      .catch(() => {
        clearTimeout(timeout);
        resolve(false);
      });
  });
}

/**
 * Wait for network connectivity to be restored
 */
export function waitForNetworkConnectivity(
  maxWaitTime: number = 30000,
  checkInterval: number = 2000
): Promise<boolean> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkConnectivity = async () => {
      const isConnected = await checkNetworkConnectivity();
      
      if (isConnected) {
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime >= maxWaitTime) {
        resolve(false);
        return;
      }
      
      setTimeout(checkConnectivity, checkInterval);
    };
    
    checkConnectivity();
  });
}

/**
 * Enhanced retry with network connectivity check
 */
export async function withNetworkRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  logContext?: Partial<AuthAttemptLog>
): Promise<T> {
  const enhancedOptions: Partial<RetryOptions> = {
    ...options,
    shouldRetry: (error) => {
      const errorCode = error && typeof error === 'object' && 'code' in error ? (error as AuthError).code : 'unknown';
      
      // For network errors, check connectivity before retrying
      if (errorCode === AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED) {
        return true; // We'll handle connectivity check in the retry logic
      }
      
      return options.shouldRetry ? options.shouldRetry(error) : isRetryableError(errorCode);
    },
    onRetry: async (attempt, error) => {
      const errorCode = error && typeof error === 'object' && 'code' in error ? (error as AuthError).code : 'unknown';
      
      // For network errors, wait for connectivity
      if (errorCode === AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED) {
        console.log('Network error detected, checking connectivity...');
        const isConnected = await waitForNetworkConnectivity(10000);
        if (!isConnected) {
          console.warn('Network connectivity not restored, continuing with retry...');
        }
      }
      
      options.onRetry?.(attempt, error);
    }
  };
  
  return withRetry(operation, enhancedOptions, logContext);
}
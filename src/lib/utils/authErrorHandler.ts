import { AuthError } from 'firebase/auth';

/**
 * Comprehensive Firebase Auth error codes
 */
export const AUTH_ERROR_CODES = {
  // Email/Password Authentication Errors
  EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use',
  INVALID_EMAIL: 'auth/invalid-email',
  OPERATION_NOT_ALLOWED: 'auth/operation-not-allowed',
  WEAK_PASSWORD: 'auth/weak-password',
  USER_DISABLED: 'auth/user-disabled',
  USER_NOT_FOUND: 'auth/user-not-found',
  WRONG_PASSWORD: 'auth/wrong-password',
  INVALID_CREDENTIAL: 'auth/invalid-credential',
  
  // Network and System Errors
  TOO_MANY_REQUESTS: 'auth/too-many-requests',
  NETWORK_REQUEST_FAILED: 'auth/network-request-failed',
  INTERNAL_ERROR: 'auth/internal-error',
  TIMEOUT: 'auth/timeout',
  
  // OAuth Errors
  POPUP_BLOCKED: 'auth/popup-blocked',
  POPUP_CLOSED_BY_USER: 'auth/popup-closed-by-user',
  CANCELLED_POPUP_REQUEST: 'auth/cancelled-popup-request',
  
  // Custom Application Errors
  DISPOSABLE_EMAIL: 'app/disposable-email-blocked',
  VALIDATION_ERROR: 'app/validation-error',
  RETRY_LIMIT_EXCEEDED: 'app/retry-limit-exceeded'
} as const;

export type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES];

/**
 * Enhanced authentication error interface
 */
export interface EnhancedAuthError {
  code: string;
  message: string;
  userMessage: string;
  field?: 'email' | 'password' | 'general';
  retryable: boolean;
  actionable: boolean;
  action?: {
    text: string;
    handler: () => void;
  };
}

/**
 * Error severity levels for logging
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Authentication attempt logging interface
 */
export interface AuthAttemptLog {
  timestamp: Date;
  action: 'signup' | 'login' | 'password-reset';
  email?: string;
  success: boolean;
  errorCode?: string;
  userAgent: string;
  ip?: string;
  retryAttempt?: number;
}

/**
 * Get user-friendly error message and metadata from Firebase Auth error
 */
export function getEnhancedAuthError(error: AuthError | Error): EnhancedAuthError {
  const code = 'code' in error ? error.code : 'unknown';
  
  switch (code) {
    case AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE:
      return {
        code,
        message: 'Email already in use',
        userMessage: 'An account with this email address already exists. Please sign in instead or use a different email.',
        field: 'email',
        retryable: false,
        actionable: true,
        action: {
          text: 'Go to Sign In',
          handler: () => window.location.href = '/login'
        }
      };

    case AUTH_ERROR_CODES.INVALID_EMAIL:
      return {
        code,
        message: 'Invalid email format',
        userMessage: 'Please enter a valid email address.',
        field: 'email',
        retryable: false,
        actionable: true
      };

    case AUTH_ERROR_CODES.WEAK_PASSWORD:
      return {
        code,
        message: 'Password too weak',
        userMessage: 'Password must be at least 8 characters long and include a mix of letters, numbers, and symbols.',
        field: 'password',
        retryable: false,
        actionable: true
      };

    case AUTH_ERROR_CODES.USER_NOT_FOUND:
      return {
        code,
        message: 'User not found',
        userMessage: 'No account found with this email address. Please check your email or create a new account.',
        field: 'email',
        retryable: false,
        actionable: true,
        action: {
          text: 'Create Account',
          handler: () => window.location.href = '/signup'
        }
      };

    case AUTH_ERROR_CODES.WRONG_PASSWORD:
    case AUTH_ERROR_CODES.INVALID_CREDENTIAL:
      return {
        code,
        message: 'Invalid credentials',
        userMessage: 'Incorrect email or password. Please check your credentials and try again.',
        field: 'password',
        retryable: false,
        actionable: true,
        action: {
          text: 'Reset Password',
          handler: () => {
            // This would trigger password reset flow
            console.log('Password reset requested');
          }
        }
      };

    case AUTH_ERROR_CODES.USER_DISABLED:
      return {
        code,
        message: 'Account disabled',
        userMessage: 'This account has been disabled. Please contact support for assistance.',
        field: 'general',
        retryable: false,
        actionable: true,
        action: {
          text: 'Contact Support',
          handler: () => window.open('mailto:admin@wimeki.com', '_blank')
        }
      };

    case AUTH_ERROR_CODES.TOO_MANY_REQUESTS:
      return {
        code,
        message: 'Too many requests',
        userMessage: 'Too many failed attempts. Please wait a few minutes before trying again.',
        field: 'general',
        retryable: true,
        actionable: false
      };

    case AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED:
      return {
        code,
        message: 'Network error',
        userMessage: 'Network connection failed. Please check your internet connection and try again.',
        field: 'general',
        retryable: true,
        actionable: true
      };

    case AUTH_ERROR_CODES.TIMEOUT:
      return {
        code,
        message: 'Request timeout',
        userMessage: 'The request timed out. Please try again.',
        field: 'general',
        retryable: true,
        actionable: true
      };

    case AUTH_ERROR_CODES.POPUP_BLOCKED:
      return {
        code,
        message: 'Popup blocked',
        userMessage: 'Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.',
        field: 'general',
        retryable: true,
        actionable: true
      };

    case AUTH_ERROR_CODES.POPUP_CLOSED_BY_USER:
      return {
        code,
        message: 'Popup closed by user',
        userMessage: 'Sign-in was cancelled. Please try again to complete authentication.',
        field: 'general',
        retryable: true,
        actionable: true
      };

    case AUTH_ERROR_CODES.DISPOSABLE_EMAIL:
      return {
        code,
        message: 'Disposable email blocked',
        userMessage: 'Temporary email addresses are not allowed. Please use a permanent email address.',
        field: 'email',
        retryable: false,
        actionable: true
      };

    case AUTH_ERROR_CODES.INTERNAL_ERROR:
      return {
        code,
        message: 'Internal server error',
        userMessage: 'An internal error occurred. Please try again in a few moments.',
        field: 'general',
        retryable: true,
        actionable: false
      };

    default:
      return {
        code: code || 'unknown',
        message: error.message || 'Unknown error',
        userMessage: 'An unexpected error occurred. Please try again.',
        field: 'general',
        retryable: true,
        actionable: false
      };
  }
}

/**
 * Get error severity for logging purposes
 */
export function getErrorSeverity(errorCode: string): ErrorSeverity {
  switch (errorCode) {
    case AUTH_ERROR_CODES.INTERNAL_ERROR:
    case AUTH_ERROR_CODES.OPERATION_NOT_ALLOWED:
      return ErrorSeverity.CRITICAL;
    
    case AUTH_ERROR_CODES.USER_DISABLED:
    case AUTH_ERROR_CODES.TOO_MANY_REQUESTS:
      return ErrorSeverity.HIGH;
    
    case AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED:
    case AUTH_ERROR_CODES.TIMEOUT:
    case AUTH_ERROR_CODES.POPUP_BLOCKED:
      return ErrorSeverity.MEDIUM;
    
    default:
      return ErrorSeverity.LOW;
  }
}

/**
 * Log authentication attempts and errors
 */
export function logAuthAttempt(log: AuthAttemptLog): void {
  const severity = log.success ? ErrorSeverity.LOW : getErrorSeverity(log.errorCode || '');
  
  const logData = {
    ...log,
    severity,
    // Remove sensitive data for logging
    email: log.email ? log.email.replace(/(.{2}).*@/, '$1***@') : undefined
  };

  // In production, this would send to a logging service
  if (process.env.NODE_ENV === 'development') {
    console.log('Auth Attempt:', logData);
  }

  // Store in localStorage for debugging (remove in production)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const existingLogs = JSON.parse(localStorage.getItem('auth_logs') || '[]');
    existingLogs.push(logData);
    // Keep only last 50 logs
    if (existingLogs.length > 50) {
      existingLogs.splice(0, existingLogs.length - 50);
    }
    localStorage.setItem('auth_logs', JSON.stringify(existingLogs));
  }
}

/**
 * Check if an error is retryable based on its code
 */
export function isRetryableError(errorCode: string): boolean {
  const retryableErrors: string[] = [
    AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED,
    AUTH_ERROR_CODES.TIMEOUT,
    AUTH_ERROR_CODES.INTERNAL_ERROR,
    AUTH_ERROR_CODES.TOO_MANY_REQUESTS,
    AUTH_ERROR_CODES.POPUP_BLOCKED,
    AUTH_ERROR_CODES.POPUP_CLOSED_BY_USER
  ];
  
  return retryableErrors.includes(errorCode);
}

/**
 * Get retry delay in milliseconds based on attempt number
 */
export function getRetryDelay(attemptNumber: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s
  return Math.min(1000 * Math.pow(2, attemptNumber - 1), 16000);
}
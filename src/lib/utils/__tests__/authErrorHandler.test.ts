import { AuthError } from 'firebase/auth';
import {
  AUTH_ERROR_CODES,
  getEnhancedAuthError,
  getErrorSeverity,
  logAuthAttempt,
  isRetryableError,
  getRetryDelay,
  ErrorSeverity,
  type AuthAttemptLog
} from '../authErrorHandler';

// Mock localStorage for testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  warn: jest.spyOn(console, 'warn').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
};

describe('authErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]');
  });

  afterAll(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('getEnhancedAuthError', () => {
    it('should handle email already in use error', () => {
      const error = { code: AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE, message: 'Email in use' } as AuthError;
      const result = getEnhancedAuthError(error);

      expect(result.code).toBe(AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE);
      expect(result.userMessage).toContain('already exists');
      expect(result.field).toBe('email');
      expect(result.retryable).toBe(false);
      expect(result.actionable).toBe(true);
      expect(result.action).toBeDefined();
      expect(result.action?.text).toBe('Go to Sign In');
    });

    it('should handle invalid email error', () => {
      const error = { code: AUTH_ERROR_CODES.INVALID_EMAIL, message: 'Invalid email' } as AuthError;
      const result = getEnhancedAuthError(error);

      expect(result.code).toBe(AUTH_ERROR_CODES.INVALID_EMAIL);
      expect(result.userMessage).toContain('valid email address');
      expect(result.field).toBe('email');
      expect(result.retryable).toBe(false);
      expect(result.actionable).toBe(true);
      expect(result.action).toBeUndefined();
    });

    it('should handle weak password error', () => {
      const error = { code: AUTH_ERROR_CODES.WEAK_PASSWORD, message: 'Weak password' } as AuthError;
      const result = getEnhancedAuthError(error);

      expect(result.code).toBe(AUTH_ERROR_CODES.WEAK_PASSWORD);
      expect(result.userMessage).toContain('at least 8 characters');
      expect(result.field).toBe('password');
      expect(result.retryable).toBe(false);
      expect(result.actionable).toBe(true);
    });

    it('should handle user not found error', () => {
      const error = { code: AUTH_ERROR_CODES.USER_NOT_FOUND, message: 'User not found' } as AuthError;
      const result = getEnhancedAuthError(error);

      expect(result.code).toBe(AUTH_ERROR_CODES.USER_NOT_FOUND);
      expect(result.userMessage).toContain('No account found');
      expect(result.field).toBe('email');
      expect(result.retryable).toBe(false);
      expect(result.actionable).toBe(true);
      expect(result.action?.text).toBe('Create Account');
    });

    it('should handle wrong password error', () => {
      const error = { code: AUTH_ERROR_CODES.WRONG_PASSWORD, message: 'Wrong password' } as AuthError;
      const result = getEnhancedAuthError(error);

      expect(result.code).toBe(AUTH_ERROR_CODES.WRONG_PASSWORD);
      expect(result.userMessage).toContain('Incorrect email or password');
      expect(result.field).toBe('password');
      expect(result.retryable).toBe(false);
      expect(result.actionable).toBe(true);
      expect(result.action?.text).toBe('Reset Password');
    });

    it('should handle invalid credential error', () => {
      const error = { code: AUTH_ERROR_CODES.INVALID_CREDENTIAL, message: 'Invalid credential' } as AuthError;
      const result = getEnhancedAuthError(error);

      expect(result.code).toBe(AUTH_ERROR_CODES.INVALID_CREDENTIAL);
      expect(result.userMessage).toContain('Incorrect email or password');
      expect(result.field).toBe('password');
      expect(result.retryable).toBe(false);
      expect(result.actionable).toBe(true);
    });

    it('should handle user disabled error', () => {
      const error = { code: AUTH_ERROR_CODES.USER_DISABLED, message: 'User disabled' } as AuthError;
      const result = getEnhancedAuthError(error);

      expect(result.code).toBe(AUTH_ERROR_CODES.USER_DISABLED);
      expect(result.userMessage).toContain('account has been disabled');
      expect(result.field).toBe('general');
      expect(result.retryable).toBe(false);
      expect(result.actionable).toBe(true);
      expect(result.action?.text).toBe('Contact Support');
    });

    it('should handle too many requests error', () => {
      const error = { code: AUTH_ERROR_CODES.TOO_MANY_REQUESTS, message: 'Too many requests' } as AuthError;
      const result = getEnhancedAuthError(error);

      expect(result.code).toBe(AUTH_ERROR_CODES.TOO_MANY_REQUESTS);
      expect(result.userMessage).toContain('Too many failed attempts');
      expect(result.field).toBe('general');
      expect(result.retryable).toBe(true);
      expect(result.actionable).toBe(false);
    });

    it('should handle network request failed error', () => {
      const error = { code: AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED, message: 'Network failed' } as AuthError;
      const result = getEnhancedAuthError(error);

      expect(result.code).toBe(AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED);
      expect(result.userMessage).toContain('Network connection failed');
      expect(result.field).toBe('general');
      expect(result.retryable).toBe(true);
      expect(result.actionable).toBe(true);
    });

    it('should handle timeout error', () => {
      const error = { code: AUTH_ERROR_CODES.TIMEOUT, message: 'Timeout' } as AuthError;
      const result = getEnhancedAuthError(error);

      expect(result.code).toBe(AUTH_ERROR_CODES.TIMEOUT);
      expect(result.userMessage).toContain('request timed out');
      expect(result.field).toBe('general');
      expect(result.retryable).toBe(true);
      expect(result.actionable).toBe(true);
    });

    it('should handle popup blocked error', () => {
      const error = { code: AUTH_ERROR_CODES.POPUP_BLOCKED, message: 'Popup blocked' } as AuthError;
      const result = getEnhancedAuthError(error);

      expect(result.code).toBe(AUTH_ERROR_CODES.POPUP_BLOCKED);
      expect(result.userMessage).toContain('Pop-up was blocked');
      expect(result.field).toBe('general');
      expect(result.retryable).toBe(true);
      expect(result.actionable).toBe(true);
    });

    it('should handle popup closed by user error', () => {
      const error = { code: AUTH_ERROR_CODES.POPUP_CLOSED_BY_USER, message: 'Popup closed' } as AuthError;
      const result = getEnhancedAuthError(error);

      expect(result.code).toBe(AUTH_ERROR_CODES.POPUP_CLOSED_BY_USER);
      expect(result.userMessage).toContain('Sign-in was cancelled');
      expect(result.field).toBe('general');
      expect(result.retryable).toBe(true);
      expect(result.actionable).toBe(true);
    });

    it('should handle disposable email error', () => {
      const error = { code: AUTH_ERROR_CODES.DISPOSABLE_EMAIL, message: 'Disposable email' } as AuthError;
      const result = getEnhancedAuthError(error);

      expect(result.code).toBe(AUTH_ERROR_CODES.DISPOSABLE_EMAIL);
      expect(result.userMessage).toContain('Temporary email addresses are not allowed');
      expect(result.field).toBe('email');
      expect(result.retryable).toBe(false);
      expect(result.actionable).toBe(true);
    });

    it('should handle internal error', () => {
      const error = { code: AUTH_ERROR_CODES.INTERNAL_ERROR, message: 'Internal error' } as AuthError;
      const result = getEnhancedAuthError(error);

      expect(result.code).toBe(AUTH_ERROR_CODES.INTERNAL_ERROR);
      expect(result.userMessage).toContain('internal error occurred');
      expect(result.field).toBe('general');
      expect(result.retryable).toBe(true);
      expect(result.actionable).toBe(false);
    });

    it('should handle unknown error', () => {
      const error = { code: 'unknown-error', message: 'Unknown error' } as AuthError;
      const result = getEnhancedAuthError(error);

      expect(result.code).toBe('unknown-error');
      expect(result.userMessage).toContain('unexpected error occurred');
      expect(result.field).toBe('general');
      expect(result.retryable).toBe(true);
      expect(result.actionable).toBe(false);
    });

    it('should handle error without code', () => {
      const error = new Error('Generic error');
      const result = getEnhancedAuthError(error);

      expect(result.code).toBe('unknown');
      expect(result.userMessage).toContain('unexpected error occurred');
      expect(result.field).toBe('general');
      expect(result.retryable).toBe(true);
      expect(result.actionable).toBe(false);
    });
  });

  describe('getErrorSeverity', () => {
    it('should return CRITICAL for internal errors', () => {
      expect(getErrorSeverity(AUTH_ERROR_CODES.INTERNAL_ERROR)).toBe(ErrorSeverity.CRITICAL);
      expect(getErrorSeverity(AUTH_ERROR_CODES.OPERATION_NOT_ALLOWED)).toBe(ErrorSeverity.CRITICAL);
    });

    it('should return HIGH for user management errors', () => {
      expect(getErrorSeverity(AUTH_ERROR_CODES.USER_DISABLED)).toBe(ErrorSeverity.HIGH);
      expect(getErrorSeverity(AUTH_ERROR_CODES.TOO_MANY_REQUESTS)).toBe(ErrorSeverity.HIGH);
    });

    it('should return MEDIUM for network errors', () => {
      expect(getErrorSeverity(AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED)).toBe(ErrorSeverity.MEDIUM);
      expect(getErrorSeverity(AUTH_ERROR_CODES.TIMEOUT)).toBe(ErrorSeverity.MEDIUM);
      expect(getErrorSeverity(AUTH_ERROR_CODES.POPUP_BLOCKED)).toBe(ErrorSeverity.MEDIUM);
    });

    it('should return LOW for user input errors', () => {
      expect(getErrorSeverity(AUTH_ERROR_CODES.INVALID_EMAIL)).toBe(ErrorSeverity.LOW);
      expect(getErrorSeverity(AUTH_ERROR_CODES.WEAK_PASSWORD)).toBe(ErrorSeverity.LOW);
      expect(getErrorSeverity(AUTH_ERROR_CODES.WRONG_PASSWORD)).toBe(ErrorSeverity.LOW);
    });
  });

  describe('logAuthAttempt', () => {
    const mockLog: AuthAttemptLog = {
      timestamp: new Date(),
      action: 'login',
      email: 'test@example.com',
      success: false,
      errorCode: AUTH_ERROR_CODES.WRONG_PASSWORD,
      userAgent: 'test-agent'
    };

    it('should log successful attempts in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const successLog = { ...mockLog, success: true };
      logAuthAttempt(successLog);

      expect(consoleSpy.log).toHaveBeenCalledWith('Auth Attempt:', expect.objectContaining({
        success: true,
        email: 'te***@example.com',
        severity: ErrorSeverity.LOW
      }));

      process.env.NODE_ENV = originalEnv;
    });

    it('should log failed attempts with masked email', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      logAuthAttempt(mockLog);

      expect(consoleSpy.log).toHaveBeenCalledWith('Auth Attempt:', expect.objectContaining({
        success: false,
        email: 'te***@example.com',
        errorCode: AUTH_ERROR_CODES.WRONG_PASSWORD,
        severity: ErrorSeverity.LOW
      }));

      process.env.NODE_ENV = originalEnv;
    });

    it('should store logs in localStorage in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      logAuthAttempt(mockLog);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'auth_logs',
        expect.stringContaining('"success":false')
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should limit stored logs to 50 entries', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Mock existing logs with 50 entries
      const existingLogs = Array(50).fill(mockLog);
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingLogs));

      logAuthAttempt(mockLog);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedLogs = JSON.parse(setItemCall[1]);
      expect(storedLogs).toHaveLength(50);

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      logAuthAttempt(mockLog);

      expect(consoleSpy.log).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors', () => {
      expect(isRetryableError(AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED)).toBe(true);
      expect(isRetryableError(AUTH_ERROR_CODES.TIMEOUT)).toBe(true);
      expect(isRetryableError(AUTH_ERROR_CODES.INTERNAL_ERROR)).toBe(true);
      expect(isRetryableError(AUTH_ERROR_CODES.TOO_MANY_REQUESTS)).toBe(true);
      expect(isRetryableError(AUTH_ERROR_CODES.POPUP_BLOCKED)).toBe(true);
      expect(isRetryableError(AUTH_ERROR_CODES.POPUP_CLOSED_BY_USER)).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      expect(isRetryableError(AUTH_ERROR_CODES.INVALID_EMAIL)).toBe(false);
      expect(isRetryableError(AUTH_ERROR_CODES.WEAK_PASSWORD)).toBe(false);
      expect(isRetryableError(AUTH_ERROR_CODES.USER_NOT_FOUND)).toBe(false);
      expect(isRetryableError(AUTH_ERROR_CODES.WRONG_PASSWORD)).toBe(false);
      expect(isRetryableError(AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE)).toBe(false);
      expect(isRetryableError(AUTH_ERROR_CODES.USER_DISABLED)).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('should calculate exponential backoff delays', () => {
      expect(getRetryDelay(1)).toBe(1000);   // 1s
      expect(getRetryDelay(2)).toBe(2000);   // 2s
      expect(getRetryDelay(3)).toBe(4000);   // 4s
      expect(getRetryDelay(4)).toBe(8000);   // 8s
      expect(getRetryDelay(5)).toBe(16000);  // 16s
    });

    it('should cap delay at maximum value', () => {
      expect(getRetryDelay(6)).toBe(16000);  // Capped at 16s
      expect(getRetryDelay(10)).toBe(16000); // Capped at 16s
    });
  });
});
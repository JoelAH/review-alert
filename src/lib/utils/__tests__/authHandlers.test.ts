import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { AuthError } from 'firebase/auth';
import { 
  handleGoogleSignIn, 
  handleEmailSignUp,
  handleEmailSignIn,
  handleAuthError,
  handleLegacyAuthError,
  AuthError as LegacyAuthError
} from '../authHandlers';
import { EnhancedAuthError, AUTH_ERROR_CODES } from '../authErrorHandler';

// Mock the dynamic imports
jest.mock('@/lib/firebase/auth', () => ({
  signInWithGoogle: jest.fn(),
  signUpWithEmail: jest.fn(),
  signInWithEmail: jest.fn(),
}));

jest.mock('@/lib/services/auth', () => ({
  signInToServer: jest.fn(),
}));

// Mock retry handlers
jest.mock('../retryHandler', () => ({
  withAuthRetry: jest.fn((operation) => operation()),
  withNetworkRetry: jest.fn((operation) => operation()),
}));

// Mock error handler
jest.mock('../authErrorHandler', () => ({
  getEnhancedAuthError: jest.fn(),
  logAuthAttempt: jest.fn(),
  AUTH_ERROR_CODES: {
    EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use',
    WRONG_PASSWORD: 'auth/wrong-password',
    NETWORK_REQUEST_FAILED: 'auth/network-request-failed',
  }
}));

// Mock constants
jest.mock('@/lib/constants', () => ({
  default: {
    errors: {
      firebase: {
        EMAIL_USED: 'auth/email-already-in-use'
      },
      defaultMessage: 'Error. Something went wrong.'
    }
  }
}));

// Mock navigator
Object.defineProperty(navigator, 'userAgent', {
  value: 'test-user-agent',
  writable: true
});

describe('authHandlers', () => {
  let mockRouter: jest.Mocked<AppRouterInstance>;
  let mockSignInWithGoogle: jest.Mock;
  let mockSignUpWithEmail: jest.Mock;
  let mockSignInWithEmail: jest.Mock;
  let mockSignInToServer: jest.Mock;
  let mockGetEnhancedAuthError: jest.Mock;
  let mockLogAuthAttempt: jest.Mock;

  beforeEach(async () => {
    mockRouter = {
      replace: jest.fn(),
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as jest.Mocked<AppRouterInstance>;

    const firebaseAuth = await import('@/lib/firebase/auth');
    const authService = await import('@/lib/services/auth');
    const errorHandler = await import('../authErrorHandler');
    
    mockSignInWithGoogle = firebaseAuth.signInWithGoogle as jest.Mock;
    mockSignUpWithEmail = firebaseAuth.signUpWithEmail as jest.Mock;
    mockSignInWithEmail = firebaseAuth.signInWithEmail as jest.Mock;
    mockSignInToServer = authService.signInToServer as jest.Mock;
    mockGetEnhancedAuthError = errorHandler.getEnhancedAuthError as jest.Mock;
    mockLogAuthAttempt = errorHandler.logAuthAttempt as jest.Mock;

    jest.clearAllMocks();
  });

  describe('handleGoogleSignIn', () => {
    it('should handle successful Google sign-in with retry enabled', async () => {
      const mockUserCred = {
        user: { uid: 'test-uid', email: 'test@example.com' }
      };
      
      mockSignInWithGoogle.mockResolvedValue(mockUserCred);
      mockSignInToServer.mockResolvedValue(undefined);

      const onSuccess = jest.fn();
      
      await handleGoogleSignIn(mockRouter, { onSuccess, enableRetry: true });

      expect(mockSignInWithGoogle).toHaveBeenCalled();
      expect(mockSignInToServer).toHaveBeenCalledWith(mockUserCred.user);
      expect(onSuccess).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard');
      expect(mockLogAuthAttempt).toHaveBeenCalledWith(expect.objectContaining({
        action: 'login',
        success: true
      }));
    });

    it('should handle errors with enhanced error handling', async () => {
      const error = { code: AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE, message: 'Email in use' } as AuthError;
      const enhancedError: EnhancedAuthError = {
        code: AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE,
        message: 'Email in use',
        userMessage: 'Account already exists',
        field: 'email',
        retryable: false,
        actionable: true
      };

      mockSignInWithGoogle.mockRejectedValue(error);
      mockGetEnhancedAuthError.mockReturnValue(enhancedError);

      const onError = jest.fn();
      
      await handleGoogleSignIn(mockRouter, { onError });

      expect(onError).toHaveBeenCalledWith(enhancedError);
      expect(mockLogAuthAttempt).toHaveBeenCalledWith(expect.objectContaining({
        action: 'login',
        success: false,
        errorCode: AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE
      }));
    });

    it('should work without retry when disabled', async () => {
      const mockUserCred = {
        user: { uid: 'test-uid', email: 'test@example.com' }
      };
      
      mockSignInWithGoogle.mockResolvedValue(mockUserCred);
      mockSignInToServer.mockResolvedValue(undefined);

      await handleGoogleSignIn(mockRouter, { enableRetry: false });

      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('handleEmailSignUp', () => {
    it('should handle successful email signup', async () => {
      const mockUserCred = {
        user: { uid: 'test-uid', email: 'test@example.com' }
      };
      
      mockSignUpWithEmail.mockResolvedValue(mockUserCred);
      mockSignInToServer.mockResolvedValue(undefined);

      const onSuccess = jest.fn();
      
      await handleEmailSignUp('test@example.com', 'password123', mockRouter, { onSuccess });

      expect(mockSignUpWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockSignInToServer).toHaveBeenCalledWith(mockUserCred.user);
      expect(onSuccess).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard');
      expect(mockLogAuthAttempt).toHaveBeenCalledWith(expect.objectContaining({
        action: 'signup',
        email: 'test@example.com',
        success: true
      }));
    });

    it('should handle signup errors', async () => {
      const error = { code: AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE, message: 'Email in use' } as AuthError;
      const enhancedError: EnhancedAuthError = {
        code: AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE,
        message: 'Email in use',
        userMessage: 'Account already exists',
        field: 'email',
        retryable: false,
        actionable: true
      };

      mockSignUpWithEmail.mockRejectedValue(error);
      mockGetEnhancedAuthError.mockReturnValue(enhancedError);

      const onError = jest.fn();
      
      await handleEmailSignUp('test@example.com', 'password123', mockRouter, { onError });

      expect(onError).toHaveBeenCalledWith(enhancedError);
      expect(mockLogAuthAttempt).toHaveBeenCalledWith(expect.objectContaining({
        action: 'signup',
        email: 'test@example.com',
        success: false,
        errorCode: AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE
      }));
    });

    it('should handle missing user in credential', async () => {
      mockSignUpWithEmail.mockResolvedValue({ user: null });

      const onError = jest.fn();
      const enhancedError: EnhancedAuthError = {
        code: 'auth/no-user',
        message: 'No user',
        userMessage: 'Account creation failed',
        field: 'general',
        retryable: true,
        actionable: false
      };
      mockGetEnhancedAuthError.mockReturnValue(enhancedError);
      
      await handleEmailSignUp('test@example.com', 'password123', mockRouter, { onError });

      expect(onError).toHaveBeenCalledWith(enhancedError);
    });
  });

  describe('handleEmailSignIn', () => {
    it('should handle successful email signin', async () => {
      const mockUserCred = {
        user: { uid: 'test-uid', email: 'test@example.com' }
      };
      
      mockSignInWithEmail.mockResolvedValue(mockUserCred);
      mockSignInToServer.mockResolvedValue(undefined);

      const onSuccess = jest.fn();
      
      await handleEmailSignIn('test@example.com', 'password123', mockRouter, { onSuccess });

      expect(mockSignInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockSignInToServer).toHaveBeenCalledWith(mockUserCred.user);
      expect(onSuccess).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard');
      expect(mockLogAuthAttempt).toHaveBeenCalledWith(expect.objectContaining({
        action: 'login',
        email: 'test@example.com',
        success: true
      }));
    });

    it('should handle signin errors', async () => {
      const error = { code: AUTH_ERROR_CODES.WRONG_PASSWORD, message: 'Wrong password' } as AuthError;
      const enhancedError: EnhancedAuthError = {
        code: AUTH_ERROR_CODES.WRONG_PASSWORD,
        message: 'Wrong password',
        userMessage: 'Incorrect password',
        field: 'password',
        retryable: false,
        actionable: true
      };

      mockSignInWithEmail.mockRejectedValue(error);
      mockGetEnhancedAuthError.mockReturnValue(enhancedError);

      const onError = jest.fn();
      
      await handleEmailSignIn('test@example.com', 'password123', mockRouter, { onError });

      expect(onError).toHaveBeenCalledWith(enhancedError);
      expect(mockLogAuthAttempt).toHaveBeenCalledWith(expect.objectContaining({
        action: 'login',
        email: 'test@example.com',
        success: false,
        errorCode: AUTH_ERROR_CODES.WRONG_PASSWORD
      }));
    });

    it('should use custom redirect path', async () => {
      const mockUserCred = {
        user: { uid: 'test-uid', email: 'test@example.com' }
      };
      
      mockSignInWithEmail.mockResolvedValue(mockUserCred);
      mockSignInToServer.mockResolvedValue(undefined);

      await handleEmailSignIn('test@example.com', 'password123', mockRouter, { 
        redirectTo: '/custom-path' 
      });

      expect(mockRouter.replace).toHaveBeenCalledWith('/custom-path');
    });
  });

  describe('handleAuthError', () => {
    it('should set error message from enhanced error', () => {
      const setErrors = jest.fn();
      const enhancedError: EnhancedAuthError = {
        code: 'test-error',
        message: 'Test error',
        userMessage: 'User friendly error message',
        field: 'email',
        retryable: false,
        actionable: true
      };

      handleAuthError(enhancedError, setErrors);

      expect(setErrors).toHaveBeenCalledWith('User friendly error message');
    });

    it('should call action handler when provided', () => {
      const setErrors = jest.fn();
      const onAction = jest.fn();
      const actionHandler = jest.fn();
      const enhancedError: EnhancedAuthError = {
        code: 'test-error',
        message: 'Test error',
        userMessage: 'User friendly error message',
        field: 'email',
        retryable: false,
        actionable: true,
        action: {
          text: 'Retry',
          handler: actionHandler
        }
      };

      handleAuthError(enhancedError, setErrors, onAction);

      expect(setErrors).toHaveBeenCalledWith('User friendly error message');
      expect(onAction).toHaveBeenCalledWith(actionHandler);
    });

    it('should not call action handler when no action exists', () => {
      const setErrors = jest.fn();
      const onAction = jest.fn();
      const enhancedError: EnhancedAuthError = {
        code: 'test-error',
        message: 'Test error',
        userMessage: 'User friendly error message',
        field: 'email',
        retryable: false,
        actionable: false
      };

      handleAuthError(enhancedError, setErrors, onAction);

      expect(setErrors).toHaveBeenCalledWith('User friendly error message');
      expect(onAction).not.toHaveBeenCalled();
    });
  });

  describe('handleLegacyAuthError', () => {
    it('should convert legacy error to enhanced error', () => {
      const setErrors = jest.fn();
      const legacyError: LegacyAuthError = {
        message: 'Legacy error message',
        code: 'legacy-error'
      };
      const enhancedError: EnhancedAuthError = {
        code: 'legacy-error',
        message: 'Legacy error message',
        userMessage: 'Enhanced error message',
        field: 'general',
        retryable: false,
        actionable: false
      };

      mockGetEnhancedAuthError.mockReturnValue(enhancedError);

      handleLegacyAuthError(legacyError, setErrors);

      expect(mockGetEnhancedAuthError).toHaveBeenCalledWith(legacyError);
      expect(setErrors).toHaveBeenCalledWith('Enhanced error message');
    });
  });
});
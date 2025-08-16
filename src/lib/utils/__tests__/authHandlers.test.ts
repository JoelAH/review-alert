import { handleGoogleSignIn, handleAuthError, AuthError } from '../authHandlers';
import CONSTANTS from '@/lib/constants';

// Mock the dynamic imports
const mockSignInWithGoogle = jest.fn();
const mockSignInToServer = jest.fn();

jest.mock('@/lib/firebase/auth', () => ({
  signInWithGoogle: mockSignInWithGoogle
}));

jest.mock('@/lib/services/auth', () => ({
  signInToServer: mockSignInToServer
}));

describe('authHandlers', () => {
  let mockRouter: any;
  let mockSetErrors: jest.Mock;

  beforeEach(() => {
    mockRouter = {
      replace: jest.fn()
    };
    mockSetErrors = jest.fn();
    jest.clearAllMocks();
  });

  describe('handleGoogleSignIn', () => {
    it('should handle successful Google sign-in', async () => {
      const mockUser = { uid: 'test-uid', email: 'test@example.com' };
      const mockUserCred = { user: mockUser };
      const mockOnSuccess = jest.fn();

      mockSignInWithGoogle.mockResolvedValue(mockUserCred);
      mockSignInToServer.mockResolvedValue(undefined);

      await handleGoogleSignIn(mockRouter, {
        onSuccess: mockOnSuccess,
        redirectTo: '/custom-dashboard'
      });

      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
      expect(mockSignInToServer).toHaveBeenCalledWith(mockUser);
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      expect(mockRouter.replace).toHaveBeenCalledWith('/custom-dashboard');
    });

    it('should handle sign-in with no user returned', async () => {
      const mockUserCred = { user: null };
      const mockOnError = jest.fn();

      mockSignInWithGoogle.mockResolvedValue(mockUserCred);

      await handleGoogleSignIn(mockRouter, {
        onError: mockOnError
      });

      expect(mockSignInToServer).not.toHaveBeenCalled();
      expect(mockRouter.replace).not.toHaveBeenCalled();
      expect(mockOnError).toHaveBeenCalledWith({
        message: 'Authentication failed. Please try again.',
        code: 'auth/no-user'
      });
    });

    it('should handle email already in use error', async () => {
      const mockError = { code: CONSTANTS.errors.firebase.EMAIL_USED };
      const mockOnError = jest.fn();

      mockSignInWithGoogle.mockRejectedValue(mockError);

      await handleGoogleSignIn(mockRouter, {
        onError: mockOnError
      });

      expect(mockOnError).toHaveBeenCalledWith({
        message: 'You have already signed up! Please log into your account.',
        code: CONSTANTS.errors.firebase.EMAIL_USED
      });
    });

    it('should handle generic authentication error', async () => {
      const mockError = { code: 'auth/generic-error' };
      const mockOnError = jest.fn();

      mockSignInWithGoogle.mockRejectedValue(mockError);

      await handleGoogleSignIn(mockRouter, {
        onError: mockOnError
      });

      expect(mockOnError).toHaveBeenCalledWith({
        message: CONSTANTS.errors.defaultMessage,
        code: 'auth/generic-error'
      });
    });

    it('should use default redirect path when none provided', async () => {
      const mockUser = { uid: 'test-uid', email: 'test@example.com' };
      const mockUserCred = { user: mockUser };

      mockSignInWithGoogle.mockResolvedValue(mockUserCred);
      mockSignInToServer.mockResolvedValue(undefined);

      await handleGoogleSignIn(mockRouter);

      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('handleAuthError', () => {
    it('should call setErrors with error message', () => {
      const error: AuthError = {
        message: 'Test error message',
        code: 'test-error'
      };

      handleAuthError(error, mockSetErrors);

      expect(mockSetErrors).toHaveBeenCalledWith('Test error message');
    });

    it('should handle error without code', () => {
      const error: AuthError = {
        message: 'Simple error message'
      };

      handleAuthError(error, mockSetErrors);

      expect(mockSetErrors).toHaveBeenCalledWith('Simple error message');
    });
  });
});
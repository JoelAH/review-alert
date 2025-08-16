import {
  signUpWithEmail,
  signInWithEmail,
  sendPasswordResetEmail,
  getAuthErrorMessage,
  AUTH_ERROR_CODES
} from '../auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail as _sendPasswordResetEmail,
  AuthError
} from 'firebase/auth';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  OAuthProvider: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithPopup: jest.fn()
}));

// Mock Firebase config
jest.mock('../config', () => ({
  firebaseAuth: {}
}));

const mockCreateUserWithEmailAndPassword = createUserWithEmailAndPassword as jest.MockedFunction<typeof createUserWithEmailAndPassword>;
const mockSignInWithEmailAndPassword = signInWithEmailAndPassword as jest.MockedFunction<typeof signInWithEmailAndPassword>;
const mockSendPasswordResetEmail = _sendPasswordResetEmail as jest.MockedFunction<typeof _sendPasswordResetEmail>;

describe('Firebase Auth Email Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUpWithEmail', () => {
    it('should create user with email and password successfully', async () => {
      const mockUserCredential = {
        user: { uid: 'test-uid', email: 'test@example.com' },
        providerId: 'password'
      };
      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential as any);

      const result = await signUpWithEmail('test@example.com', 'password123');

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        'test@example.com',
        'password123'
      );
      expect(result).toBe(mockUserCredential);
    });

    it('should throw AuthError when signup fails', async () => {
      const mockError = {
        code: 'auth/email-already-in-use',
        message: 'Email already in use'
      } as AuthError;
      mockCreateUserWithEmailAndPassword.mockRejectedValue(mockError);

      await expect(signUpWithEmail('test@example.com', 'password123'))
        .rejects.toThrow(mockError);
    });
  });

  describe('signInWithEmail', () => {
    it('should sign in user with email and password successfully', async () => {
      const mockUserCredential = {
        user: { uid: 'test-uid', email: 'test@example.com' },
        providerId: 'password'
      };
      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential as any);

      const result = await signInWithEmail('test@example.com', 'password123');

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        'test@example.com',
        'password123'
      );
      expect(result).toBe(mockUserCredential);
    });

    it('should throw AuthError when signin fails', async () => {
      const mockError = {
        code: 'auth/user-not-found',
        message: 'User not found'
      } as AuthError;
      mockSignInWithEmailAndPassword.mockRejectedValue(mockError);

      await expect(signInWithEmail('test@example.com', 'password123'))
        .rejects.toThrow(mockError);
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      mockSendPasswordResetEmail.mockResolvedValue();

      await sendPasswordResetEmail('test@example.com');

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        {},
        'test@example.com'
      );
    });

    it('should throw AuthError when password reset fails', async () => {
      const mockError = {
        code: 'auth/user-not-found',
        message: 'User not found'
      } as AuthError;
      mockSendPasswordResetEmail.mockRejectedValue(mockError);

      await expect(sendPasswordResetEmail('test@example.com'))
        .rejects.toThrow(mockError);
    });
  });

  describe('getAuthErrorMessage', () => {
    it('should return correct message for email-already-in-use error', () => {
      const error = { code: AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE } as AuthError;
      expect(getAuthErrorMessage(error)).toBe(
        'An account with this email address already exists. Please sign in instead.'
      );
    });

    it('should return correct message for invalid-email error', () => {
      const error = { code: AUTH_ERROR_CODES.INVALID_EMAIL } as AuthError;
      expect(getAuthErrorMessage(error)).toBe(
        'Please enter a valid email address.'
      );
    });

    it('should return correct message for weak-password error', () => {
      const error = { code: AUTH_ERROR_CODES.WEAK_PASSWORD } as AuthError;
      expect(getAuthErrorMessage(error)).toBe(
        'Password is too weak. Please choose a stronger password.'
      );
    });

    it('should return correct message for user-not-found error', () => {
      const error = { code: AUTH_ERROR_CODES.USER_NOT_FOUND } as AuthError;
      expect(getAuthErrorMessage(error)).toBe(
        'No account found with this email address. Please check your email or sign up.'
      );
    });

    it('should return correct message for wrong-password error', () => {
      const error = { code: AUTH_ERROR_CODES.WRONG_PASSWORD } as AuthError;
      expect(getAuthErrorMessage(error)).toBe(
        'Incorrect password. Please try again.'
      );
    });

    it('should return correct message for too-many-requests error', () => {
      const error = { code: AUTH_ERROR_CODES.TOO_MANY_REQUESTS } as AuthError;
      expect(getAuthErrorMessage(error)).toBe(
        'Too many failed attempts. Please try again later.'
      );
    });

    it('should return correct message for network-request-failed error', () => {
      const error = { code: AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED } as AuthError;
      expect(getAuthErrorMessage(error)).toBe(
        'Network error. Please check your connection and try again.'
      );
    });

    it('should return generic message for unknown error codes', () => {
      const error = { code: 'auth/unknown-error' } as AuthError;
      expect(getAuthErrorMessage(error)).toBe(
        'An error occurred during authentication. Please try again.'
      );
    });

    it('should handle all defined error codes', () => {
      Object.values(AUTH_ERROR_CODES).forEach(code => {
        const error = { code } as AuthError;
        const message = getAuthErrorMessage(error);
        expect(message).toBeTruthy();
        expect(typeof message).toBe('string');
      });
    });
  });

  describe('AUTH_ERROR_CODES', () => {
    it('should contain all expected error codes', () => {
      expect(AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE).toBe('auth/email-already-in-use');
      expect(AUTH_ERROR_CODES.INVALID_EMAIL).toBe('auth/invalid-email');
      expect(AUTH_ERROR_CODES.OPERATION_NOT_ALLOWED).toBe('auth/operation-not-allowed');
      expect(AUTH_ERROR_CODES.WEAK_PASSWORD).toBe('auth/weak-password');
      expect(AUTH_ERROR_CODES.USER_DISABLED).toBe('auth/user-disabled');
      expect(AUTH_ERROR_CODES.USER_NOT_FOUND).toBe('auth/user-not-found');
      expect(AUTH_ERROR_CODES.WRONG_PASSWORD).toBe('auth/wrong-password');
      expect(AUTH_ERROR_CODES.TOO_MANY_REQUESTS).toBe('auth/too-many-requests');
      expect(AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED).toBe('auth/network-request-failed');
      expect(AUTH_ERROR_CODES.INTERNAL_ERROR).toBe('auth/internal-error');
    });
  });
});
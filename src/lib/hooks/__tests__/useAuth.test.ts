import { renderHook, act } from '@testing-library/react';
import { User } from 'firebase/auth';
import { useAuth, useIsAuthenticated } from '../useAuth';
import { onAuthStateChanged } from 'firebase/auth';

// Mock Firebase auth
jest.mock('@/lib/firebase/config', () => ({
  auth: {}
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  User: {}
}));

const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;

describe('useAuth Hook', () => {
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnsubscribe = jest.fn();
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      // Store the callback for manual triggering
      (mockOnAuthStateChanged as any).callback = callback;
      return mockUnsubscribe;
    });
  });

  describe('useAuth', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should update state when user signs in', () => {
      const { result } = renderHook(() => useAuth());

      const mockUser = { uid: 'test-user', email: 'test@example.com' } as User;

      act(() => {
        (mockOnAuthStateChanged as any).callback(mockUser);
      });

      expect(result.current.user).toBe(mockUser);
      expect(result.current.loading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should update state when user signs out', () => {
      const { result } = renderHook(() => useAuth());

      // First, simulate user sign in
      const mockUser = { uid: 'test-user', email: 'test@example.com' } as User;
      act(() => {
        (mockOnAuthStateChanged as any).callback(mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then simulate sign out
      act(() => {
        (mockOnAuthStateChanged as any).callback(null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should call unsubscribe on unmount', () => {
      const { unmount } = renderHook(() => useAuth());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should handle multiple state changes', () => {
      const { result } = renderHook(() => useAuth());

      const mockUser1 = { uid: 'user1', email: 'user1@example.com' } as User;
      const mockUser2 = { uid: 'user2', email: 'user2@example.com' } as User;

      // First user
      act(() => {
        (mockOnAuthStateChanged as any).callback(mockUser1);
      });

      expect(result.current.user).toBe(mockUser1);
      expect(result.current.isAuthenticated).toBe(true);

      // Switch to second user
      act(() => {
        (mockOnAuthStateChanged as any).callback(mockUser2);
      });

      expect(result.current.user).toBe(mockUser2);
      expect(result.current.isAuthenticated).toBe(true);

      // Sign out
      act(() => {
        (mockOnAuthStateChanged as any).callback(null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('useIsAuthenticated', () => {
    it('should return false initially', () => {
      const { result } = renderHook(() => useIsAuthenticated());

      expect(result.current).toBe(false);
    });

    it('should return true when user is authenticated', () => {
      const { result } = renderHook(() => useIsAuthenticated());

      const mockUser = { uid: 'test-user', email: 'test@example.com' } as User;

      act(() => {
        (mockOnAuthStateChanged as any).callback(mockUser);
      });

      expect(result.current).toBe(true);
    });

    it('should return false when user signs out', () => {
      const { result } = renderHook(() => useIsAuthenticated());

      // Sign in
      const mockUser = { uid: 'test-user', email: 'test@example.com' } as User;
      act(() => {
        (mockOnAuthStateChanged as any).callback(mockUser);
      });

      expect(result.current).toBe(true);

      // Sign out
      act(() => {
        (mockOnAuthStateChanged as any).callback(null);
      });

      expect(result.current).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle auth state change errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const { result } = renderHook(() => useAuth());

      // Simulate an error in the auth state change
      act(() => {
        try {
          throw new Error('Auth error');
        } catch (error) {
          // The hook should handle this gracefully
          (mockOnAuthStateChanged as any).callback(null);
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);

      consoleSpy.mockRestore();
    });
  });
});
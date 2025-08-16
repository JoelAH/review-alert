import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import AuthRedirect from '../AuthRedirect';
import { useAuth } from '@/lib/hooks/useAuth';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockReplace = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('AuthRedirect Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when auth state is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        isAuthenticated: false
      });

      render(
        <AuthRedirect>
          <div>Protected Content</div>
        </AuthRedirect>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should show custom loading component when provided', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        isAuthenticated: false
      });

      const CustomLoader = () => <div>Custom Loading...</div>;

      render(
        <AuthRedirect loadingComponent={<CustomLoader />}>
          <div>Protected Content</div>
        </AuthRedirect>
      );

      expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated User Redirects', () => {
    it('should redirect unauthenticated users to login when requireAuth is true', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        isAuthenticated: false
      });

      render(
        <AuthRedirect requireAuth={true}>
          <div>Protected Content</div>
        </AuthRedirect>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login');
      });

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should redirect to custom login path when specified', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        isAuthenticated: false
      });

      render(
        <AuthRedirect requireAuth={true} loginPath="/custom-login">
          <div>Protected Content</div>
        </AuthRedirect>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/custom-login');
      });
    });

    it('should render children when not requiring auth and user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        isAuthenticated: false
      });

      render(
        <AuthRedirect requireAuth={false}>
          <div>Public Content</div>
        </AuthRedirect>
      );

      expect(screen.getByText('Public Content')).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('Authenticated User Redirects', () => {
    it('should redirect authenticated users away from auth pages', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'test-user' } as any,
        loading: false,
        isAuthenticated: true
      });

      render(
        <AuthRedirect requireAuth={false} redirectTo="/dashboard">
          <div>Login Form</div>
        </AuthRedirect>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/dashboard');
      });

      expect(screen.queryByText('Login Form')).not.toBeInTheDocument();
    });

    it('should redirect to custom path when specified', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'test-user' } as any,
        loading: false,
        isAuthenticated: true
      });

      render(
        <AuthRedirect requireAuth={false} redirectTo="/custom-dashboard">
          <div>Login Form</div>
        </AuthRedirect>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/custom-dashboard');
      });
    });

    it('should render children when authenticated and requireAuth is true', () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'test-user' } as any,
        loading: false,
        isAuthenticated: true
      });

      render(
        <AuthRedirect requireAuth={true}>
          <div>Protected Content</div>
        </AuthRedirect>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('should not redirect when redirectTo is not specified', () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'test-user' } as any,
        loading: false,
        isAuthenticated: true
      });

      render(
        <AuthRedirect requireAuth={false} redirectTo="">
          <div>Auth Form</div>
        </AuthRedirect>
      );

      expect(screen.getByText('Auth Form')).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty redirectTo gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'test-user' } as any,
        loading: false,
        isAuthenticated: true
      });

      render(
        <AuthRedirect requireAuth={false} redirectTo="">
          <div>Content</div>
        </AuthRedirect>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('should not redirect when loading changes from true to false without auth change', async () => {
      // Start with loading state
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        isAuthenticated: false
      });

      const { rerender } = render(
        <AuthRedirect requireAuth={false}>
          <div>Content</div>
        </AuthRedirect>
      );

      // Change to not loading, not authenticated
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        isAuthenticated: false
      });
      
      rerender(
        <AuthRedirect requireAuth={false}>
          <div>Content</div>
        </AuthRedirect>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });
});
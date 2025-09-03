import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import Navigation from '../Navigation';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('Navigation Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  describe('Unauthenticated State', () => {
    it('should render login and signup buttons when not authenticated', () => {
      render(<Navigation isAuthenticated={false} />);
      
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();
    });

    it('should highlight current page button', () => {
      render(<Navigation isAuthenticated={false} currentPath="/login" />);
      
      const loginButton = screen.getByRole('link', { name: /sign in/i });
      expect(loginButton).toHaveAttribute('aria-current', 'page');
    });

    it('should navigate to home when logo is clicked', () => {
      render(<Navigation isAuthenticated={false} />);
      
      const logo = screen.getByRole('button', { name: /reviewquest - home/i });
      fireEvent.click(logo);
      
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should render with transparent background when specified', () => {
      const { container } = render(<Navigation isAuthenticated={false} transparent={true} />);
      
      const appBar = container.querySelector('[role="banner"]');
      expect(appBar).toHaveStyle({
        background: 'rgba(255, 255, 255, 0.8)'
      });
    });
  });

  describe('Authenticated State', () => {
    it('should render dashboard link and sign out button when authenticated', () => {
      render(
        <Navigation 
          isAuthenticated={true} 
          currentPath="/profile" 
          showSignOut={true}
        />
      );
      
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    it('should not render dashboard link when already on dashboard', () => {
      render(
        <Navigation 
          isAuthenticated={true} 
          currentPath="/dashboard" 
          showSignOut={true}
        />
      );
      
      expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
    });

    it('should navigate to dashboard when logo is clicked', () => {
      render(<Navigation isAuthenticated={true} />);
      
      const logo = screen.getByRole('button', { name: /reviewquest - go to dashboard/i });
      fireEvent.click(logo);
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should call onSignOut when sign out button is clicked', () => {
      const mockOnSignOut = jest.fn();
      render(
        <Navigation 
          isAuthenticated={true} 
          showSignOut={true}
          onSignOut={mockOnSignOut}
        />
      );
      
      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(signOutButton);
      
      expect(mockOnSignOut).toHaveBeenCalled();
    });

    it('should not render sign out button when showSignOut is false', () => {
      render(
        <Navigation 
          isAuthenticated={true} 
          showSignOut={false}
        />
      );
      
      expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render mobile-friendly text on small screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(max-width:599.95px)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<Navigation isAuthenticated={false} />);
      
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<Navigation isAuthenticated={false} />);
      
      const nav = screen.getByRole('banner');
      expect(nav).toBeInTheDocument();
      
      const logo = screen.getByRole('button', { name: /reviewquest - home/i });
      expect(logo).toHaveAttribute('aria-label');
    });

    it('should have proper focus management', () => {
      render(<Navigation isAuthenticated={false} />);
      
      const logo = screen.getByRole('button', { name: /reviewquest - home/i });
      logo.focus();
      
      expect(logo).toHaveFocus();
    });

    it('should mark current page with aria-current', () => {
      render(<Navigation isAuthenticated={false} currentPath="/signup" />);
      
      const signupButton = screen.getByRole('link', { name: /sign up/i });
      expect(signupButton).toHaveAttribute('aria-current', 'page');
    });
  });
});
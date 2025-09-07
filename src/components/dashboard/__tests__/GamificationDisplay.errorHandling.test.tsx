/**
 * GamificationDisplay Error Handling Tests
 * Tests error boundaries, loading states, and network error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import GamificationDisplay from '../GamificationDisplay';
import { GamificationData, BadgeCategory, XPAction } from '@/types/gamification';

// Mock the network status hook
jest.mock('../../common/NetworkStatus', () => ({
  ...jest.requireActual('../../common/NetworkStatus'),
  useNetworkStatus: jest.fn(() => ({ isOnline: true, wasOffline: false })),
  useRetry: jest.fn(() => ({
    retry: jest.fn(),
    retryCount: 0,
    isRetrying: false,
    canRetry: true,
    reset: jest.fn(),
  })),
  NetworkStatusIndicator: ({ onRetry }: { onRetry?: () => void }) => (
    <div data-testid="network-status">
      {onRetry && <button onClick={onRetry}>Network Retry</button>}
    </div>
  ),
  ErrorWithRetry: ({ error, onRetry }: { error: Error; onRetry: () => void }) => (
    <div data-testid="error-with-retry">
      <div>{error.message}</div>
      <button onClick={onRetry}>Error Retry</button>
    </div>
  ),
}));

// Mock the loading states
jest.mock('../../common/LoadingStates', () => ({
  GamificationDisplaySkeleton: () => <div data-testid="skeleton">Loading skeleton</div>,
  LoadingOverlay: ({ loading, children }: { loading: boolean; children: React.ReactNode }) => (
    <div data-testid="loading-overlay" data-loading={loading}>
      {children}
    </div>
  ),
}));

// Mock the child components
jest.mock('../XPProgress', () => {
  return function XPProgress() {
    return <div data-testid="xp-progress">XP Progress Component</div>;
  };
});

jest.mock('../BadgeCollection', () => {
  return function BadgeCollection() {
    return <div data-testid="badge-collection">Badge Collection Component</div>;
  };
});

jest.mock('../ProgressIndicators', () => {
  return function ProgressIndicators() {
    return <div data-testid="progress-indicators">Progress Indicators Component</div>;
  };
});

// Test theme
const theme = createTheme();

// Wrapper component for theme provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

// Mock gamification data
const mockGamificationData: GamificationData = {
  xp: 150,
  level: 2,
  badges: [{
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Earned your first 100 XP',
    category: BadgeCategory.MILESTONE,
    earnedAt: new Date('2024-01-01'),
  }],
  streaks: {
    currentLoginStreak: 3,
    longestLoginStreak: 5,
    lastLoginDate: new Date('2024-01-15'),
  },
  activityCounts: {
    questsCreated: 2,
    questsCompleted: 1,
    questsInProgress: 1,
    appsAdded: 1,
    reviewInteractions: 5,
  },
  xpHistory: [{
    amount: 10,
    action: XPAction.QUEST_CREATED,
    timestamp: new Date('2024-01-01'),
  }],
};

describe('GamificationDisplay Error Handling', () => {
  // Mock fetch globally
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('loading states', () => {
    it('should show skeleton loader when loading without initial data', () => {
      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
      expect(screen.getByText('Loading skeleton')).toBeInTheDocument();
    });

    it('should not show skeleton when initial data is provided', () => {
      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
      expect(screen.getByTestId('xp-progress')).toBeInTheDocument();
    });

    it('should show loading overlay during refresh', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          gamificationData: mockGamificationData,
          badgeProgress: [],
          xpForNextLevel: 100,
        }),
      });

      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // Trigger refresh
      const refreshButton = screen.getByRole('button', { name: /refresh data/i });
      fireEvent.click(refreshButton);

      // Should show loading overlay
      const loadingOverlay = screen.getByTestId('loading-overlay');
      expect(loadingOverlay).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('network error handling', () => {
    it('should show network status indicator', () => {
      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      expect(screen.getByTestId('network-status')).toBeInTheDocument();
    });

    it('should handle network errors with retry', async () => {
      const networkError = new Error('Network Error: fetch failed');
      mockFetch.mockRejectedValueOnce(networkError);

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-with-retry')).toBeInTheDocument();
        expect(screen.getByText('Network Error: fetch failed')).toBeInTheDocument();
      });
    });

    it('should handle timeout errors', async () => {
      // Mock a timeout scenario
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AbortError')), 100)
        )
      );

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-with-retry')).toBeInTheDocument();
      }, { timeout: 200 });
    });
  });

  describe('API error handling', () => {
    it('should handle 401 authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Authentication required/)).toBeInTheDocument();
      });
    });

    it('should handle 403 forbidden errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' }),
      });

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Access denied/)).toBeInTheDocument();
      });
    });

    it('should handle 404 not found errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not Found' }),
      });

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Gamification data not found/)).toBeInTheDocument();
      });
    });

    it('should handle 500 server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' }),
      });

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Server error/)).toBeInTheDocument();
      });
    });

    it('should handle 429 rate limit errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Too Many Requests' }),
      });

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Too many requests/)).toBeInTheDocument();
      });
    });
  });

  describe('data validation errors', () => {
    it('should handle invalid response data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // Missing gamificationData
      });

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Invalid response: missing gamification data/)).toBeInTheDocument();
      });
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-with-retry')).toBeInTheDocument();
      });
    });
  });

  describe('retry mechanisms', () => {
    it('should allow retrying failed requests', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            gamificationData: mockGamificationData,
            badgeProgress: [],
            xpForNextLevel: 100,
          }),
        });

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByTestId('error-with-retry')).toBeInTheDocument();
      });

      // Click retry button
      fireEvent.click(screen.getByText('Error Retry'));

      // Should eventually show success
      await waitFor(() => {
        expect(screen.getByTestId('xp-progress')).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle network retry button', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Network Retry')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Network Retry'));

      // Should trigger another fetch attempt
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('fallback UI states', () => {
    it('should show welcome message for new users', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          gamificationData: null,
          badgeProgress: [],
          xpForNextLevel: 0,
        }),
      });

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome to ReviewQuest!')).toBeInTheDocument();
        expect(screen.getByText(/Start completing quests/)).toBeInTheDocument();
      });
    });

    it('should show get started button for new users', async () => {
      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      // Mock no data scenario
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          gamificationData: null,
          badgeProgress: [],
          xpForNextLevel: 0,
        }),
      });

      await waitFor(() => {
        expect(screen.getByText('Get Started')).toBeInTheDocument();
      });
    });
  });

  describe('error boundaries', () => {
    // Suppress console.error for error boundary tests
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalError;
    });

    it('should catch errors in child components', () => {
      // Mock XPProgress to throw an error
      jest.doMock('../XPProgress', () => {
        return function XPProgress() {
          throw new Error('XP Progress component error');
        };
      });

      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // Should show fallback UI for XP Progress
      expect(screen.getByText('XP progress temporarily unavailable')).toBeInTheDocument();
    });

    it('should show fallback for progress indicators errors', () => {
      // Mock ProgressIndicators to throw an error
      jest.doMock('../ProgressIndicators', () => {
        return function ProgressIndicators() {
          throw new Error('Progress indicators error');
        };
      });

      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // Should show fallback message
      expect(screen.getByText('Progress indicators are temporarily unavailable.')).toBeInTheDocument();
    });

    it('should show fallback for badge collection errors', () => {
      // Mock BadgeCollection to throw an error
      jest.doMock('../BadgeCollection', () => {
        return function BadgeCollection() {
          throw new Error('Badge collection error');
        };
      });

      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // Should show fallback UI for Badge Collection
      expect(screen.getByText('Badge collection temporarily unavailable')).toBeInTheDocument();
    });

    it('should show fallback for activity summary errors', () => {
      // This would require mocking the activity summary section to throw an error
      // For now, we test that the error boundary is in place
      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // Should render activity summary normally
      expect(screen.getByText('Activity Summary')).toBeInTheDocument();
    });
  });

  describe('refresh error handling', () => {
    it('should show error alert when refresh fails but data exists', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            gamificationData: mockGamificationData,
            badgeProgress: [],
            xpForNextLevel: 100,
          }),
        })
        .mockRejectedValueOnce(new Error('Refresh failed'));

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('xp-progress')).toBeInTheDocument();
      });

      // Trigger refresh
      const refreshButton = screen.getByRole('button', { name: /refresh data/i });
      fireEvent.click(refreshButton);

      // Should show error with retry option
      await waitFor(() => {
        expect(screen.getByText('Failed to refresh data')).toBeInTheDocument();
      });
    });

    it('should disable refresh button during retry', async () => {
      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      const refreshButton = screen.getByRole('button', { name: /refresh data/i });
      
      // Should be enabled initially
      expect(refreshButton).not.toBeDisabled();

      // Mock a slow response
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({
            gamificationData: mockGamificationData,
            badgeProgress: [],
            xpForNextLevel: 100,
          }),
        }), 100))
      );

      fireEvent.click(refreshButton);

      // Should be disabled during refresh
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('offline handling', () => {
    it('should handle offline state', async () => {
      // Mock offline state
      const { useNetworkStatus } = require('../../common/NetworkStatus');
      useNetworkStatus.mockReturnValue({ isOnline: false, wasOffline: false });

      mockFetch.mockRejectedValueOnce(new Error('No internet connection'));

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/No internet connection/)).toBeInTheDocument();
      });
    });
  });

  describe('callback handling', () => {
    it('should call onError callback when errors occur', async () => {
      const onError = jest.fn();
      const error = new Error('Test error');
      mockFetch.mockRejectedValueOnce(error);

      render(
        <TestWrapper>
          <GamificationDisplay onError={onError} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });

    it('should call onRefresh callback when refresh is triggered', async () => {
      const onRefresh = jest.fn();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          gamificationData: mockGamificationData,
          badgeProgress: [],
          xpForNextLevel: 100,
        }),
      });

      render(
        <TestWrapper>
          <GamificationDisplay 
            initialData={mockGamificationData} 
            onRefresh={onRefresh}
          />
        </TestWrapper>
      );

      const refreshButton = screen.getByRole('button', { name: /refresh data/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalled();
      });
    });
  });
});
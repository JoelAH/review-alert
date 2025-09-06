/**
 * Integration tests for GamificationDisplay component
 * Tests complete gamification display functionality including data fetching,
 * error handling, loading states, and responsive design
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import userEvent from '@testing-library/user-event';
import GamificationDisplay from '../GamificationDisplay';
import { GamificationData, BadgeProgress, XPAction, BadgeCategory } from '@/types/gamification';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock window.addEventListener for online/offline events
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
});
Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
});

// Create theme for testing
const theme = createTheme();

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

// Mock gamification data
const mockGamificationData: GamificationData = {
  xp: 750,
  level: 3,
  badges: [
    {
      id: 'getting-started',
      name: 'Getting Started',
      description: 'Earned your first 100 XP',
      category: BadgeCategory.MILESTONE,
      earnedAt: new Date('2024-01-15T10:00:00Z'),
    },
    {
      id: 'quest-explorer',
      name: 'Quest Explorer',
      description: 'Reached 500 XP',
      category: BadgeCategory.MILESTONE,
      earnedAt: new Date('2024-01-20T15:30:00Z'),
    },
  ],
  streaks: {
    currentLoginStreak: 5,
    longestLoginStreak: 10,
    lastLoginDate: new Date('2024-01-25T09:00:00Z'),
  },
  activityCounts: {
    questsCreated: 8,
    questsCompleted: 12,
    questsInProgress: 3,
    appsAdded: 4,
    reviewInteractions: 25,
  },
  xpHistory: [
    {
      amount: 15,
      action: XPAction.QUEST_COMPLETED,
      timestamp: new Date('2024-01-25T14:00:00Z'),
      metadata: { questId: 'quest-1' },
    },
    {
      amount: 10,
      action: XPAction.QUEST_CREATED,
      timestamp: new Date('2024-01-25T13:00:00Z'),
      metadata: { questId: 'quest-2' },
    },
    {
      amount: 20,
      action: XPAction.APP_ADDED,
      timestamp: new Date('2024-01-25T12:00:00Z'),
      metadata: { appId: 'app-1' },
    },
  ],
};

const mockBadgeProgress: BadgeProgress[] = [
  {
    badge: {
      id: 'getting-started',
      name: 'Getting Started',
      description: 'Earned your first 100 XP',
      category: BadgeCategory.MILESTONE,
      requirements: [{ type: 'xp', value: 100 }],
    },
    progress: 100,
    target: 100,
    earned: true,
  },
  {
    badge: {
      id: 'quest-explorer',
      name: 'Quest Explorer',
      description: 'Reached 500 XP',
      category: BadgeCategory.MILESTONE,
      requirements: [{ type: 'xp', value: 500 }],
    },
    progress: 500,
    target: 500,
    earned: true,
  },
  {
    badge: {
      id: 'review-master',
      name: 'Review Master',
      description: 'Reached 1000 XP',
      category: BadgeCategory.MILESTONE,
      requirements: [{ type: 'xp', value: 1000 }],
    },
    progress: 750,
    target: 1000,
    earned: false,
  },
];

const mockApiResponse = {
  gamificationData: {
    ...mockGamificationData,
    streaks: {
      ...mockGamificationData.streaks,
      lastLoginDate: mockGamificationData.streaks.lastLoginDate?.toISOString(),
    },
    badges: mockGamificationData.badges.map(badge => ({
      ...badge,
      earnedAt: badge.earnedAt.toISOString(),
    })),
    xpHistory: mockGamificationData.xpHistory.map(transaction => ({
      ...transaction,
      timestamp: transaction.timestamp.toISOString(),
    })),
  },
  badgeProgress: mockBadgeProgress,
  xpForNextLevel: 250,
  levelThresholds: [0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000],
};

describe('GamificationDisplay Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    navigator.onLine = true;
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Data Fetching and Display', () => {
    it('should fetch and display gamification data on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      // Should show loading skeleton initially
      expect(screen.getByText('Your Progress')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Level 3')).toBeInTheDocument();
      });

      // Verify API call
      expect(mockFetch).toHaveBeenCalledWith('/api/gamification', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      // Verify XP display
      expect(screen.getByText('750 XP')).toBeInTheDocument();
      expect(screen.getByText('250 XP to go')).toBeInTheDocument();

      // Verify badge display
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByText('Quest Explorer')).toBeInTheDocument();
      expect(screen.getByText('2/3 Earned')).toBeInTheDocument();

      // Verify activity summary
      expect(screen.getByText('12')).toBeInTheDocument(); // Quests completed
      expect(screen.getByText('4')).toBeInTheDocument(); // Apps added
      expect(screen.getByText('5')).toBeInTheDocument(); // Current streak
      expect(screen.getByText('2')).toBeInTheDocument(); // Badges earned
    });

    it('should use initial data when provided', async () => {
      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // Should display data immediately without loading
      expect(screen.getByText('Level 3')).toBeInTheDocument();
      expect(screen.getByText('750 XP')).toBeInTheDocument();

      // Should not make API call
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle refresh functionality', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const onRefresh = jest.fn();

      render(
        <TestWrapper>
          <GamificationDisplay onRefresh={onRefresh} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Level 3')).toBeInTheDocument();
      });

      // Mock updated data
      const updatedResponse = {
        ...mockApiResponse,
        gamificationData: {
          ...mockApiResponse.gamificationData,
          xp: 800,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedResponse,
      });

      // Click refresh button
      const refreshButton = screen.getByLabelText(/refresh/i);
      fireEvent.click(refreshButton);

      // Verify refresh callback
      expect(onRefresh).toHaveBeenCalled();

      // Wait for updated data
      await waitFor(() => {
        expect(screen.getByText('800 XP')).toBeInTheDocument();
      });

      // Verify API was called again
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should display error state when API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const onError = jest.fn();

      render(
        <TestWrapper>
          <GamificationDisplay onError={onError} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Gamification Data')).toBeInTheDocument();
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(screen.getByText('Something went wrong while loading your XP and badges.')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should handle authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized - Invalid session' }),
      });

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Authentication Error')).toBeInTheDocument();
      });

      expect(screen.getByText('Please sign in again to view your progress.')).toBeInTheDocument();
      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });

    it('should show warning when refresh fails but data exists', async () => {
      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // Data should be visible initially
      expect(screen.getByText('Level 3')).toBeInTheDocument();
      expect(screen.getByText('750 XP')).toBeInTheDocument();

      // Mock failed refresh
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const refreshButton = screen.getByLabelText(/refresh/i);
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to refresh data/)).toBeInTheDocument();
      });

      // Data should still be visible
      expect(screen.getByText('Level 3')).toBeInTheDocument();
      expect(screen.getByText('750 XP')).toBeInTheDocument();
    });

    it('should retry on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Mock successful retry
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Level 3')).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Loading States', () => {
    it('should show loading skeleton on initial load', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      // Should show skeleton elements (they don't have text content)
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show refresh loading state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Level 3')).toBeInTheDocument();
      });

      // Mock slow refresh
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const refreshButton = screen.getByLabelText(/refresh/i);
      fireEvent.click(refreshButton);

      // Refresh button should show loading state
      await waitFor(() => {
        expect(refreshButton).toHaveStyle('animation: spin 1s linear infinite');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Level 3')).toBeInTheDocument();
      });

      // Check that components use responsive grid classes
      const progressSection = screen.getByText('Level 3').closest('[class*="MuiGrid-item"]');
      const badgeSection = screen.getByText('Badge Collection').closest('[class*="MuiGrid-item"]');
      
      expect(progressSection).toHaveClass('MuiGrid-grid-xs-12');
      expect(badgeSection).toHaveClass('MuiGrid-grid-xs-12');
    });
  });

  describe('Level Up and Badge Notifications', () => {
    it('should trigger level up callback when level increases', async () => {
      const onLevelUp = jest.fn();

      // Initial data with level 2
      const initialData = { ...mockGamificationData, level: 2 };

      render(
        <TestWrapper>
          <GamificationDisplay initialData={initialData} onLevelUp={onLevelUp} />
        </TestWrapper>
      );

      // Mock refresh with level 3
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const refreshButton = screen.getByLabelText(/refresh/i);
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(onLevelUp).toHaveBeenCalledWith(3);
      });
    });

    it('should trigger badge earned callback for new badges', async () => {
      const onBadgeEarned = jest.fn();

      // Initial data with fewer badges
      const initialData = {
        ...mockGamificationData,
        badges: [mockGamificationData.badges[0]], // Only first badge
      };

      render(
        <TestWrapper>
          <GamificationDisplay initialData={initialData} onBadgeEarned={onBadgeEarned} />
        </TestWrapper>
      );

      // Mock refresh with additional badge
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const refreshButton = screen.getByLabelText(/refresh/i);
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(onBadgeEarned).toHaveBeenCalledWith(mockGamificationData.badges[1]);
      });
    });
  });

  describe('Network Status', () => {
    it('should show offline indicator when offline', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Level 3')).toBeInTheDocument();
      });

      // Simulate going offline
      act(() => {
        navigator.onLine = false;
        // Trigger the offline event handler directly
        const offlineHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'offline')?.[1];
        if (offlineHandler) offlineHandler();
      });

      await waitFor(() => {
        expect(screen.getByText(/offline.*features may not work/i)).toBeInTheDocument();
      });
    });

    it('should hide offline indicator when back online', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Level 3')).toBeInTheDocument();
      });

      // Simulate going offline then online
      act(() => {
        navigator.onLine = false;
        const offlineHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'offline')?.[1];
        if (offlineHandler) offlineHandler();
      });

      await waitFor(() => {
        expect(screen.getByText(/offline.*features may not work/i)).toBeInTheDocument();
      });

      act(() => {
        navigator.onLine = true;
        const onlineHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'online')?.[1];
        if (onlineHandler) onlineHandler();
      });

      await waitFor(() => {
        expect(screen.queryByText(/offline.*features may not work/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Auto-refresh', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should auto-refresh every 5 minutes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Level 3')).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Fast-forward 5 minutes
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      // Wait for the auto-refresh to complete
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      }, { timeout: 1000 });
    }, 10000);

    it('should not auto-refresh when loading or refreshing', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      // Fast-forward 5 minutes while loading
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      // Should only have made initial call
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('No Data State', () => {
    it('should show no data message when gamification data is null', async () => {
      // Mock a successful response but with null data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          gamificationData: null,
          badgeProgress: [],
          xpForNextLevel: 0,
          levelThresholds: [],
        }),
      });

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No Gamification Data')).toBeInTheDocument();
      });

      expect(screen.getByText('Start using ReviewQuest to earn XP and badges!')).toBeInTheDocument();
      expect(screen.getByText('Check Again')).toBeInTheDocument();
    });
  });
});
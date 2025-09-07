/**
 * Unit tests for GamificationDisplay component
 * Tests basic functionality, props handling, and component rendering
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import GamificationDisplay from '../GamificationDisplay';
import { GamificationData, XPAction, BadgeCategory } from '@/types/gamification';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

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
  ],
};

describe('GamificationDisplay Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Component Rendering', () => {
    it('should render with initial data', () => {
      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // Check main elements are rendered
      expect(screen.getByText('Your Progress')).toBeInTheDocument();
      expect(screen.getByText('Level 3')).toBeInTheDocument();
      expect(screen.getByText('750 XP')).toBeInTheDocument();
      expect(screen.getByText('Badge Collection')).toBeInTheDocument();
      expect(screen.getByText('Activity Summary')).toBeInTheDocument();
    });

    it('should display activity counts correctly', () => {
      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // Check activity summary numbers
      expect(screen.getByText('12')).toBeInTheDocument(); // Quests completed
      expect(screen.getByText('4')).toBeInTheDocument(); // Apps added
      expect(screen.getByText('5')).toBeInTheDocument(); // Current streak
      expect(screen.getByText('1')).toBeInTheDocument(); // Badges earned
    });

    it('should show refresh button', () => {
      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      const refreshButton = screen.getByLabelText(/refresh/i);
      expect(refreshButton).toBeInTheDocument();
    });

    it('should display last updated time', () => {
      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      expect(screen.getByText(/Updated/)).toBeInTheDocument();
    });
  });

  describe('Props and Callbacks', () => {
    it('should call onRefresh when refresh button is clicked', async () => {
      const onRefresh = jest.fn();
      
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
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
          badgeProgress: [],
          xpForNextLevel: 250,
          levelThresholds: [0, 100, 250, 500, 1000],
        }),
      });

      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} onRefresh={onRefresh} />
        </TestWrapper>
      );

      const refreshButton = screen.getByLabelText(/refresh/i);
      fireEvent.click(refreshButton);

      expect(onRefresh).toHaveBeenCalled();
    });

    it('should call onError when provided and error occurs', async () => {
      const onError = jest.fn();
      
      // Mock API error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} onError={onError} />
        </TestWrapper>
      );

      const refreshButton = screen.getByLabelText(/refresh/i);
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it('should call onLevelUp when level increases', async () => {
      const onLevelUp = jest.fn();
      
      // Mock API response with higher level
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          gamificationData: {
            ...mockGamificationData,
            level: 4, // Level up from 3 to 4
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
          badgeProgress: [],
          xpForNextLevel: 250,
          levelThresholds: [0, 100, 250, 500, 1000],
        }),
      });

      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} onLevelUp={onLevelUp} />
        </TestWrapper>
      );

      const refreshButton = screen.getByLabelText(/refresh/i);
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(onLevelUp).toHaveBeenCalledWith(4);
      });
    });

    it('should call onBadgeEarned when new badge is earned', async () => {
      const onBadgeEarned = jest.fn();
      
      const newBadge = {
        id: 'quest-explorer',
        name: 'Quest Explorer',
        description: 'Reached 500 XP',
        category: BadgeCategory.MILESTONE,
        earnedAt: new Date('2024-01-26T10:00:00Z').toISOString(),
      };

      // Mock API response with new badge
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          gamificationData: {
            ...mockGamificationData,
            badges: [
              ...mockGamificationData.badges.map(badge => ({
                ...badge,
                earnedAt: badge.earnedAt.toISOString(),
              })),
              newBadge,
            ],
            streaks: {
              ...mockGamificationData.streaks,
              lastLoginDate: mockGamificationData.streaks.lastLoginDate?.toISOString(),
            },
            xpHistory: mockGamificationData.xpHistory.map(transaction => ({
              ...transaction,
              timestamp: transaction.timestamp.toISOString(),
            })),
          },
          badgeProgress: [],
          xpForNextLevel: 250,
          levelThresholds: [0, 100, 250, 500, 1000],
        }),
      });

      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} onBadgeEarned={onBadgeEarned} />
        </TestWrapper>
      );

      const refreshButton = screen.getByLabelText(/refresh/i);
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(onBadgeEarned).toHaveBeenCalledWith(expect.objectContaining({
          id: 'quest-explorer',
          name: 'Quest Explorer',
        }));
      });
    });
  });

  describe('Error States', () => {
    it('should show error message when no initial data and API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Gamification Data')).toBeInTheDocument();
      });

      expect(screen.getByText('Something went wrong while loading your XP and badges.')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should show authentication error for 401 response', async () => {
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
        expect(screen.getByText('Authentication Error')).toBeInTheDocument();
      });

      expect(screen.getByText('Please sign in again to view your progress.')).toBeInTheDocument();
      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading skeleton when no initial data', () => {
      // Mock fetch to never resolve
      mockFetch.mockImplementation(() => new Promise(() => {}));

      render(
        <TestWrapper>
          <GamificationDisplay />
        </TestWrapper>
      );

      // Should show skeleton elements
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not show loading skeleton when initial data is provided', () => {
      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // Should not show skeleton elements
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBe(0);

      // Should show actual content
      expect(screen.getByText('Level 3')).toBeInTheDocument();
    });
  });

  describe('No Data State', () => {
    it('should show no data message when API returns null data', async () => {
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

  describe('Component Integration', () => {
    it('should pass correct props to XPProgress component', () => {
      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // XPProgress should receive and display the correct data
      expect(screen.getByText('Level 3')).toBeInTheDocument();
      expect(screen.getByText('750 XP')).toBeInTheDocument();
    });

    it('should pass correct props to BadgeCollection component', () => {
      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // BadgeCollection should receive and display the correct data
      expect(screen.getByText('Badge Collection')).toBeInTheDocument();
      // Note: Badge names may not be visible without badge progress data
      // The component should still render the badge collection header
    });
  });
});
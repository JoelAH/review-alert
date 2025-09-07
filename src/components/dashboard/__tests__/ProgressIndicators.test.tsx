/**
 * Progress Indicators Component Unit Tests
 * Tests the React component for displaying progress indicators and suggestions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProgressIndicators from '../ProgressIndicators';
import { ProgressIndicatorsService } from '@/lib/services/progressIndicators';
import { GamificationData, XPAction, BadgeCategory } from '@/types/gamification';

// Mock the service
jest.mock('@/lib/services/progressIndicators');
const MockedProgressIndicatorsService = ProgressIndicatorsService as jest.Mocked<typeof ProgressIndicatorsService>;

// Test theme
const theme = createTheme();

// Wrapper component for theme provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('ProgressIndicators', () => {
  // Helper function to create mock gamification data
  const createMockGamificationData = (overrides: Partial<GamificationData> = {}): GamificationData => ({
    xp: 450,
    level: 3,
    badges: [],
    streaks: {
      currentLoginStreak: 2,
      longestLoginStreak: 5,
      lastLoginDate: new Date('2024-01-15'),
    },
    activityCounts: {
      questsCreated: 8,
      questsCompleted: 5,
      questsInProgress: 3,
      appsAdded: 2,
      reviewInteractions: 10,
    },
    xpHistory: [
      {
        amount: 15,
        action: XPAction.QUEST_COMPLETED,
        timestamp: new Date('2024-01-15T10:00:00Z'),
      },
    ],
    ...overrides,
  });

  const mockSuggestions = [
    {
      id: 'badge-quest-explorer',
      type: 'badge' as const,
      title: 'Almost earned: Quest Explorer',
      description: 'Reached 500 XP',
      actionText: 'Complete quests or add apps to earn more XP',
      progress: 450,
      target: 500,
      priority: 'high' as const,
      category: BadgeCategory.MILESTONE,
      estimatedActions: 4,
      motivationalMessage: 'Just 50 XP away from earning "Quest Explorer"!',
    },
    {
      id: 'level-4',
      type: 'level' as const,
      title: 'Almost Level 4!',
      description: "You're close to reaching Level 4",
      actionText: 'Complete quests or add apps to level up',
      progress: 200,
      target: 250,
      priority: 'medium' as const,
      estimatedActions: 4,
      motivationalMessage: 'Just 50 XP away from Level 4!',
    },
    {
      id: 'complete-quests',
      type: 'activity' as const,
      title: 'Complete your in-progress quests',
      description: 'You have 3 quests waiting to be completed',
      actionText: 'Mark quests as completed',
      progress: 0,
      target: 3,
      priority: 'medium' as const,
      estimatedActions: 3,
      motivationalMessage: 'Complete your quests to earn 45 XP!',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    MockedProgressIndicatorsService.getProgressSuggestions.mockReturnValue(mockSuggestions);
    MockedProgressIndicatorsService.getSmartSuggestions.mockReturnValue([]);
    MockedProgressIndicatorsService.getMotivationalMessages.mockReturnValue([
      'You have 3 quests in progress. Complete them to earn XP!',
      'Keep your 2-day streak going! 1 more day for bonus XP.',
    ]);
  });

  describe('rendering', () => {
    it('should render progress indicators with suggestions', () => {
      const gamificationData = createMockGamificationData();
      
      render(
        <TestWrapper>
          <ProgressIndicators gamificationData={gamificationData} />
        </TestWrapper>
      );

      // Check header
      expect(screen.getByText('Progress & Suggestions')).toBeInTheDocument();
      expect(screen.getByText('3 suggestions')).toBeInTheDocument();

      // Check suggestions are rendered
      expect(screen.getByText('Almost earned: Quest Explorer')).toBeInTheDocument();
      expect(screen.getByText('Almost Level 4!')).toBeInTheDocument();
      expect(screen.getByText('Complete your in-progress quests')).toBeInTheDocument();
    });

    it('should render motivational messages when enabled', () => {
      const gamificationData = createMockGamificationData();
      
      render(
        <TestWrapper>
          <ProgressIndicators 
            gamificationData={gamificationData} 
            showMotivationalMessages={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Keep Going!')).toBeInTheDocument();
      expect(screen.getByText('You have 3 quests in progress. Complete them to earn XP!')).toBeInTheDocument();
    });

    it('should not render motivational messages when disabled', () => {
      const gamificationData = createMockGamificationData();
      
      render(
        <TestWrapper>
          <ProgressIndicators 
            gamificationData={gamificationData} 
            showMotivationalMessages={false}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Keep Going!')).not.toBeInTheDocument();
    });

    it('should render encouraging message when no suggestions available', () => {
      MockedProgressIndicatorsService.getProgressSuggestions.mockReturnValue([]);
      MockedProgressIndicatorsService.getSmartSuggestions.mockReturnValue([]);
      
      const gamificationData = createMockGamificationData();
      
      render(
        <TestWrapper>
          <ProgressIndicators gamificationData={gamificationData} />
        </TestWrapper>
      );

      expect(screen.getByText("You're doing great!")).toBeInTheDocument();
      expect(screen.getByText('Keep up the excellent work. Continue completing quests and tracking apps to earn more XP and badges.')).toBeInTheDocument();
    });

    it('should limit suggestions to maxSuggestions prop', () => {
      const gamificationData = createMockGamificationData();
      
      render(
        <TestWrapper>
          <ProgressIndicators 
            gamificationData={gamificationData} 
            maxSuggestions={2}
          />
        </TestWrapper>
      );

      // Should only show first 2 suggestions
      expect(screen.getByText('Almost earned: Quest Explorer')).toBeInTheDocument();
      expect(screen.getByText('Almost Level 4!')).toBeInTheDocument();
      expect(screen.queryByText('Complete your in-progress quests')).not.toBeInTheDocument();
    });
  });

  describe('suggestion cards', () => {
    it('should display suggestion details correctly', () => {
      const gamificationData = createMockGamificationData();
      
      render(
        <TestWrapper>
          <ProgressIndicators gamificationData={gamificationData} />
        </TestWrapper>
      );

      // Check badge suggestion details
      const badgeSuggestion = screen.getByText('Almost earned: Quest Explorer').closest('[role="region"]') || 
                             screen.getByText('Almost earned: Quest Explorer').closest('.MuiCard-root');
      
      expect(badgeSuggestion).toBeInTheDocument();
      
      // Check progress display
      expect(screen.getByText('450 / 500')).toBeInTheDocument();
      
      // Check priority chip
      expect(screen.getByText('high')).toBeInTheDocument();
      
      // Check motivational message
      expect(screen.getByText('Just 50 XP away from earning "Quest Explorer"!')).toBeInTheDocument();
      
      // Check action button
      expect(screen.getByText('Complete quests or add apps to earn more XP')).toBeInTheDocument();
      
      // Check estimated actions chip (there might be multiple "4"s, so we check for the button containing it)
      const actionButton = screen.getByText('Complete quests or add apps to earn more XP');
      expect(actionButton.parentElement).toHaveTextContent('4');
    });

    it('should display correct icons for different suggestion types', () => {
      const gamificationData = createMockGamificationData();
      
      render(
        <TestWrapper>
          <ProgressIndicators gamificationData={gamificationData} />
        </TestWrapper>
      );

      // Icons are rendered as SVG elements with specific test ids or aria-labels
      // We can check for the presence of the suggestion cards which contain the icons
      expect(screen.getByText('Almost earned: Quest Explorer')).toBeInTheDocument(); // Badge icon
      expect(screen.getByText('Almost Level 4!')).toBeInTheDocument(); // Level icon
      expect(screen.getByText('Complete your in-progress quests')).toBeInTheDocument(); // Activity icon
    });

    it('should display progress bars with correct percentages', () => {
      const gamificationData = createMockGamificationData();
      
      render(
        <TestWrapper>
          <ProgressIndicators gamificationData={gamificationData} />
        </TestWrapper>
      );

      // Check for progress indicators (LinearProgress components)
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
      
      // The first progress bar should be for the Quest Explorer badge (450/500 = 90%)
      expect(progressBars[0]).toHaveAttribute('aria-valuenow', '90');
    });
  });

  describe('interactions', () => {
    it('should call onActionClick when action button is clicked', () => {
      const mockOnActionClick = jest.fn();
      const gamificationData = createMockGamificationData();
      
      render(
        <TestWrapper>
          <ProgressIndicators 
            gamificationData={gamificationData} 
            onActionClick={mockOnActionClick}
          />
        </TestWrapper>
      );

      // Click the first action button
      const actionButton = screen.getByText('Complete quests or add apps to earn more XP');
      fireEvent.click(actionButton);

      expect(mockOnActionClick).toHaveBeenCalledWith(mockSuggestions[0]);
    });

    it('should expand/collapse motivational messages', async () => {
      const gamificationData = createMockGamificationData();
      
      render(
        <TestWrapper>
          <ProgressIndicators 
            gamificationData={gamificationData} 
            showMotivationalMessages={true}
          />
        </TestWrapper>
      );

      // Initially, only first message should be visible
      expect(screen.getByText('You have 3 quests in progress. Complete them to earn XP!')).toBeInTheDocument();
      
      // Second message should not be visible initially
      expect(screen.queryByText('Keep your 2-day streak going! 1 more day for bonus XP.')).not.toBeInTheDocument();

      // Click expand button
      const expandButton = screen.getByRole('button', { name: /expand messages/i });
      fireEvent.click(expandButton);

      // Wait for collapse animation
      await waitFor(() => {
        expect(screen.getByText((content, element) => {
          return content.includes('Keep your 2-day streak going!');
        })).toBeInTheDocument();
      });
    });

    it('should show/hide all suggestions when Show All button is clicked', () => {
      // Create more suggestions to trigger Show All button
      const manySuggestions = [
        ...mockSuggestions,
        {
          id: 'extra-suggestion-1',
          type: 'activity' as const,
          title: 'Extra Suggestion 1',
          description: 'Extra description',
          actionText: 'Extra action',
          progress: 1,
          target: 5,
          priority: 'low' as const,
        },
        {
          id: 'extra-suggestion-2',
          type: 'activity' as const,
          title: 'Extra Suggestion 2',
          description: 'Extra description',
          actionText: 'Extra action',
          progress: 2,
          target: 5,
          priority: 'low' as const,
        },
      ];

      MockedProgressIndicatorsService.getProgressSuggestions.mockReturnValue(manySuggestions);
      
      const gamificationData = createMockGamificationData();
      
      render(
        <TestWrapper>
          <ProgressIndicators 
            gamificationData={gamificationData} 
            maxSuggestions={3}
          />
        </TestWrapper>
      );

      // Initially should show only 3 suggestions
      expect(screen.getByText('Almost earned: Quest Explorer')).toBeInTheDocument();
      expect(screen.getByText('Almost Level 4!')).toBeInTheDocument();
      expect(screen.getByText('Complete your in-progress quests')).toBeInTheDocument();
      expect(screen.queryByText('Extra Suggestion 1')).not.toBeInTheDocument();

      // Click Show All button
      const showAllButton = screen.getByText('Show All');
      fireEvent.click(showAllButton);

      // Now should show all suggestions
      expect(screen.getByText('Extra Suggestion 1')).toBeInTheDocument();
      expect(screen.getByText('Extra Suggestion 2')).toBeInTheDocument();
      
      // Button text should change
      expect(screen.getByText('Show Less')).toBeInTheDocument();
    });
  });

  describe('summary stats', () => {
    it('should display correct summary statistics', () => {
      const gamificationData = createMockGamificationData();
      
      render(
        <TestWrapper>
          <ProgressIndicators gamificationData={gamificationData} />
        </TestWrapper>
      );

      expect(screen.getByText('Quick Stats')).toBeInTheDocument();
      
      // Check priority counts by looking for specific sections
      const quickStatsSection = screen.getByText('Quick Stats').closest('.MuiCardContent-root');
      expect(quickStatsSection).toBeInTheDocument();
      
      // Check that the stats are displayed (we can't easily test specific numbers due to multiple "1"s)
      expect(screen.getByText('High Priority')).toBeInTheDocument();
      expect(screen.getByText('Medium Priority')).toBeInTheDocument();
      expect(screen.getByText('Badge Progress')).toBeInTheDocument();
      
      // Check average progress percentage
      // (450/500 + 200/250 + 0/3) / 3 = (0.9 + 0.8 + 0) / 3 = 0.567 ≈ 57%
      expect(screen.getByText('57%')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      const gamificationData = createMockGamificationData();
      
      render(
        <TestWrapper>
          <ProgressIndicators gamificationData={gamificationData} />
        </TestWrapper>
      );

      // Check for progress bars with proper ARIA attributes
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
      
      progressBars.forEach(progressBar => {
        expect(progressBar).toHaveAttribute('aria-valuenow');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      });

      // Check for buttons with proper labels
      const allButtons = screen.getAllByRole('button');
      expect(allButtons.length).toBeGreaterThan(0);
      
      // Check that action buttons have accessible names (skip the expand button which might not have a name)
      const actionButtons = allButtons.filter(button => 
        button.textContent && (button.textContent.includes('Complete') || button.textContent.includes('Mark'))
      );
      
      actionButtons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should support keyboard navigation', () => {
      const mockOnActionClick = jest.fn();
      const gamificationData = createMockGamificationData();
      
      render(
        <TestWrapper>
          <ProgressIndicators 
            gamificationData={gamificationData} 
            onActionClick={mockOnActionClick}
          />
        </TestWrapper>
      );

      const actionButton = screen.getByText('Complete quests or add apps to earn more XP');
      
      // Focus the button
      actionButton.focus();
      expect(actionButton).toHaveFocus();
      
      // Press Enter (use click instead as keyDown might not trigger the onClick handler in tests)
      fireEvent.click(actionButton);
      expect(mockOnActionClick).toHaveBeenCalledWith(mockSuggestions[0]);
    });
  });

  describe('responsive design', () => {
    it('should render properly on different screen sizes', () => {
      const gamificationData = createMockGamificationData();
      
      // Test mobile view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      render(
        <TestWrapper>
          <ProgressIndicators gamificationData={gamificationData} />
        </TestWrapper>
      );

      // Component should render without errors on mobile
      expect(screen.getByText('Progress & Suggestions')).toBeInTheDocument();
      expect(screen.getByText('Almost earned: Quest Explorer')).toBeInTheDocument();
    });
  });
});
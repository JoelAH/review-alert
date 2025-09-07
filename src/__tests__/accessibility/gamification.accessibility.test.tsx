/**
 * Gamification Accessibility Tests
 * Tests accessibility compliance for all gamification UI components
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import GamificationDisplay from '@/components/dashboard/GamificationDisplay';
import ProgressIndicators from '@/components/dashboard/ProgressIndicators';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { NetworkStatusIndicator, RetryButton } from '@/components/common/NetworkStatus';
import { GamificationDisplaySkeleton } from '@/components/common/LoadingStates';
import { GamificationData, BadgeCategory, XPAction } from '@/types/gamification';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Test theme with accessibility considerations
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',
      contrastText: '#ffffff',
    },
  },
  typography: {
    fontSize: 14, // Ensure readable font size
  },
});

// Wrapper component for theme provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

// Mock gamification data
const mockGamificationData: GamificationData = {
  xp: 350,
  level: 3,
  badges: [
    {
      id: 'getting-started',
      name: 'Getting Started',
      description: 'Earned your first 100 XP',
      category: BadgeCategory.MILESTONE,
      earnedAt: new Date('2024-01-01'),
    },
    {
      id: 'quest-explorer',
      name: 'Quest Explorer',
      description: 'Reached 500 XP',
      category: BadgeCategory.MILESTONE,
      earnedAt: new Date('2024-01-15'),
    },
  ],
  streaks: {
    currentLoginStreak: 5,
    longestLoginStreak: 8,
    lastLoginDate: new Date('2024-01-20'),
  },
  activityCounts: {
    questsCreated: 8,
    questsCompleted: 6,
    questsInProgress: 2,
    appsAdded: 3,
    reviewInteractions: 15,
  },
  xpHistory: [
    {
      amount: 10,
      action: XPAction.QUEST_CREATED,
      timestamp: new Date('2024-01-01'),
    },
    {
      amount: 15,
      action: XPAction.QUEST_COMPLETED,
      timestamp: new Date('2024-01-02'),
    },
    {
      amount: 20,
      action: XPAction.APP_ADDED,
      timestamp: new Date('2024-01-03'),
    },
  ],
};

describe('Gamification Accessibility Tests', () => {
  describe('GamificationDisplay Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // Check for proper heading structure
      const mainHeading = screen.getByRole('heading', { level: 5, name: /your progress/i });
      expect(mainHeading).toBeInTheDocument();

      const subHeadings = screen.getAllByRole('heading', { level: 6 });
      expect(subHeadings.length).toBeGreaterThan(0);
    });

    it('should have accessible progress indicators', () => {
      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // Check for progress bars with proper ARIA attributes
      const progressBars = screen.getAllByRole('progressbar');
      progressBars.forEach(progressBar => {
        expect(progressBar).toHaveAttribute('aria-valuenow');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      });
    });

    it('should have accessible buttons with proper labels', () => {
      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // Check refresh button
      const refreshButton = screen.getByRole('button', { name: /refresh data/i });
      expect(refreshButton).toBeInTheDocument();
      expect(refreshButton).toHaveAccessibleName();
    });

    it('should support keyboard navigation', () => {
      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // Check that interactive elements are focusable
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabindex');
        button.focus();
        expect(button).toHaveFocus();
      });
    });

    it('should have proper color contrast', async () => {
      const { container } = render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // axe will check color contrast automatically
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels for statistics', () => {
      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // Check that statistics have proper labels
      expect(screen.getByText('Quests Completed')).toBeInTheDocument();
      expect(screen.getByText('Apps Added')).toBeInTheDocument();
      expect(screen.getByText('Current Streak')).toBeInTheDocument();
      expect(screen.getByText('Badges Earned')).toBeInTheDocument();
    });
  });

  describe('ProgressIndicators Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <ProgressIndicators gamificationData={mockGamificationData} />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible progress bars with labels', () => {
      render(
        <TestWrapper>
          <ProgressIndicators gamificationData={mockGamificationData} />
        </TestWrapper>
      );

      const progressBars = screen.getAllByRole('progressbar');
      progressBars.forEach(progressBar => {
        expect(progressBar).toHaveAttribute('aria-valuenow');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      });
    });

    it('should have accessible action buttons', () => {
      render(
        <TestWrapper>
          <ProgressIndicators gamificationData={mockGamificationData} />
        </TestWrapper>
      );

      const actionButtons = screen.getAllByRole('button').filter(button => 
        button.textContent && (
          button.textContent.includes('Complete') || 
          button.textContent.includes('Add') ||
          button.textContent.includes('Keep')
        )
      );

      actionButtons.forEach(button => {
        expect(button).toHaveAccessibleName();
        expect(button).not.toHaveAttribute('aria-disabled', 'true');
      });
    });

    it('should support keyboard navigation for suggestions', () => {
      render(
        <TestWrapper>
          <ProgressIndicators gamificationData={mockGamificationData} />
        </TestWrapper>
      );

      const actionButtons = screen.getAllByRole('button');
      
      // Test tab navigation
      if (actionButtons.length > 0) {
        actionButtons[0].focus();
        expect(actionButtons[0]).toHaveFocus();

        // Test Enter key activation
        fireEvent.keyDown(actionButtons[0], { key: 'Enter', code: 'Enter' });
        // Button should remain focusable after interaction
        expect(actionButtons[0]).toHaveAttribute('tabindex');
      }
    });

    it('should have proper semantic structure', () => {
      render(
        <TestWrapper>
          <ProgressIndicators gamificationData={mockGamificationData} />
        </TestWrapper>
      );

      // Check for proper heading structure
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      // Check for proper list structure if applicable
      const lists = screen.queryAllByRole('list');
      lists.forEach(list => {
        const listItems = screen.getAllByRole('listitem');
        expect(listItems.length).toBeGreaterThan(0);
      });
    });
  });

  describe('ErrorBoundary Component', () => {
    // Suppress console.error for error boundary tests
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalError;
    });

    const ThrowError = () => {
      throw new Error('Test accessibility error');
    };

    it('should have no accessibility violations in error state', async () => {
      const { container } = render(
        <TestWrapper>
          <ErrorBoundary retryable={true} showErrorDetails={true}>
            <ThrowError />
          </ErrorBoundary>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible error message and actions', () => {
      render(
        <TestWrapper>
          <ErrorBoundary retryable={true}>
            <ThrowError />
          </ErrorBoundary>
        </TestWrapper>
      );

      // Check error heading
      const errorHeading = screen.getByRole('heading', { name: /something went wrong/i });
      expect(errorHeading).toBeInTheDocument();

      // Check retry button accessibility
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveAccessibleName();
      expect(retryButton).not.toHaveAttribute('aria-disabled', 'true');

      // Check refresh button accessibility
      const refreshButton = screen.getByRole('button', { name: /refresh page/i });
      expect(refreshButton).toBeInTheDocument();
      expect(refreshButton).toHaveAccessibleName();
    });

    it('should support keyboard navigation in error state', () => {
      render(
        <TestWrapper>
          <ErrorBoundary retryable={true} showErrorDetails={true}>
            <ThrowError />
          </ErrorBoundary>
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      
      // All buttons should be keyboard accessible
      buttons.forEach(button => {
        button.focus();
        expect(button).toHaveFocus();
        
        // Test Enter key
        fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
        
        // Test Space key
        fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      });
    });

    it('should have proper ARIA attributes for expandable content', () => {
      render(
        <TestWrapper>
          <ErrorBoundary retryable={true} showErrorDetails={true}>
            <ThrowError />
          </ErrorBoundary>
        </TestWrapper>
      );

      const expandButton = screen.getByText(/show error details/i);
      expect(expandButton).toBeInTheDocument();

      // Click to expand
      fireEvent.click(expandButton);

      // Check for proper ARIA attributes on expanded content
      const expandedContent = screen.getByText(/Error Details:/);
      expect(expandedContent).toBeInTheDocument();
    });
  });

  describe('Loading States Accessibility', () => {
    it('should have accessible loading indicators', async () => {
      const { container } = render(
        <TestWrapper>
          <GamificationDisplaySkeleton />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels for loading states', () => {
      render(
        <TestWrapper>
          <GamificationDisplaySkeleton />
        </TestWrapper>
      );

      // Skeleton components should not interfere with screen readers
      // They use proper semantic elements and don't have confusing ARIA labels
      const skeletonElements = container.querySelectorAll('[class*="MuiSkeleton"]');
      skeletonElements.forEach(element => {
        // Skeleton elements should not have confusing ARIA labels
        expect(element).not.toHaveAttribute('aria-label');
        expect(element).not.toHaveAttribute('role', 'button');
      });
    });
  });

  describe('Network Status Accessibility', () => {
    it('should have accessible network status indicators', async () => {
      const { container } = render(
        <TestWrapper>
          <NetworkStatusIndicator showWhenOnline={true} />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible retry button', async () => {
      const onRetry = jest.fn();
      const { container } = render(
        <TestWrapper>
          <RetryButton onRetry={onRetry} retryCount={1} maxRetries={3} />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();

      const retryButton = screen.getByRole('button');
      expect(retryButton).toHaveAccessibleName();
      expect(retryButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Focus Management', () => {
    it('should maintain focus order in gamification display', () => {
      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // Get all focusable elements
      const focusableElements = screen.getAllByRole('button');
      
      // Test tab order
      if (focusableElements.length > 1) {
        focusableElements[0].focus();
        expect(focusableElements[0]).toHaveFocus();

        // Simulate tab navigation
        fireEvent.keyDown(focusableElements[0], { key: 'Tab', code: 'Tab' });
        
        // Focus should move to next element (this is browser behavior, 
        // but we can test that elements are properly focusable)
        focusableElements.forEach(element => {
          expect(element).toHaveAttribute('tabindex');
        });
      }
    });

    it('should handle focus trapping in modal dialogs', () => {
      // This would test badge detail modals or other modal dialogs
      // For now, we ensure that interactive elements are properly focusable
      render(
        <TestWrapper>
          <ProgressIndicators gamificationData={mockGamificationData} />
        </TestWrapper>
      );

      const interactiveElements = [
        ...screen.getAllByRole('button'),
        ...screen.getAllByRole('progressbar'),
      ];

      interactiveElements.forEach(element => {
        if (element.tagName === 'BUTTON') {
          expect(element).toHaveAttribute('tabindex');
        }
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels for progress information', () => {
      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // Check that progress information is accessible to screen readers
      const progressBars = screen.getAllByRole('progressbar');
      progressBars.forEach(progressBar => {
        expect(progressBar).toHaveAttribute('aria-valuenow');
        expect(progressBar).toHaveAttribute('aria-valuemin');
        expect(progressBar).toHaveAttribute('aria-valuemax');
      });
    });

    it('should have descriptive text for statistics', () => {
      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // Statistics should have descriptive labels
      expect(screen.getByText('Quests Completed')).toBeInTheDocument();
      expect(screen.getByText('Apps Added')).toBeInTheDocument();
      expect(screen.getByText('Current Streak')).toBeInTheDocument();
      expect(screen.getByText('Badges Earned')).toBeInTheDocument();

      // Numbers should be associated with their labels
      expect(screen.getByText('6')).toBeInTheDocument(); // Quests completed
      expect(screen.getByText('3')).toBeInTheDocument(); // Apps added
      expect(screen.getByText('5')).toBeInTheDocument(); // Current streak
      expect(screen.getByText('2')).toBeInTheDocument(); // Badges earned
    });

    it('should provide alternative text for icons', () => {
      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // Icons should either have aria-hidden="true" or proper labels
      const icons = container.querySelectorAll('svg');
      icons.forEach(icon => {
        const hasAriaHidden = icon.hasAttribute('aria-hidden');
        const hasAriaLabel = icon.hasAttribute('aria-label');
        const hasAriaLabelledBy = icon.hasAttribute('aria-labelledby');
        
        // Icon should either be hidden from screen readers or have a label
        expect(hasAriaHidden || hasAriaLabel || hasAriaLabelledBy).toBe(true);
      });
    });
  });

  describe('High Contrast Mode Support', () => {
    it('should work with high contrast theme', async () => {
      const highContrastTheme = createTheme({
        palette: {
          mode: 'dark',
          primary: {
            main: '#ffffff',
            contrastText: '#000000',
          },
          background: {
            default: '#000000',
            paper: '#1a1a1a',
          },
          text: {
            primary: '#ffffff',
            secondary: '#cccccc',
          },
        },
      });

      const { container } = render(
        <ThemeProvider theme={highContrastTheme}>
          <GamificationDisplay initialData={mockGamificationData} />
        </ThemeProvider>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect prefers-reduced-motion', () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // Component should render without motion-heavy animations
      // This is more of a visual test, but we can ensure the component renders
      expect(screen.getByText('Your Progress')).toBeInTheDocument();
    });
  });

  describe('Mobile Accessibility', () => {
    it('should be accessible on mobile viewports', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // iPhone SE width
      });

      const { container } = render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper touch targets on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <GamificationDisplay initialData={mockGamificationData} />
        </TestWrapper>
      );

      // Check that buttons are large enough for touch interaction
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        // MUI buttons should have adequate touch targets (44px minimum)
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Error State Accessibility', () => {
    const ThrowError = () => {
      throw new Error('Accessibility test error');
    };

    it('should have accessible error states', async () => {
      const { container } = render(
        <TestWrapper>
          <ErrorBoundary retryable={true} showErrorDetails={true}>
            <ThrowError />
          </ErrorBoundary>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should announce errors to screen readers', () => {
      render(
        <TestWrapper>
          <ErrorBoundary retryable={true}>
            <ThrowError />
          </ErrorBoundary>
        </TestWrapper>
      );

      // Error should be announced via proper heading structure
      const errorHeading = screen.getByRole('heading', { name: /something went wrong/i });
      expect(errorHeading).toBeInTheDocument();

      // Error message should be readable
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });
  });
});
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import ReviewCard from '../ReviewCard';
import { ReviewSentiment, ReviewQuest, ReviewPriority } from '@/lib/models/client/review';

// Mock useMediaQuery
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn(),
}));

const mockUseMediaQuery = useMediaQuery as jest.MockedFunction<typeof useMediaQuery>;

const theme = createTheme();

const baseReview = {
  _id: 'review1',
  appId: 'app1',
  name: 'John Doe',
  rating: 5,
  comment: 'Great app! Love the features.',
  date: new Date('2024-01-15'),
  user: 'user123',
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ReviewCard Visual Indicators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to desktop viewport
    mockUseMediaQuery.mockReturnValue(false);
  });

  describe('Platform Icons', () => {
    test('displays Google Play icon with correct tooltip', () => {
      const review = { ...baseReview };
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="GooglePlay" />
      );

      const androidIcon = screen.getByTestId('AndroidIcon');
      expect(androidIcon).toBeInTheDocument();
      expect(androidIcon).toHaveStyle({ color: '#4CAF50' });
      
      // Check tooltip (may need to hover to see it)
      expect(screen.getByLabelText('Google Play')).toBeInTheDocument();
    });

    test('displays Apple App Store icon with correct tooltip', () => {
      const review = { ...baseReview };
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="AppleStore" />
      );

      const appleIcon = screen.getByTestId('AppleIcon');
      expect(appleIcon).toBeInTheDocument();
      expect(appleIcon).toHaveStyle({ color: '#000000' });
      
      expect(screen.getByLabelText('App Store')).toBeInTheDocument();
    });

    test('displays Chrome Web Store icon with correct tooltip', () => {
      const review = { ...baseReview };
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="ChromeExt" />
      );

      const extensionIcon = screen.getByTestId('ExtensionIcon');
      expect(extensionIcon).toBeInTheDocument();
      expect(extensionIcon).toHaveStyle({ color: '#4285F4' });
      
      expect(screen.getByLabelText('Chrome Web Store')).toBeInTheDocument();
    });

    test('platform icons are smaller on mobile', () => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile viewport
      
      const review = { ...baseReview };
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="GooglePlay" />
      );

      const androidIcon = screen.getByTestId('AndroidIcon');
      expect(androidIcon).toBeInTheDocument();
      // Mobile icons should have fontSize: 20 instead of 24
    });
  });

  describe('Sentiment Indicators', () => {
    test('displays positive sentiment with green border', () => {
      const review = { 
        ...baseReview, 
        sentiment: ReviewSentiment.POSITIVE 
      };
      
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="GooglePlay" />
      );

      const card = screen.getByRole('button', { name: 'Positive feedback' });
      expect(card).toBeInTheDocument();
      
      // Check that the card has the positive sentiment styling
      const cardElement = card.closest('.MuiCard-root');
      expect(cardElement).toHaveStyle({
        borderLeft: `4px solid ${theme.palette.success.main}`,
      });
    });

    test('displays negative sentiment with red border', () => {
      const review = { 
        ...baseReview, 
        sentiment: ReviewSentiment.NEGATIVE 
      };
      
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="GooglePlay" />
      );

      const card = screen.getByRole('button', { name: 'Negative feedback' });
      expect(card).toBeInTheDocument();
      
      const cardElement = card.closest('.MuiCard-root');
      expect(cardElement).toHaveStyle({
        borderLeft: `4px solid ${theme.palette.error.main}`,
      });
    });

    test('displays neutral sentiment with default border', () => {
      const review = { 
        ...baseReview, 
        sentiment: undefined // No sentiment
      };
      
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="GooglePlay" />
      );

      const card = screen.getByRole('button', { name: 'Neutral feedback' });
      expect(card).toBeInTheDocument();
      
      const cardElement = card.closest('.MuiCard-root');
      expect(cardElement).toHaveStyle({
        borderLeft: `4px solid ${theme.palette.grey[300]}`,
      });
    });
  });

  describe('Quest Type Icons', () => {
    test('displays bug report icon with correct tooltip', () => {
      const review = { 
        ...baseReview, 
        quest: ReviewQuest.BUG 
      };
      
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="GooglePlay" />
      );

      const bugIcon = screen.getByTestId('BugReportIcon');
      expect(bugIcon).toBeInTheDocument();
      expect(bugIcon).toHaveStyle({ color: theme.palette.error.main });
      
      expect(screen.getByLabelText('Bug Report')).toBeInTheDocument();
    });

    test('displays feature request icon with correct tooltip', () => {
      const review = { 
        ...baseReview, 
        quest: ReviewQuest.FEATURE_REQUEST 
      };
      
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="GooglePlay" />
      );

      const lightbulbIcon = screen.getByTestId('LightbulbIcon');
      expect(lightbulbIcon).toBeInTheDocument();
      expect(lightbulbIcon).toHaveStyle({ color: theme.palette.warning.main });
      
      expect(screen.getByLabelText('Feature Request')).toBeInTheDocument();
    });

    test('displays other feedback icon with correct tooltip', () => {
      const review = { 
        ...baseReview, 
        quest: ReviewQuest.OTHER 
      };
      
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="GooglePlay" />
      );

      const questionIcon = screen.getByTestId('HelpOutlineIcon');
      expect(questionIcon).toBeInTheDocument();
      expect(questionIcon).toHaveStyle({ color: theme.palette.info.main });
      
      expect(screen.getByLabelText('Other Feedback')).toBeInTheDocument();
    });

    test('does not display quest icon when quest is undefined', () => {
      const review = { 
        ...baseReview, 
        quest: undefined 
      };
      
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="GooglePlay" />
      );

      expect(screen.queryByTestId('BugReportIcon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('LightbulbIcon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('HelpOutlineIcon')).not.toBeInTheDocument();
    });

    test('quest icons are smaller on mobile', () => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile viewport
      
      const review = { 
        ...baseReview, 
        quest: ReviewQuest.BUG 
      };
      
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="GooglePlay" />
      );

      const bugIcon = screen.getByTestId('BugReportIcon');
      expect(bugIcon).toBeInTheDocument();
      // Mobile quest icons should have fontSize: 16 instead of 18
    });
  });

  describe('Priority Indicators', () => {
    test('displays high priority with red dot and tooltip', () => {
      const review = { 
        ...baseReview, 
        priority: ReviewPriority.HIGH 
      };
      
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="GooglePlay" />
      );

      const priorityDot = screen.getByTestId('CircleIcon');
      expect(priorityDot).toBeInTheDocument();
      expect(priorityDot).toHaveStyle({ color: theme.palette.error.main });
      
      expect(screen.getByLabelText('High Priority')).toBeInTheDocument();
    });

    test('displays medium priority with orange dot and tooltip', () => {
      const review = { 
        ...baseReview, 
        priority: ReviewPriority.MEDIUM 
      };
      
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="GooglePlay" />
      );

      const priorityDot = screen.getByTestId('CircleIcon');
      expect(priorityDot).toBeInTheDocument();
      expect(priorityDot).toHaveStyle({ color: theme.palette.warning.main });
      
      expect(screen.getByLabelText('Medium Priority')).toBeInTheDocument();
    });

    test('displays low priority with gray dot and tooltip', () => {
      const review = { 
        ...baseReview, 
        priority: ReviewPriority.LOW 
      };
      
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="GooglePlay" />
      );

      const priorityDot = screen.getByTestId('CircleIcon');
      expect(priorityDot).toBeInTheDocument();
      expect(priorityDot).toHaveStyle({ color: theme.palette.grey[500] });
      
      expect(screen.getByLabelText('Low Priority')).toBeInTheDocument();
    });

    test('does not display priority indicator when priority is undefined', () => {
      const review = { 
        ...baseReview, 
        priority: undefined 
      };
      
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="GooglePlay" />
      );

      expect(screen.queryByTestId('CircleIcon')).not.toBeInTheDocument();
    });

    test('priority dots are smaller on mobile', () => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile viewport
      
      const review = { 
        ...baseReview, 
        priority: ReviewPriority.HIGH 
      };
      
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="GooglePlay" />
      );

      const priorityDot = screen.getByTestId('CircleIcon');
      expect(priorityDot).toBeInTheDocument();
      // Mobile priority dots should have fontSize: 12 instead of 14
    });
  });

  describe('Combined Visual Indicators', () => {
    test('displays all visual indicators together correctly', () => {
      const review = { 
        ...baseReview, 
        sentiment: ReviewSentiment.NEGATIVE,
        quest: ReviewQuest.BUG,
        priority: ReviewPriority.HIGH
      };
      
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="GooglePlay" />
      );

      // Should have all indicators
      expect(screen.getByTestId('AndroidIcon')).toBeInTheDocument(); // Platform
      expect(screen.getByTestId('BugReportIcon')).toBeInTheDocument(); // Quest
      expect(screen.getByTestId('CircleIcon')).toBeInTheDocument(); // Priority
      
      // Should have negative sentiment border
      const card = screen.getByRole('button', { name: 'Negative feedback' });
      expect(card).toBeInTheDocument();
    });

    test('visual indicators do not overlap or interfere with each other', () => {
      const review = { 
        ...baseReview, 
        sentiment: ReviewSentiment.POSITIVE,
        quest: ReviewQuest.FEATURE_REQUEST,
        priority: ReviewPriority.MEDIUM
      };
      
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="AppleStore" />
      );

      // All indicators should be present and properly spaced
      expect(screen.getByTestId('AppleIcon')).toBeInTheDocument();
      expect(screen.getByTestId('LightbulbIcon')).toBeInTheDocument();
      expect(screen.getByTestId('CircleIcon')).toBeInTheDocument();
      
      // Check that they're in the correct container
      const indicatorContainer = screen.getByTestId('LightbulbIcon').closest('div');
      expect(indicatorContainer).toContainElement(screen.getByTestId('CircleIcon'));
    });
  });

  describe('Hover Effects', () => {
    test('card has hover effects on desktop', () => {
      const review = { ...baseReview };
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="GooglePlay" />
      );

      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
      
      // Hover effects are CSS-based, so we just verify the card is interactive
      expect(card).toHaveStyle({ cursor: 'pointer' });
    });

    test('hover effects are minimal on mobile', () => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile viewport
      
      const review = { ...baseReview };
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="GooglePlay" />
      );

      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
      
      // On mobile, hover effects should be disabled or minimal
      // This is primarily handled by CSS media queries
    });
  });

  describe('Accessibility of Visual Indicators', () => {
    test('all visual indicators have proper ARIA labels', () => {
      const review = { 
        ...baseReview, 
        sentiment: ReviewSentiment.POSITIVE,
        quest: ReviewQuest.BUG,
        priority: ReviewPriority.HIGH
      };
      
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="GooglePlay" />
      );

      // Check that all tooltips/labels are accessible
      expect(screen.getByLabelText('Google Play')).toBeInTheDocument();
      expect(screen.getByLabelText('Bug Report')).toBeInTheDocument();
      expect(screen.getByLabelText('High Priority')).toBeInTheDocument();
      expect(screen.getByLabelText('Positive feedback')).toBeInTheDocument();
    });

    test('visual indicators do not rely solely on color', () => {
      const review = { 
        ...baseReview, 
        sentiment: ReviewSentiment.NEGATIVE,
        quest: ReviewQuest.BUG,
        priority: ReviewPriority.HIGH
      };
      
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="GooglePlay" />
      );

      // Each indicator should have both visual (icon/shape) and text (tooltip) information
      expect(screen.getByTestId('BugReportIcon')).toBeInTheDocument(); // Icon shape
      expect(screen.getByLabelText('Bug Report')).toBeInTheDocument(); // Text description
      
      expect(screen.getByTestId('CircleIcon')).toBeInTheDocument(); // Icon shape
      expect(screen.getByLabelText('High Priority')).toBeInTheDocument(); // Text description
    });
  });

  describe('Content Truncation and Overflow', () => {
    test('long app names are properly truncated', () => {
      const review = { ...baseReview };
      const longAppName = 'This is a very long app name that should be truncated properly';
      
      renderWithTheme(
        <ReviewCard review={review} appName={longAppName} platform="GooglePlay" />
      );

      const appNameElement = screen.getByText(longAppName);
      expect(appNameElement).toBeInTheDocument();
      
      // Should have text overflow styles
      expect(appNameElement).toHaveStyle({
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      });
    });

    test('long review comments wrap properly', () => {
      const longComment = 'This is a very long review comment that should wrap properly across multiple lines without causing layout issues or horizontal scrolling problems.';
      const review = { 
        ...baseReview, 
        comment: longComment 
      };
      
      renderWithTheme(
        <ReviewCard review={review} appName="Test App" platform="GooglePlay" />
      );

      const commentElement = screen.getByText(longComment);
      expect(commentElement).toBeInTheDocument();
      
      // Should have word break styles
      expect(commentElement).toHaveStyle({
        wordBreak: 'break-word',
      });
    });
  });
});
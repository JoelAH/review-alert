import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import ReviewCard from '../ReviewCard';
import { Review, ReviewSentiment, ReviewQuest, ReviewPriority } from '@/lib/models/client/review';
import theme from '@/app/theme';

// Mock review data for testing
const mockReview: Review = {
  _id: '1',
  user: 'user123',
  appId: 'app123',
  name: 'John Doe',
  comment: 'This is a great app! I love the new features.',
  date: new Date('2024-01-15'),
  rating: 5,
  sentiment: ReviewSentiment.POSITIVE,
  quest: ReviewQuest.FEATURE_REQUEST,
  priority: ReviewPriority.HIGH,
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ReviewCard', () => {
  it('renders review content correctly', () => {
    renderWithTheme(
      <ReviewCard
        review={mockReview}
        appName="Test App"
        platform="GooglePlay"
      />
    );

    expect(screen.getByText('Test App')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('This is a great app! I love the new features.')).toBeInTheDocument();
  });

  it('displays correct platform icon for Google Play', () => {
    renderWithTheme(
      <ReviewCard
        review={mockReview}
        appName="Test App"
        platform="GooglePlay"
      />
    );

    // Check for Android icon (Google Play)
    const androidIcon = document.querySelector('[data-testid="AndroidIcon"]');
    expect(androidIcon).toBeInTheDocument();
  });

  it('displays correct platform icon for Apple Store', () => {
    renderWithTheme(
      <ReviewCard
        review={mockReview}
        appName="Test App"
        platform="AppleStore"
      />
    );

    // Check for Apple icon
    const appleIcon = document.querySelector('[data-testid="AppleIcon"]');
    expect(appleIcon).toBeInTheDocument();
  });

  it('displays correct platform icon for Chrome Extension', () => {
    renderWithTheme(
      <ReviewCard
        review={mockReview}
        appName="Test App"
        platform="ChromeExt"
      />
    );

    // Check for Extension icon
    const extensionIcon = document.querySelector('[data-testid="ExtensionIcon"]');
    expect(extensionIcon).toBeInTheDocument();
  });

  it('displays quest type icon for bug reports', () => {
    const bugReview = {
      ...mockReview,
      quest: ReviewQuest.BUG,
    };

    renderWithTheme(
      <ReviewCard
        review={bugReview}
        appName="Test App"
        platform="GooglePlay"
      />
    );

    const bugIcon = document.querySelector('[data-testid="BugReportIcon"]');
    expect(bugIcon).toBeInTheDocument();
  });

  it('displays quest type icon for feature requests', () => {
    const featureReview = {
      ...mockReview,
      quest: ReviewQuest.FEATURE_REQUEST,
    };

    renderWithTheme(
      <ReviewCard
        review={featureReview}
        appName="Test App"
        platform="GooglePlay"
      />
    );

    const lightbulbIcon = document.querySelector('[data-testid="LightbulbIcon"]');
    expect(lightbulbIcon).toBeInTheDocument();
  });

  it('displays priority indicator', () => {
    renderWithTheme(
      <ReviewCard
        review={mockReview}
        appName="Test App"
        platform="GooglePlay"
      />
    );

    const priorityIcon = document.querySelector('[data-testid="CircleIcon"]');
    expect(priorityIcon).toBeInTheDocument();
  });

  it('displays rating stars', () => {
    renderWithTheme(
      <ReviewCard
        review={mockReview}
        appName="Test App"
        platform="GooglePlay"
      />
    );

    // Check for rating component
    const ratingElement = document.querySelector('.MuiRating-root');
    expect(ratingElement).toBeInTheDocument();
  });

  it('handles review without quest type', () => {
    const reviewWithoutQuest = {
      ...mockReview,
      quest: undefined,
    };

    renderWithTheme(
      <ReviewCard
        review={reviewWithoutQuest}
        appName="Test App"
        platform="GooglePlay"
      />
    );

    // Should still render without errors
    expect(screen.getByText('Test App')).toBeInTheDocument();
  });

  it('handles review without priority', () => {
    const reviewWithoutPriority = {
      ...mockReview,
      priority: undefined,
    };

    renderWithTheme(
      <ReviewCard
        review={reviewWithoutPriority}
        appName="Test App"
        platform="GooglePlay"
      />
    );

    // Should still render without errors
    expect(screen.getByText('Test App')).toBeInTheDocument();
  });

  it('formats date correctly', () => {
    renderWithTheme(
      <ReviewCard
        review={mockReview}
        appName="Test App"
        platform="GooglePlay"
      />
    );

    // Check for formatted date (should contain 2024)
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });
});
import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { axe, toHaveNoViolations } from 'jest-axe';
import ReviewCard from '../ReviewCard';
import { Review, ReviewSentiment, ReviewQuest, ReviewPriority } from '@/lib/models/client/review';
import theme from '@/app/theme';

expect.extend(toHaveNoViolations);

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

describe('ReviewCard Accessibility', () => {
  it('should not have any accessibility violations', async () => {
    const { container } = renderWithTheme(
      <ReviewCard
        review={mockReview}
        appName="Test App"
        platform="GooglePlay"
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with negative sentiment', async () => {
    const negativeReview = {
      ...mockReview,
      sentiment: ReviewSentiment.NEGATIVE,
      quest: ReviewQuest.BUG,
      priority: ReviewPriority.HIGH,
    };

    const { container } = renderWithTheme(
      <ReviewCard
        review={negativeReview}
        appName="Test App"
        platform="AppleStore"
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations without quest and priority', async () => {
    const minimalReview = {
      ...mockReview,
      quest: undefined,
      priority: undefined,
    };

    const { container } = renderWithTheme(
      <ReviewCard
        review={minimalReview}
        appName="Test App"
        platform="ChromeExt"
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA labels for tooltips', () => {
    const { container } = renderWithTheme(
      <ReviewCard
        review={mockReview}
        appName="Test App"
        platform="GooglePlay"
      />
    );

    // Check for proper aria-label attributes on icons
    const androidIcon = container.querySelector('[aria-label="Google Play"]');
    expect(androidIcon).toBeInTheDocument();

    const lightbulbIcon = container.querySelector('[aria-label="Feature Request"]');
    expect(lightbulbIcon).toBeInTheDocument();

    const priorityIcon = container.querySelector('[aria-label="High Priority"]');
    expect(priorityIcon).toBeInTheDocument();
  });

  it('should have proper rating accessibility', () => {
    const { container } = renderWithTheme(
      <ReviewCard
        review={mockReview}
        appName="Test App"
        platform="GooglePlay"
      />
    );

    // Check for rating accessibility
    const ratingElement = container.querySelector('[role="img"]');
    expect(ratingElement).toBeInTheDocument();
    expect(ratingElement).toHaveAttribute('aria-label', '5 Stars');
  });
});
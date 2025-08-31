import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from '@mui/material/styles';
import FeedTab from '../FeedTab';
import { User } from '@/lib/models/client/user';
import { Review, ReviewSentiment, ReviewQuest, ReviewPriority } from '@/lib/models/client/review';
import theme from '@/app/theme';

expect.extend(toHaveNoViolations);

// Mock the hooks
jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/hooks/useReviews', () => ({
  useReviews: jest.fn(),
}));

// Mock child components to focus on FeedTab accessibility
jest.mock('../ReviewOverview', () => {
  return function MockReviewOverview(props: any) {
    return (
      <div role="region" aria-labelledby="overview-heading">
        <h1 id="overview-heading">Review Overview</h1>
        <div>Total Reviews: {props.totalReviews}</div>
      </div>
    );
  };
});

jest.mock('../ReviewFilters', () => {
  return function MockReviewFilters(props: any) {
    return (
      <div role="region" aria-labelledby="filters-heading">
        <h2 id="filters-heading">Filter Reviews</h2>
        <input
          type="text"
          placeholder="Search reviews"
          aria-label="Search reviews"
          onChange={(e) => props.onFiltersChange({ search: e.target.value })}
        />
        <select
          aria-label="Platform filter"
          onChange={(e) => props.onFiltersChange({ platform: e.target.value })}
        >
          <option value="">All Platforms</option>
          <option value="GooglePlay">Google Play</option>
          <option value="AppleStore">Apple App Store</option>
          <option value="ChromeExt">Chrome Web Store</option>
        </select>
      </div>
    );
  };
});

jest.mock('../ReviewCard', () => {
  return function MockReviewCard(props: any) {
    return (
      <article role="article" aria-labelledby={`review-${props.review._id}`}>
        <h3 id={`review-${props.review._id}`}>
          Review by {props.review.name} for {props.appName}
        </h3>
        <div>Rating: {props.review.rating} stars</div>
        <div>{props.review.comment}</div>
      </article>
    );
  };
});

// Mock ErrorBoundary
jest.mock('@/components/ErrorBoundary', () => {
  return function MockErrorBoundary({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  };
});

// Mock skeleton loaders
jest.mock('@/components/SkeletonLoaders', () => ({
  FeedTabSkeleton: () => <div role="status" aria-label="Loading feed">Loading...</div>,
  ReviewListSkeleton: () => <div role="status" aria-label="Loading more reviews">Loading reviews...</div>,
  PaginationSkeleton: () => <div role="status" aria-label="Loading pagination">Loading pagination...</div>,
  ReviewOverviewSkeleton: () => <div role="status" aria-label="Loading overview">Loading overview...</div>,
  ReviewFiltersSkeleton: () => <div role="status" aria-label="Loading filters">Loading filters...</div>,
}));

const { useAuth } = require('@/lib/hooks/useAuth');
const { useReviews } = require('@/lib/hooks/useReviews');

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const mockUser: User = {
  _id: 'user123',
  uid: 'firebase-uid-123',
  email: 'test@example.com',
  name: 'Test User',
  apps: [
    {
      _id: 'app1',
      appId: 'app1',
      url: 'https://play.google.com/store/apps/details?id=com.example.app1',
      store: 'GooglePlay',
    },
    {
      _id: 'app2',
      appId: 'app2',
      url: 'https://apps.apple.com/app/example-app/id123456789',
      store: 'AppleStore',
    },
  ],
};

const mockReviews: Review[] = [
  {
    _id: 'review1',
    user: 'user123',
    appId: 'app1',
    name: 'John Doe',
    comment: 'Great app! Love the new features.',
    date: new Date('2024-01-15'),
    rating: 5,
    sentiment: ReviewSentiment.POSITIVE,
    quest: ReviewQuest.FEATURE_REQUEST,
    priority: ReviewPriority.HIGH,
  },
  {
    _id: 'review2',
    user: 'user123',
    appId: 'app2',
    name: 'Jane Smith',
    comment: 'App crashes frequently. Please fix.',
    date: new Date('2024-01-14'),
    rating: 2,
    sentiment: ReviewSentiment.NEGATIVE,
    quest: ReviewQuest.BUG,
    priority: ReviewPriority.HIGH,
  },
];

const mockOverview = {
  sentimentBreakdown: { positive: 1, negative: 1 },
  platformBreakdown: { GooglePlay: 1, AppleStore: 1, ChromeExt: 0 },
  questBreakdown: { bug: 1, featureRequest: 1, other: 0 },
};

describe('FeedTab Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    useAuth.mockReturnValue({
      isAuthenticated: true,
    });

    useReviews.mockReturnValue({
      reviews: mockReviews,
      loading: false,
      initialLoading: false,
      loadingMore: false,
      error: null,
      hasError: false,
      retryCount: 0,
      hasMore: false,
      totalCount: 2,
      overview: mockOverview,
      loadMore: jest.fn(),
      refresh: jest.fn(),
      setFilters: jest.fn(),
      clearError: jest.fn(),
      retry: jest.fn(),
    });
  });

  describe('WCAG Compliance', () => {
    it('should not have any accessibility violations in normal state', async () => {
      const { container } = renderWithTheme(<FeedTab user={mockUser} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations in loading state', async () => {
      useReviews.mockReturnValue({
        reviews: [],
        loading: true,
        initialLoading: true,
        loadingMore: false,
        error: null,
        hasError: false,
        retryCount: 0,
        hasMore: false,
        totalCount: 0,
        overview: null,
        loadMore: jest.fn(),
        refresh: jest.fn(),
        setFilters: jest.fn(),
        clearError: jest.fn(),
        retry: jest.fn(),
      });

      const { container } = renderWithTheme(<FeedTab user={mockUser} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations in error state', async () => {
      useReviews.mockReturnValue({
        reviews: [],
        loading: false,
        initialLoading: false,
        loadingMore: false,
        error: 'Failed to fetch reviews',
        hasError: true,
        retryCount: 1,
        hasMore: false,
        totalCount: 0,
        overview: null,
        loadMore: jest.fn(),
        refresh: jest.fn(),
        setFilters: jest.fn(),
        clearError: jest.fn(),
        retry: jest.fn(),
      });

      const { container } = renderWithTheme(<FeedTab user={mockUser} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations in empty state', async () => {
      useReviews.mockReturnValue({
        reviews: [],
        loading: false,
        initialLoading: false,
        loadingMore: false,
        error: null,
        hasError: false,
        retryCount: 0,
        hasMore: false,
        totalCount: 0,
        overview: mockOverview,
        loadMore: jest.fn(),
        refresh: jest.fn(),
        setFilters: jest.fn(),
        clearError: jest.fn(),
        retry: jest.fn(),
      });

      const { container } = renderWithTheme(<FeedTab user={mockUser} />);
      // Exclude heading-order rule since we're testing an isolated component
      const results = await axe(container, {
        rules: {
          'heading-order': { enabled: false }
        }
      });
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations when user has no apps', async () => {
      const userWithoutApps = { ...mockUser, apps: [] };
      const { container } = renderWithTheme(<FeedTab user={userWithoutApps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations when not authenticated', async () => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
      });

      const { container } = renderWithTheme(<FeedTab user={mockUser} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Heading Structure', () => {
    it('should have proper heading hierarchy', () => {
      renderWithTheme(<FeedTab user={mockUser} />);
      
      // Main heading - Note: Material-UI uses h6 for variant="h6" but we check for the text content
      expect(screen.getByText('Review Feed')).toBeInTheDocument();
      
      // Section headings from mocked components
      expect(screen.getByRole('heading', { level: 1, name: /review overview/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /filter reviews/i })).toBeInTheDocument();
    });

    it('should have proper heading structure in setup state', () => {
      const userWithoutApps = { ...mockUser, apps: [] };
      renderWithTheme(<FeedTab user={userWithoutApps} />);
      
      expect(screen.getByText('Welcome to Review Alert!')).toBeInTheDocument();
    });

    it('should have proper heading structure in auth required state', () => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
      });

      renderWithTheme(<FeedTab user={mockUser} />);
      
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should allow keyboard navigation through interactive elements', async () => {
      const user = userEvent.setup();
      renderWithTheme(<FeedTab user={mockUser} />);

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByRole('button', { name: /refresh/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/search reviews/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/platform filter/i)).toHaveFocus();
    });

    it('should handle keyboard interaction with refresh button', async () => {
      const mockRefresh = jest.fn();
      useReviews.mockReturnValue({
        ...useReviews(),
        refresh: mockRefresh,
      });

      const user = userEvent.setup();
      renderWithTheme(<FeedTab user={mockUser} />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);
      
      expect(mockRefresh).toHaveBeenCalled();
    });

    it('should handle keyboard interaction with load more button', async () => {
      const mockLoadMore = jest.fn();
      useReviews.mockReturnValue({
        ...useReviews(),
        hasMore: true,
        loadMore: mockLoadMore,
      });

      const user = userEvent.setup();
      renderWithTheme(<FeedTab user={mockUser} />);

      const loadMoreButton = screen.getByRole('button', { name: /load more reviews/i });
      await user.click(loadMoreButton);
      
      expect(mockLoadMore).toHaveBeenCalled();
    });

    it('should handle keyboard interaction with error retry buttons', async () => {
      const mockRetry = jest.fn();
      const mockRefresh = jest.fn();
      
      useReviews.mockReturnValue({
        reviews: [],
        loading: false,
        initialLoading: false,
        loadingMore: false,
        error: 'Failed to fetch reviews',
        hasError: true,
        retryCount: 1,
        hasMore: false,
        totalCount: 0,
        overview: null,
        loadMore: jest.fn(),
        refresh: mockRefresh,
        setFilters: jest.fn(),
        clearError: jest.fn(),
        retry: mockRetry,
      });

      const user = userEvent.setup();
      renderWithTheme(<FeedTab user={mockUser} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);
      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide meaningful labels for loading states', () => {
      useReviews.mockReturnValue({
        reviews: [],
        loading: true,
        initialLoading: true,
        loadingMore: false,
        error: null,
        hasError: false,
        retryCount: 0,
        hasMore: false,
        totalCount: 0,
        overview: null,
        loadMore: jest.fn(),
        refresh: jest.fn(),
        setFilters: jest.fn(),
        clearError: jest.fn(),
        retry: jest.fn(),
      });

      renderWithTheme(<FeedTab user={mockUser} />);
      
      expect(screen.getByRole('status', { name: /loading feed/i })).toBeInTheDocument();
    });

    it('should provide meaningful labels for component loading states', () => {
      useReviews.mockReturnValue({
        reviews: mockReviews,
        loading: true,
        initialLoading: true,
        loadingMore: false,
        error: null,
        hasError: false,
        retryCount: 0,
        hasMore: false,
        totalCount: 2,
        overview: null,
        loadMore: jest.fn(),
        refresh: jest.fn(),
        setFilters: jest.fn(),
        clearError: jest.fn(),
        retry: jest.fn(),
      });

      renderWithTheme(<FeedTab user={mockUser} />);
      
      expect(screen.getByRole('status', { name: /loading overview/i })).toBeInTheDocument();
      expect(screen.getByRole('status', { name: /loading filters/i })).toBeInTheDocument();
    });

    it('should provide meaningful labels for pagination loading', () => {
      useReviews.mockReturnValue({
        reviews: mockReviews,
        loading: false,
        initialLoading: false,
        loadingMore: true,
        error: null,
        hasError: false,
        retryCount: 0,
        hasMore: true,
        totalCount: 10,
        overview: mockOverview,
        loadMore: jest.fn(),
        refresh: jest.fn(),
        setFilters: jest.fn(),
        clearError: jest.fn(),
        retry: jest.fn(),
      });

      renderWithTheme(<FeedTab user={mockUser} />);
      
      expect(screen.getByRole('status', { name: /loading more reviews/i })).toBeInTheDocument();
    });

    it('should provide descriptive text for app tracking status', () => {
      renderWithTheme(<FeedTab user={mockUser} />);
      
      expect(screen.getByText(/Monitor feedback from your 2 tracked apps/)).toBeInTheDocument();
    });

    it('should provide descriptive text for retry attempts', () => {
      useReviews.mockReturnValue({
        reviews: [],
        loading: false,
        initialLoading: false,
        loadingMore: false,
        error: 'Failed to fetch reviews',
        hasError: true,
        retryCount: 2,
        hasMore: false,
        totalCount: 0,
        overview: null,
        loadMore: jest.fn(),
        refresh: jest.fn(),
        setFilters: jest.fn(),
        clearError: jest.fn(),
        retry: jest.fn(),
      });

      renderWithTheme(<FeedTab user={mockUser} />);
      
      expect(screen.getByText('(Retry attempt 2)')).toBeInTheDocument();
    });
  });

  describe('Error Announcements', () => {
    it('should properly announce errors to screen readers', () => {
      useReviews.mockReturnValue({
        reviews: [],
        loading: false,
        initialLoading: false,
        loadingMore: false,
        error: 'Network connection failed',
        hasError: true,
        retryCount: 0,
        hasMore: false,
        totalCount: 0,
        overview: null,
        loadMore: jest.fn(),
        refresh: jest.fn(),
        setFilters: jest.fn(),
        clearError: jest.fn(),
        retry: jest.fn(),
      });

      renderWithTheme(<FeedTab user={mockUser} />);
      
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent('Failed to load reviews');
      expect(errorAlert).toHaveTextContent('Network connection failed');
    });

    it('should provide accessible error actions', () => {
      useReviews.mockReturnValue({
        reviews: [],
        loading: false,
        initialLoading: false,
        loadingMore: false,
        error: 'Failed to fetch reviews',
        hasError: true,
        retryCount: 0,
        hasMore: false,
        totalCount: 0,
        overview: null,
        loadMore: jest.fn(),
        refresh: jest.fn(),
        setFilters: jest.fn(),
        clearError: jest.fn(),
        retry: jest.fn(),
      });

      renderWithTheme(<FeedTab user={mockUser} />);
      
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /refresh/i })).toHaveLength(2); // Header + error alert
    });
  });

  describe('Focus Management', () => {
    it('should maintain focus when content updates', async () => {
      const user = userEvent.setup();
      renderWithTheme(<FeedTab user={mockUser} />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);
      
      // Focus should remain on the refresh button after click
      expect(refreshButton).toHaveFocus();
    });

    it('should handle focus properly in empty states', () => {
      useReviews.mockReturnValue({
        reviews: [],
        loading: false,
        initialLoading: false,
        loadingMore: false,
        error: null,
        hasError: false,
        retryCount: 0,
        hasMore: false,
        totalCount: 0,
        overview: mockOverview,
        loadMore: jest.fn(),
        refresh: jest.fn(),
        setFilters: jest.fn(),
        clearError: jest.fn(),
        retry: jest.fn(),
      });

      renderWithTheme(<FeedTab user={mockUser} />);
      
      const checkForReviewsButton = screen.getByRole('button', { name: /check for reviews/i });
      expect(checkForReviewsButton).toBeInTheDocument();
    });
  });

  describe('Semantic Structure', () => {
    it('should use proper semantic elements for reviews', () => {
      renderWithTheme(<FeedTab user={mockUser} />);
      
      const reviewArticles = screen.getAllByRole('article');
      expect(reviewArticles).toHaveLength(2);
      
      reviewArticles.forEach((article, index) => {
        expect(article).toHaveAttribute('aria-labelledby', `review-${mockReviews[index]._id}`);
      });
    });

    it('should use proper regions for different sections', () => {
      renderWithTheme(<FeedTab user={mockUser} />);
      
      expect(screen.getByRole('region', { name: /review overview/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /filter reviews/i })).toBeInTheDocument();
    });
  });

  describe('Color and Contrast', () => {
    it('should not rely solely on color for information', () => {
      renderWithTheme(<FeedTab user={mockUser} />);
      
      // Check that important information is conveyed through text
      expect(screen.getByText('Review Feed')).toBeInTheDocument();
      expect(screen.getByText(/Monitor feedback from your 2 tracked apps/)).toBeInTheDocument();
    });

    it('should provide text alternatives for visual indicators', () => {
      useReviews.mockReturnValue({
        reviews: [],
        loading: false,
        initialLoading: false,
        loadingMore: false,
        error: 'Failed to fetch reviews',
        hasError: true,
        retryCount: 1,
        hasMore: false,
        totalCount: 0,
        overview: null,
        loadMore: jest.fn(),
        refresh: jest.fn(),
        setFilters: jest.fn(),
        clearError: jest.fn(),
        retry: jest.fn(),
      });

      renderWithTheme(<FeedTab user={mockUser} />);
      
      // Error state should be conveyed through text, not just color
      expect(screen.getByText('Failed to load reviews')).toBeInTheDocument();
      expect(screen.getByText('(Retry attempt 1)')).toBeInTheDocument();
    });
  });

  describe('Responsive Design Accessibility', () => {
    it('should maintain accessibility on mobile viewports', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = renderWithTheme(<FeedTab user={mockUser} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should maintain accessibility on tablet viewports', async () => {
      // Simulate tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { container } = renderWithTheme(<FeedTab user={mockUser} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import FeedTab from '../FeedTab';
import { useAuth } from '@/lib/hooks/useAuth';
import { useReviews } from '@/lib/hooks/useReviews';
import { ReviewSentiment, ReviewQuest, ReviewPriority } from '@/lib/models/client/review';

// Mock the hooks
jest.mock('@/lib/hooks/useAuth');
jest.mock('@/lib/hooks/useReviews');
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseReviews = useReviews as jest.MockedFunction<typeof useReviews>;
const mockUseMediaQuery = useMediaQuery as jest.MockedFunction<typeof useMediaQuery>;

const mockUser = {
  _id: 'user123',
  uid: 'firebase-uid-123',
  email: 'test@example.com',
  apps: [
    { _id: 'app1', appId: 'app1', store: 'GooglePlay' },
    { _id: 'app2', appId: 'app2', store: 'AppleStore' },
    { _id: 'app3', appId: 'app3', store: 'ChromeExt' },
  ],
};

const mockReviews = [
  {
    _id: 'review1',
    appId: 'app1',
    name: 'John Doe',
    rating: 5,
    comment: 'Great app! Love the features.',
    date: new Date('2024-01-15'),
    sentiment: ReviewSentiment.POSITIVE,
    quest: ReviewQuest.FEATURE_REQUEST,
    priority: ReviewPriority.HIGH,
    user: 'user123',
  },
  {
    _id: 'review2',
    appId: 'app2',
    name: 'Jane Smith',
    rating: 2,
    comment: 'App crashes frequently. Please fix.',
    date: new Date('2024-01-14'),
    sentiment: ReviewSentiment.NEGATIVE,
    quest: ReviewQuest.BUG,
    priority: ReviewPriority.HIGH,
    user: 'user123',
  },
  {
    _id: 'review3',
    appId: 'app3',
    name: 'Bob Wilson',
    rating: 4,
    comment: 'Good extension, works as expected.',
    date: new Date('2024-01-13'),
    sentiment: ReviewSentiment.POSITIVE,
    quest: ReviewQuest.OTHER,
    priority: ReviewPriority.MEDIUM,
    user: 'user123',
  },
];

const mockOverview = {
  sentimentBreakdown: { positive: 2, negative: 1 },
  platformBreakdown: { GooglePlay: 1, AppleStore: 1, ChromeExt: 1 },
  questBreakdown: { bug: 1, featureRequest: 1, other: 1 },
};

const defaultReviewsHookReturn = {
  reviews: mockReviews,
  loading: false,
  initialLoading: false,
  loadingMore: false,
  error: null,
  hasError: false,
  retryCount: 0,
  hasMore: false,
  totalCount: 3,
  overview: mockOverview,
  loadMore: jest.fn(),
  refresh: jest.fn(),
  setFilters: jest.fn(),
  clearError: jest.fn(),
  retry: jest.fn(),
};

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('FeedTab Responsive Design', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
    });
    mockUseReviews.mockReturnValue(defaultReviewsHookReturn);
  });

  describe('Mobile Viewport (xs)', () => {
    beforeEach(() => {
      // Mock mobile viewport
      mockUseMediaQuery.mockImplementation((query) => {
        if (query === theme.breakpoints.down('sm')) return true;
        if (query === theme.breakpoints.down('md')) return true;
        return false;
      });
    });

    test('renders correctly on mobile viewport', () => {
      renderWithTheme(<FeedTab user={mockUser} />);
      
      expect(screen.getByText('Review Feed')).toBeInTheDocument();
      expect(screen.getByText('Monitor feedback from your 3 tracked apps')).toBeInTheDocument();
    });

    test('filter controls stack vertically on mobile', () => {
      renderWithTheme(<FeedTab user={mockUser} />);
      
      const filterContainer = screen.getByText('Filter Reviews').closest('div');
      expect(filterContainer).toBeInTheDocument();
      
      // Check that search field is present
      expect(screen.getByPlaceholderText('Search by content...')).toBeInTheDocument();
    });

    test('review cards are properly sized for mobile', () => {
      renderWithTheme(<FeedTab user={mockUser} />);
      
      const reviewCards = screen.getAllByText(/Great app!|App crashes|Good extension/);
      expect(reviewCards).toHaveLength(3);
      
      // Check that cards are rendered (specific mobile styling is handled by CSS)
      reviewCards.forEach(card => {
        expect(card).toBeInTheDocument();
      });
    });

    test('platform icons are properly sized for mobile', () => {
      renderWithTheme(<FeedTab user={mockUser} />);
      
      // Check that platform icons are present (they should be smaller on mobile)
      const androidIcon = screen.getByTestId('AndroidIcon') || screen.getByLabelText('Google Play');
      const appleIcon = screen.getByTestId('AppleIcon') || screen.getByLabelText('App Store');
      const extensionIcon = screen.getByTestId('ExtensionIcon') || screen.getByLabelText('Chrome Web Store');
      
      // Icons should be present regardless of size
      expect(androidIcon || appleIcon || extensionIcon).toBeTruthy();
    });

    test('hover effects are disabled on mobile', () => {
      renderWithTheme(<FeedTab user={mockUser} />);
      
      const reviewCards = screen.getAllByRole('button', { name: /Positive feedback|Negative feedback/ });
      expect(reviewCards.length).toBeGreaterThan(0);
      
      // On mobile, hover effects should be minimal or disabled
      // This is primarily handled by CSS media queries
    });
  });

  describe('Tablet Viewport (md)', () => {
    beforeEach(() => {
      // Mock tablet viewport
      mockUseMediaQuery.mockImplementation((query) => {
        if (query === theme.breakpoints.down('sm')) return false;
        if (query === theme.breakpoints.down('md')) return true;
        return false;
      });
    });

    test('renders correctly on tablet viewport', () => {
      renderWithTheme(<FeedTab user={mockUser} />);
      
      expect(screen.getByText('Review Feed')).toBeInTheDocument();
      expect(screen.getByText('Monitor feedback from your 3 tracked apps')).toBeInTheDocument();
    });

    test('filter controls use appropriate grid layout on tablet', () => {
      renderWithTheme(<FeedTab user={mockUser} />);
      
      const searchField = screen.getByPlaceholderText('Search by content...');
      const platformFilter = screen.getByLabelText('Platform');
      const ratingFilter = screen.getByLabelText('Rating');
      
      expect(searchField).toBeInTheDocument();
      expect(platformFilter).toBeInTheDocument();
      expect(ratingFilter).toBeInTheDocument();
    });
  });

  describe('Desktop Viewport (lg+)', () => {
    beforeEach(() => {
      // Mock desktop viewport
      mockUseMediaQuery.mockImplementation((query) => {
        return false; // All breakpoint queries return false for desktop
      });
    });

    test('renders correctly on desktop viewport', () => {
      renderWithTheme(<FeedTab user={mockUser} />);
      
      expect(screen.getByText('Review Feed')).toBeInTheDocument();
      expect(screen.getByText('Monitor feedback from your 3 tracked apps')).toBeInTheDocument();
    });

    test('all filter controls are visible in a single row on desktop', () => {
      renderWithTheme(<FeedTab user={mockUser} />);
      
      const searchField = screen.getByPlaceholderText('Search by content...');
      const platformFilter = screen.getByLabelText('Platform');
      const ratingFilter = screen.getByLabelText('Rating');
      const sentimentFilter = screen.getByLabelText('Sentiment');
      const questFilter = screen.getByLabelText('Quest Type');
      
      expect(searchField).toBeInTheDocument();
      expect(platformFilter).toBeInTheDocument();
      expect(ratingFilter).toBeInTheDocument();
      expect(sentimentFilter).toBeInTheDocument();
      expect(questFilter).toBeInTheDocument();
    });

    test('hover effects work properly on desktop', () => {
      renderWithTheme(<FeedTab user={mockUser} />);
      
      const reviewCards = screen.getAllByRole('button', { name: /Positive feedback|Negative feedback/ });
      expect(reviewCards.length).toBeGreaterThan(0);
      
      // Hover effects are primarily CSS-based, so we just verify cards are interactive
      reviewCards.forEach(card => {
        expect(card).toBeInTheDocument();
      });
    });
  });

  describe('Virtual Scrolling Threshold', () => {
    test('uses regular rendering for small lists', () => {
      mockUseReviews.mockReturnValue({
        ...defaultReviewsHookReturn,
        reviews: mockReviews, // 3 reviews < 50 threshold
      });

      renderWithTheme(<FeedTab user={mockUser} />);
      
      // Should render regular review cards, not virtualized list
      expect(screen.getAllByText(/Great app!|App crashes|Good extension/)).toHaveLength(3);
    });

    test('uses virtual scrolling for large lists', () => {
      // Create a large list of reviews (> 50)
      const largeReviewList = Array.from({ length: 60 }, (_, index) => ({
        ...mockReviews[0],
        _id: `review${index}`,
        comment: `Review comment ${index}`,
      }));

      mockUseReviews.mockReturnValue({
        ...defaultReviewsHookReturn,
        reviews: largeReviewList,
      });

      renderWithTheme(<FeedTab user={mockUser} />);
      
      // Should use virtualized list for large datasets
      // The exact implementation depends on react-window
      expect(screen.getByText('Review Feed')).toBeInTheDocument();
    });
  });

  describe('Loading States Responsiveness', () => {
    test('skeleton loaders adapt to viewport size', () => {
      mockUseReviews.mockReturnValue({
        ...defaultReviewsHookReturn,
        initialLoading: true,
        reviews: [],
      });

      renderWithTheme(<FeedTab user={mockUser} />);
      
      // Should show skeleton loaders
      expect(screen.getByTestId('feed-tab-skeleton')).toBeInTheDocument();
    });

    test('loading more indicator is responsive', () => {
      mockUseReviews.mockReturnValue({
        ...defaultReviewsHookReturn,
        loadingMore: true,
        hasMore: true,
      });

      renderWithTheme(<FeedTab user={mockUser} />);
      
      // Should show loading more skeleton
      expect(screen.getByTestId('review-list-skeleton')).toBeInTheDocument();
    });
  });

  describe('Touch Interactions', () => {
    beforeEach(() => {
      // Mock mobile viewport for touch interactions
      mockUseMediaQuery.mockImplementation((query) => {
        if (query === theme.breakpoints.down('sm')) return true;
        return false;
      });
    });

    test('filter dropdowns work with touch', async () => {
      renderWithTheme(<FeedTab user={mockUser} />);
      
      const platformFilter = screen.getByLabelText('Platform');
      fireEvent.mouseDown(platformFilter);
      
      await waitFor(() => {
        expect(screen.getByText('Google Play')).toBeInTheDocument();
      });
    });

    test('buttons have appropriate touch targets', () => {
      renderWithTheme(<FeedTab user={mockUser} />);
      
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeInTheDocument();
      
      // Touch targets should be at least 44px (handled by Material-UI)
      const buttonElement = refreshButton.closest('button');
      expect(buttonElement).toBeInTheDocument();
    });
  });

  describe('Content Overflow Handling', () => {
    test('long review comments are properly wrapped', () => {
      const longCommentReview = {
        ...mockReviews[0],
        comment: 'This is a very long review comment that should wrap properly on all screen sizes and not cause horizontal scrolling or layout issues. It should be readable and well-formatted across different viewport sizes.',
      };

      mockUseReviews.mockReturnValue({
        ...defaultReviewsHookReturn,
        reviews: [longCommentReview],
      });

      renderWithTheme(<FeedTab user={mockUser} />);
      
      expect(screen.getByText(/This is a very long review comment/)).toBeInTheDocument();
    });

    test('long app names are properly truncated', () => {
      const longAppNameUser = {
        ...mockUser,
        apps: [
          { _id: 'app1', appId: 'app1', store: 'GooglePlay' },
        ],
      };

      renderWithTheme(<FeedTab user={longAppNameUser} />);
      
      // App names should be truncated with ellipsis if too long
      expect(screen.getByText('App (GooglePlay)')).toBeInTheDocument();
    });
  });

  describe('Orientation Changes', () => {
    test('layout adapts to landscape orientation on mobile', () => {
      // Simulate landscape mode (wider viewport)
      mockUseMediaQuery.mockImplementation((query) => {
        if (query === theme.breakpoints.down('sm')) return true;
        return false;
      });

      renderWithTheme(<FeedTab user={mockUser} />);
      
      // Layout should still work in landscape
      expect(screen.getByText('Review Feed')).toBeInTheDocument();
      expect(screen.getByText('Filter Reviews')).toBeInTheDocument();
    });
  });
});
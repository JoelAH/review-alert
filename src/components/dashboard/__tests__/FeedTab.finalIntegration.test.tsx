import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import FeedTab from '../FeedTab';
import { useAuth } from '@/lib/hooks/useAuth';
import { useReviews } from '@/lib/hooks/useReviews';
import { ReviewSentiment, ReviewQuest, ReviewPriority } from '@/lib/models/client/review';

// Mock the hooks
jest.mock('@/lib/hooks/useAuth');
jest.mock('@/lib/hooks/useReviews');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseReviews = useReviews as jest.MockedFunction<typeof useReviews>;

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

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('FeedTab Final Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
    });
  });

  describe('Complete Functionality', () => {
    test('renders all components with data successfully', () => {
      mockUseReviews.mockReturnValue({
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
      });

      renderWithTheme(<FeedTab user={mockUser} />);

      // Verify main components are rendered
      expect(screen.getByText('Review Feed')).toBeInTheDocument();
      expect(screen.getByText('Monitor feedback from your 3 tracked apps')).toBeInTheDocument();
      expect(screen.getByText('Review Overview')).toBeInTheDocument();
      expect(screen.getByText('Filter Reviews')).toBeInTheDocument();
      
      // Verify reviews are displayed
      expect(screen.getByText('Great app! Love the features.')).toBeInTheDocument();
      expect(screen.getByText('App crashes frequently. Please fix.')).toBeInTheDocument();
      expect(screen.getByText('Good extension, works as expected.')).toBeInTheDocument();
    });

    test('displays visual indicators correctly', () => {
      mockUseReviews.mockReturnValue({
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
      });

      renderWithTheme(<FeedTab user={mockUser} />);

      // Check for platform icons
      expect(screen.getByTestId('AndroidIcon')).toBeInTheDocument();
      expect(screen.getByTestId('AppleIcon')).toBeInTheDocument();
      expect(screen.getByTestId('ExtensionIcon')).toBeInTheDocument();

      // Check for quest icons
      expect(screen.getByTestId('LightbulbIcon')).toBeInTheDocument();
      expect(screen.getByTestId('BugReportIcon')).toBeInTheDocument();
      expect(screen.getByTestId('HelpOutlineIcon')).toBeInTheDocument();

      // Check for priority indicators
      const priorityDots = screen.getAllByTestId('CircleIcon');
      expect(priorityDots).toHaveLength(2); // HIGH and MEDIUM priority reviews
    });

    test('filter functionality works correctly', async () => {
      const mockSetFilters = jest.fn();
      
      mockUseReviews.mockReturnValue({
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
        setFilters: mockSetFilters,
        clearError: jest.fn(),
        retry: jest.fn(),
      });

      renderWithTheme(<FeedTab user={mockUser} />);

      // Test platform filter
      const platformFilter = screen.getByLabelText('Platform');
      fireEvent.mouseDown(platformFilter);
      
      await waitFor(() => {
        const googlePlayOption = screen.getAllByText('Google Play').find(
          element => element.closest('[role="option"]')
        );
        if (googlePlayOption) {
          fireEvent.click(googlePlayOption);
        }
      });

      expect(mockSetFilters).toHaveBeenCalledWith({
        platform: 'GooglePlay'
      });
    });

    test('overview statistics display correctly', () => {
      mockUseReviews.mockReturnValue({
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
      });

      renderWithTheme(<FeedTab user={mockUser} />);

      // Check total count
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Total Reviews')).toBeInTheDocument();

      // Check sentiment breakdown
      expect(screen.getByText('2 (66.7%)')).toBeInTheDocument(); // Positive
      expect(screen.getByText('1 (33.3%)')).toBeInTheDocument(); // Negative
    });

    test('handles loading states correctly', () => {
      mockUseReviews.mockReturnValue({
        reviews: [],
        loading: false,
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

      // Should show skeleton loaders
      expect(screen.getAllByTestId('skeleton')).toBeTruthy();
    });

    test('handles error states correctly', () => {
      mockUseReviews.mockReturnValue({
        reviews: [],
        loading: false,
        initialLoading: false,
        loadingMore: false,
        error: 'Failed to load reviews',
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

      // Should show error message
      expect(screen.getByText('Failed to load reviews')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
      expect(screen.getByText('(Retry attempt 1)')).toBeInTheDocument();
    });

    test('handles empty states correctly', () => {
      mockUseReviews.mockReturnValue({
        reviews: [],
        loading: false,
        initialLoading: false,
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

      // Should show empty state
      expect(screen.getByText('No reviews yet')).toBeInTheDocument();
      expect(screen.getByText('Check for Reviews')).toBeInTheDocument();
    });

    test('handles authentication states correctly', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
      });

      mockUseReviews.mockReturnValue({
        reviews: [],
        loading: false,
        initialLoading: false,
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

      renderWithTheme(<FeedTab user={null} />);

      // Should show authentication required message
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Please sign in to view your reviews.')).toBeInTheDocument();
    });

    test('handles user with no apps correctly', () => {
      const userWithNoApps = { ...mockUser, apps: [] };

      mockUseReviews.mockReturnValue({
        reviews: [],
        loading: false,
        initialLoading: false,
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

      renderWithTheme(<FeedTab user={userWithNoApps} />);

      // Should show setup message
      expect(screen.getByText('Welcome to ReviewQuest!')).toBeInTheDocument();
      expect(screen.getByText('Add your app store links in the Command Center to start monitoring reviews.')).toBeInTheDocument();
    });

    test('refresh functionality works', () => {
      const mockRefresh = jest.fn();
      
      mockUseReviews.mockReturnValue({
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
        refresh: mockRefresh,
        setFilters: jest.fn(),
        clearError: jest.fn(),
        retry: jest.fn(),
      });

      renderWithTheme(<FeedTab user={mockUser} />);

      // Click refresh button
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      expect(mockRefresh).toHaveBeenCalled();
    });

    test('load more functionality works', () => {
      const mockLoadMore = jest.fn();
      
      mockUseReviews.mockReturnValue({
        reviews: mockReviews,
        loading: false,
        initialLoading: false,
        loadingMore: false,
        error: null,
        hasError: false,
        retryCount: 0,
        hasMore: true,
        totalCount: 10,
        overview: mockOverview,
        loadMore: mockLoadMore,
        refresh: jest.fn(),
        setFilters: jest.fn(),
        clearError: jest.fn(),
        retry: jest.fn(),
      });

      renderWithTheme(<FeedTab user={mockUser} />);

      // Click load more button
      const loadMoreButton = screen.getByText('Load More Reviews');
      fireEvent.click(loadMoreButton);

      expect(mockLoadMore).toHaveBeenCalled();
    });
  });

  describe('Accessibility Features', () => {
    test('has proper ARIA labels and roles', () => {
      mockUseReviews.mockReturnValue({
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
      });

      renderWithTheme(<FeedTab user={mockUser} />);

      // Check for proper form labels
      expect(screen.getByLabelText('Platform')).toBeInTheDocument();
      expect(screen.getByLabelText('Rating')).toBeInTheDocument();
      expect(screen.getByLabelText('Sentiment')).toBeInTheDocument();
      expect(screen.getByLabelText('Quest Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Search reviews')).toBeInTheDocument();

      // Check for rating accessibility
      expect(screen.getByLabelText('5 Stars')).toBeInTheDocument();
      expect(screen.getByLabelText('2 Stars')).toBeInTheDocument();
      expect(screen.getByLabelText('4 Stars')).toBeInTheDocument();
    });

    test('keyboard navigation works correctly', () => {
      mockUseReviews.mockReturnValue({
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
      });

      renderWithTheme(<FeedTab user={mockUser} />);

      // Check that interactive elements are focusable
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toHaveAttribute('tabindex', '0');

      const platformFilter = screen.getByLabelText('Platform');
      expect(platformFilter).toHaveAttribute('tabindex', '0');
    });
  });
});
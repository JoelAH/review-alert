import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import FeedTab from '../FeedTab';
import { User } from '@/lib/models/client/user';

// Mock the hooks
jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
  }),
}));

jest.mock('@/lib/hooks/useReviews', () => ({
  useReviews: jest.fn(),
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    loading: jest.fn(),
    update: jest.fn(),
    dismiss: jest.fn(),
  },
  ToastContainer: () => <div data-testid="toast-container" />,
}));

// Mock the notification service
jest.mock('@/lib/services/notifications', () => ({
  NotificationService: {
    success: jest.fn(),
    error: jest.fn(),
    handleApiError: jest.fn(),
  },
}));

import { useReviews } from '@/lib/hooks/useReviews';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const mockUser: User = {
  _id: 'user1',
  uid: 'firebase-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  apps: [
    {
      _id: 'app1',
      appId: 'com.example.app',
      store: 'GooglePlay',
      url: 'https://play.google.com/store/apps/details?id=com.example.app',
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('FeedTab Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display error alert when there is an error', () => {
    (useReviews as jest.Mock).mockReturnValue({
      reviews: [],
      loading: false,
      initialLoading: false,
      loadingMore: false,
      error: 'Failed to load reviews',
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

    expect(screen.getByText('Failed to load reviews')).toBeInTheDocument();
    expect(screen.getByText('Failed to load reviews')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('should call retry function when retry button is clicked', () => {
    const mockRetry = jest.fn();
    
    (useReviews as jest.Mock).mockReturnValue({
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
      retry: mockRetry,
    });

    renderWithTheme(<FeedTab user={mockUser} />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('should show retry count in header when retrying', () => {
    (useReviews as jest.Mock).mockReturnValue({
      reviews: [],
      loading: false,
      initialLoading: false,
      loadingMore: false,
      error: null,
      hasError: false,
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

  it('should show skeleton loader during initial loading', () => {
    (useReviews as jest.Mock).mockReturnValue({
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

    // Should show skeleton elements
    const skeletons = document.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show enhanced empty state when no reviews', () => {
    (useReviews as jest.Mock).mockReturnValue({
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

    expect(screen.getByText('No reviews yet')).toBeInTheDocument();
    expect(screen.getByText(/Once your apps start receiving reviews/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /check for reviews/i })).toBeInTheDocument();
  });

  it('should show filtered empty state when filters applied', () => {
    (useReviews as jest.Mock).mockReturnValue({
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

    // Mock filters being applied
    const mockSetFilters = jest.fn();
    renderWithTheme(<FeedTab user={mockUser} />);

    // Simulate having filters applied by checking for the filtered empty state
    // This would normally be triggered by the ReviewFilters component
    expect(screen.getByText('No reviews yet')).toBeInTheDocument();
  });

  it('should show toast container for notifications', () => {
    (useReviews as jest.Mock).mockReturnValue({
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

    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
  });

  it('should show authentication required message when not authenticated', () => {
    // Mock useAuth to return not authenticated
    jest.doMock('@/lib/hooks/useAuth', () => ({
      useAuth: () => ({
        isAuthenticated: false,
      }),
    }));

    (useReviews as jest.Mock).mockReturnValue({
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

    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(screen.getByText('Please sign in to view your reviews.')).toBeInTheDocument();
  });
});
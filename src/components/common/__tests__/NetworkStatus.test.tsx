/**
 * Network Status Component Tests
 * Tests network status detection, retry mechanisms, and offline handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  NetworkStatusIndicator,
  RetryButton,
  ErrorWithRetry,
  ConnectionStatusChip,
  useNetworkStatus,
  useRetry,
} from '../NetworkStatus';

// Test theme
const theme = createTheme();

// Wrapper component for theme provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

// Test component for hooks
const NetworkStatusTestComponent = () => {
  const { isOnline, wasOffline } = useNetworkStatus();
  return (
    <div>
      <div data-testid="online-status">{isOnline ? 'online' : 'offline'}</div>
      <div data-testid="was-offline">{wasOffline ? 'was-offline' : 'not-offline'}</div>
    </div>
  );
};

const RetryTestComponent = ({ 
  operation, 
  onSuccess, 
  onError 
}: { 
  operation: () => Promise<string>; 
  onSuccess?: (result: string) => void;
  onError?: (error: Error) => void;
}) => {
  const { retry, retryCount, isRetrying, canRetry, reset } = useRetry(3, 100);
  
  const handleRetry = () => {
    retry(operation, onSuccess, onError);
  };

  return (
    <div>
      <div data-testid="retry-count">{retryCount}</div>
      <div data-testid="is-retrying">{isRetrying ? 'retrying' : 'not-retrying'}</div>
      <div data-testid="can-retry">{canRetry ? 'can-retry' : 'cannot-retry'}</div>
      <button onClick={handleRetry}>Retry</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
};

describe('NetworkStatus', () => {
  // Mock navigator.onLine
  const mockNavigator = {
    onLine: true,
  };

  beforeEach(() => {
    Object.defineProperty(window, 'navigator', {
      value: mockNavigator,
      writable: true,
    });

    // Reset online status
    mockNavigator.onLine = true;
    jest.clearAllMocks();
  });

  describe('useNetworkStatus hook', () => {
    it('should return online status from navigator', () => {
      render(
        <TestWrapper>
          <NetworkStatusTestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('online-status')).toHaveTextContent('online');
      expect(screen.getByTestId('was-offline')).toHaveTextContent('not-offline');
    });

    it('should update status when going offline', async () => {
      render(
        <TestWrapper>
          <NetworkStatusTestComponent />
        </TestWrapper>
      );

      // Simulate going offline
      act(() => {
        mockNavigator.onLine = false;
        window.dispatchEvent(new Event('offline'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('online-status')).toHaveTextContent('offline');
      });
    });

    it('should track wasOffline when coming back online', async () => {
      render(
        <TestWrapper>
          <NetworkStatusTestComponent />
        </TestWrapper>
      );

      // Go offline first
      act(() => {
        mockNavigator.onLine = false;
        window.dispatchEvent(new Event('offline'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('online-status')).toHaveTextContent('offline');
      });

      // Come back online
      act(() => {
        mockNavigator.onLine = true;
        window.dispatchEvent(new Event('online'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('online-status')).toHaveTextContent('online');
        expect(screen.getByTestId('was-offline')).toHaveTextContent('was-offline');
      });
    });
  });

  describe('NetworkStatusIndicator', () => {
    it('should not show anything when online and showWhenOnline is false', () => {
      render(
        <TestWrapper>
          <NetworkStatusIndicator showWhenOnline={false} />
        </TestWrapper>
      );

      expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
    });

    it('should show offline indicator when offline', async () => {
      mockNavigator.onLine = false;

      render(
        <TestWrapper>
          <NetworkStatusIndicator />
        </TestWrapper>
      );

      expect(screen.getByText(/You're offline/)).toBeInTheDocument();
    });

    it('should show retry button when offline and onRetry is provided', async () => {
      mockNavigator.onLine = false;
      const onRetry = jest.fn();

      render(
        <TestWrapper>
          <NetworkStatusIndicator onRetry={onRetry} />
        </TestWrapper>
      );

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalled();
    });

    it('should show reconnected notification when coming back online', async () => {
      const { rerender } = render(
        <TestWrapper>
          <NetworkStatusIndicator />
        </TestWrapper>
      );

      // Simulate going offline then online
      mockNavigator.onLine = false;
      rerender(
        <TestWrapper>
          <NetworkStatusIndicator />
        </TestWrapper>
      );

      mockNavigator.onLine = true;
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Back online/)).toBeInTheDocument();
      });
    });
  });

  describe('useRetry hook', () => {
    it('should handle successful operation', async () => {
      const successfulOperation = jest.fn().mockResolvedValue('success');
      const onSuccess = jest.fn();

      render(
        <TestWrapper>
          <RetryTestComponent 
            operation={successfulOperation} 
            onSuccess={onSuccess}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.getByTestId('is-retrying')).toHaveTextContent('not-retrying');
        expect(screen.getByTestId('retry-count')).toHaveTextContent('0');
      });

      expect(successfulOperation).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledWith('success');
    });

    it('should retry failed operations', async () => {
      const failingOperation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce('success');

      const onSuccess = jest.fn();

      render(
        <TestWrapper>
          <RetryTestComponent 
            operation={failingOperation} 
            onSuccess={onSuccess}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Retry'));

      // Should show retrying state
      expect(screen.getByTestId('is-retrying')).toHaveTextContent('retrying');

      await waitFor(() => {
        expect(screen.getByTestId('is-retrying')).toHaveTextContent('not-retrying');
        expect(screen.getByTestId('retry-count')).toHaveTextContent('0');
      }, { timeout: 2000 });

      expect(failingOperation).toHaveBeenCalledTimes(3);
      expect(onSuccess).toHaveBeenCalledWith('success');
    });

    it('should stop retrying after max attempts', async () => {
      const alwaysFailingOperation = jest.fn().mockRejectedValue(new Error('Always fails'));
      const onError = jest.fn();

      render(
        <TestWrapper>
          <RetryTestComponent 
            operation={alwaysFailingOperation} 
            onError={onError}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.getByTestId('is-retrying')).toHaveTextContent('not-retrying');
        expect(screen.getByTestId('can-retry')).toHaveTextContent('cannot-retry');
      }, { timeout: 2000 });

      expect(alwaysFailingOperation).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reset retry state', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Failure'));

      render(
        <TestWrapper>
          <RetryTestComponent operation={failingOperation} />
        </TestWrapper>
      );

      // Trigger failure
      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.getByTestId('retry-count')).toHaveTextContent('4');
        expect(screen.getByTestId('can-retry')).toHaveTextContent('cannot-retry');
      }, { timeout: 2000 });

      // Reset
      fireEvent.click(screen.getByText('Reset'));

      expect(screen.getByTestId('retry-count')).toHaveTextContent('0');
      expect(screen.getByTestId('can-retry')).toHaveTextContent('can-retry');
    });
  });

  describe('RetryButton', () => {
    it('should render with default props', () => {
      const onRetry = jest.fn();

      render(
        <TestWrapper>
          <RetryButton onRetry={onRetry} />
        </TestWrapper>
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should show retry count when provided', () => {
      const onRetry = jest.fn();

      render(
        <TestWrapper>
          <RetryButton onRetry={onRetry} retryCount={2} maxRetries={3} />
        </TestWrapper>
      );

      expect(screen.getByText('Try Again (2/3)')).toBeInTheDocument();
    });

    it('should show retrying state', () => {
      const onRetry = jest.fn();

      render(
        <TestWrapper>
          <RetryButton onRetry={onRetry} isRetrying={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Retrying...')).toBeInTheDocument();
    });

    it('should be disabled when cannot retry', () => {
      const onRetry = jest.fn();

      render(
        <TestWrapper>
          <RetryButton onRetry={onRetry} retryCount={3} maxRetries={3} />
        </TestWrapper>
      );

      const button = screen.getByText('Try Again (3/3)');
      expect(button).toBeDisabled();
    });

    it('should call onRetry when clicked', () => {
      const onRetry = jest.fn();

      render(
        <TestWrapper>
          <RetryButton onRetry={onRetry} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Try Again'));
      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('ErrorWithRetry', () => {
    it('should display error message', () => {
      const error = new Error('Test error message');
      const onRetry = jest.fn().mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ErrorWithRetry error={error} onRetry={onRetry} />
        </TestWrapper>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should show retry button', () => {
      const error = new Error('Test error');
      const onRetry = jest.fn().mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ErrorWithRetry error={error} onRetry={onRetry} />
        </TestWrapper>
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should handle network errors with auto retry', async () => {
      const networkError = new Error('Network Error: fetch failed');
      const onRetry = jest.fn().mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ErrorWithRetry 
            error={networkError} 
            onRetry={onRetry} 
            autoRetry={true}
            retryDelay={100}
          />
        </TestWrapper>
      );

      // Should auto-retry network errors
      await waitFor(() => {
        expect(onRetry).toHaveBeenCalled();
      }, { timeout: 200 });
    });

    it('should show error details when requested', async () => {
      const error = new Error('Detailed error');
      const onRetry = jest.fn().mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ErrorWithRetry 
            error={error} 
            onRetry={onRetry} 
            showErrorDetails={true}
          />
        </TestWrapper>
      );

      const detailsButton = screen.getByText('Details');
      fireEvent.click(detailsButton);

      await waitFor(() => {
        expect(screen.getByText('Error: Detailed error')).toBeInTheDocument();
      });
    });

    it('should show progress during retry', async () => {
      const error = new Error('Test error');
      const onRetry = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <TestWrapper>
          <ErrorWithRetry error={error} onRetry={onRetry} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Try Again'));

      // Should show retrying state
      expect(screen.getByText('Retrying... (1/3)')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Retrying...')).not.toBeInTheDocument();
      });
    });
  });

  describe('ConnectionStatusChip', () => {
    it('should show online status', () => {
      render(
        <TestWrapper>
          <ConnectionStatusChip />
        </TestWrapper>
      );

      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('should show offline status when offline', async () => {
      mockNavigator.onLine = false;

      render(
        <TestWrapper>
          <ConnectionStatusChip />
        </TestWrapper>
      );

      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });

  describe('error message customization', () => {
    it('should customize network error messages', () => {
      const networkError = new Error('fetch failed');
      const onRetry = jest.fn().mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ErrorWithRetry error={networkError} onRetry={onRetry} />
        </TestWrapper>
      );

      expect(screen.getByText(/Network connection error/)).toBeInTheDocument();
    });

    it('should customize 404 error messages', () => {
      const notFoundError = new Error('404 Not Found');
      const onRetry = jest.fn().mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ErrorWithRetry error={notFoundError} onRetry={onRetry} />
        </TestWrapper>
      );

      expect(screen.getByText(/The requested resource was not found/)).toBeInTheDocument();
    });

    it('should customize authentication error messages', () => {
      const authError = new Error('401 Unauthorized');
      const onRetry = jest.fn().mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ErrorWithRetry error={authError} onRetry={onRetry} />
        </TestWrapper>
      );

      expect(screen.getByText(/Authentication error/)).toBeInTheDocument();
    });

    it('should customize server error messages', () => {
      const serverError = new Error('500 Internal Server Error');
      const onRetry = jest.fn().mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ErrorWithRetry error={serverError} onRetry={onRetry} />
        </TestWrapper>
      );

      expect(screen.getByText(/Server error/)).toBeInTheDocument();
    });
  });
});
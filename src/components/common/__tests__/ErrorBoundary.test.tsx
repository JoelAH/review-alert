/**
 * Error Boundary Component Tests
 * Tests error boundary functionality, retry mechanisms, and error display
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ErrorBoundary, { withErrorBoundary } from '../ErrorBoundary';

// Test theme
const theme = createTheme();

// Wrapper component for theme provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean; errorMessage?: string }> = ({ 
  shouldThrow = true, 
  errorMessage = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
};

// Component that works normally
const WorkingComponent: React.FC = () => <div>Working component</div>;

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic error boundary functionality', () => {
    it('should render children when no error occurs', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <WorkingComponent />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    it('should catch and display error when child component throws', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
    });

    it('should display custom context in error title', () => {
      render(
        <TestWrapper>
          <ErrorBoundary context="Test Component">
            <ThrowError />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText('Test Component Error')).toBeInTheDocument();
    });

    it('should call onError callback when error occurs', () => {
      const onError = jest.fn();
      
      render(
        <TestWrapper>
          <ErrorBoundary onError={onError}>
            <ThrowError errorMessage="Custom error" />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Custom error' }),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });

    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error fallback</div>;
      
      render(
        <TestWrapper>
          <ErrorBoundary fallback={customFallback}>
            <ThrowError />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('retry functionality', () => {
    it('should show retry button when retryable is true', () => {
      render(
        <TestWrapper>
          <ErrorBoundary retryable={true}>
            <ThrowError />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should not show retry button when retryable is false', () => {
      render(
        <TestWrapper>
          <ErrorBoundary retryable={false}>
            <ThrowError />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });

    it('should retry and recover when retry button is clicked', () => {
      let shouldThrow = true;
      
      const ConditionalError: React.FC = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Recovered!</div>;
      };

      render(
        <TestWrapper>
          <ErrorBoundary retryable={true}>
            <ConditionalError />
          </ErrorBoundary>
        </TestWrapper>
      );

      // Should show error initially
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Fix the error condition
      shouldThrow = false;

      // Click retry
      fireEvent.click(screen.getByText('Try Again'));

      // Should recover
      expect(screen.getByText('Recovered!')).toBeInTheDocument();
    });

    it('should track retry count and disable after max retries', () => {
      render(
        <TestWrapper>
          <ErrorBoundary retryable={true}>
            <ThrowError />
          </ErrorBoundary>
        </TestWrapper>
      );

      const retryButton = screen.getByText('Try Again');

      // First retry
      fireEvent.click(retryButton);
      expect(screen.getByText('Try Again (1/3)')).toBeInTheDocument();

      // Second retry
      fireEvent.click(screen.getByText('Try Again (1/3)'));
      expect(screen.getByText('Try Again (2/3)')).toBeInTheDocument();

      // Third retry
      fireEvent.click(screen.getByText('Try Again (2/3)'));
      expect(screen.getByText('Try Again (3/3)')).toBeInTheDocument();

      // Should be disabled after max retries
      const finalRetryButton = screen.getByText('Try Again (3/3)');
      expect(finalRetryButton).toBeDisabled();
    });
  });

  describe('error details', () => {
    it('should show error details when showErrorDetails is true', () => {
      render(
        <TestWrapper>
          <ErrorBoundary showErrorDetails={true}>
            <ThrowError errorMessage="Detailed error message" />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText('Show Error Details')).toBeInTheDocument();
    });

    it('should not show error details when showErrorDetails is false', () => {
      render(
        <TestWrapper>
          <ErrorBoundary showErrorDetails={false}>
            <ThrowError />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.queryByText('Show Error Details')).not.toBeInTheDocument();
    });

    it('should toggle error details when button is clicked', async () => {
      render(
        <TestWrapper>
          <ErrorBoundary showErrorDetails={true}>
            <ThrowError errorMessage="Detailed error message" />
          </ErrorBoundary>
        </TestWrapper>
      );

      const toggleButton = screen.getByText('Show Error Details');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Hide Error Details')).toBeInTheDocument();
        expect(screen.getByText('Error: Detailed error message')).toBeInTheDocument();
      });

      // Hide details
      fireEvent.click(screen.getByText('Hide Error Details'));

      await waitFor(() => {
        expect(screen.getByText('Show Error Details')).toBeInTheDocument();
        expect(screen.queryByText('Error: Detailed error message')).not.toBeInTheDocument();
      });
    });
  });

  describe('error message customization', () => {
    it('should show network error message for network errors', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowError errorMessage="Network Error: fetch failed" />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText(/Network connection error/)).toBeInTheDocument();
    });

    it('should show chunk load error message for chunk errors', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowError errorMessage="ChunkLoadError: Loading chunk 1 failed" />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText(/Failed to load application resources/)).toBeInTheDocument();
    });

    it('should show data loading error for TypeError', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowError errorMessage="TypeError: Cannot read properties of undefined" />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText(/Data loading error/)).toBeInTheDocument();
    });
  });

  describe('suggestions', () => {
    it('should show network-specific suggestions for network errors', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowError errorMessage="Network Error: fetch failed" />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText('Check your internet connection')).toBeInTheDocument();
      expect(screen.getByText('Try refreshing the page')).toBeInTheDocument();
    });

    it('should show chunk-specific suggestions for chunk errors', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowError errorMessage="ChunkLoadError: Loading chunk failed" />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText('Clear your browser cache')).toBeInTheDocument();
      expect(screen.getByText('Try a hard refresh (Ctrl+F5 or Cmd+Shift+R)')).toBeInTheDocument();
    });

    it('should show default suggestions for generic errors', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowError errorMessage="Generic error" />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText('Try refreshing the page')).toBeInTheDocument();
      expect(screen.getByText('If the problem persists, please contact support')).toBeInTheDocument();
    });
  });

  describe('refresh functionality', () => {
    it('should have refresh page button', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText('Refresh Page')).toBeInTheDocument();
    });

    it('should call window.location.reload when refresh button is clicked', () => {
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });

      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Refresh Page'));
      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('withErrorBoundary HOC', () => {
    it('should wrap component with error boundary', () => {
      const WrappedComponent = withErrorBoundary(WorkingComponent, {
        context: 'HOC Test',
      });

      render(
        <TestWrapper>
          <WrappedComponent />
        </TestWrapper>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    it('should catch errors in wrapped component', () => {
      const WrappedComponent = withErrorBoundary(ThrowError, {
        context: 'HOC Test',
        retryable: true,
      });

      render(
        <TestWrapper>
          <WrappedComponent />
        </TestWrapper>
      );

      expect(screen.getByText('HOC Test Error')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should set correct display name', () => {
      const TestComponent = () => <div>Test</div>;
      TestComponent.displayName = 'TestComponent';
      
      const WrappedComponent = withErrorBoundary(TestComponent);
      
      expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
    });
  });

  describe('development vs production behavior', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should show error details in development', () => {
      process.env.NODE_ENV = 'development';
      
      render(
        <TestWrapper>
          <ErrorBoundary showErrorDetails={true}>
            <ThrowError errorMessage="Dev error" />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText('Show Error Details')).toBeInTheDocument();
    });

    it('should hide error details in production by default', () => {
      process.env.NODE_ENV = 'production';
      
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowError errorMessage="Prod error" />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.queryByText('Show Error Details')).not.toBeInTheDocument();
    });
  });
});
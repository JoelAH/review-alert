'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  AlertTitle,
  useTheme,
} from '@mui/material';
import { RefreshRounded, BugReportRounded } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the entire application
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    // Reset error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component
 */
interface ErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
}

function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        p: 3,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          p: 4,
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <BugReportRounded
          sx={{
            fontSize: 48,
            color: 'error.main',
            mb: 2,
          }}
        />
        
        <Typography variant="h6" gutterBottom>
          Something went wrong
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
        </Typography>

        <Button
          variant="contained"
          startIcon={<RefreshRounded />}
          onClick={onRetry}
          sx={{ mb: 2 }}
        >
          Try Again
        </Button>

        {isDevelopment && error && (
          <Alert severity="error" sx={{ mt: 3, textAlign: 'left' }}>
            <AlertTitle>Development Error Details</AlertTitle>
            <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', overflow: 'auto' }}>
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </Typography>
          </Alert>
        )}
      </Paper>
    </Box>
  );
}

/**
 * Hook version of Error Boundary for functional components
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    
    // In a real application, you might want to send this to an error reporting service
    // like Sentry, LogRocket, or Bugsnag
  };
}

/**
 * Higher-order component that wraps a component with an Error Boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default ErrorBoundary;
"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Collapse,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  retryable?: boolean;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private static readonly MAX_RETRIES = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < ErrorBoundary.MAX_RETRIES) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        showDetails: false,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  handleToggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.props.retryable ? this.handleRetry : undefined}
          canRetry={this.props.retryable && this.state.retryCount < ErrorBoundary.MAX_RETRIES}
          retryCount={this.state.retryCount}
          showErrorDetails={this.props.showErrorDetails}
          showDetails={this.state.showDetails}
          onToggleDetails={this.handleToggleDetails}
          context={this.props.context}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onRetry?: () => void;
  canRetry?: boolean;
  retryCount?: number;
  showErrorDetails?: boolean;
  showDetails?: boolean;
  onToggleDetails?: () => void;
  context?: string;
}

function ErrorFallback({
  error,
  errorInfo,
  onRetry,
  canRetry,
  retryCount = 0,
  showErrorDetails = false,
  showDetails = false,
  onToggleDetails,
  context,
}: ErrorFallbackProps) {
  const theme = useTheme();

  const getErrorTitle = () => {
    if (context) {
      return `${context} Error`;
    }
    return 'Something went wrong';
  };

  const getErrorMessage = () => {
    if (error?.message.includes('ChunkLoadError') || error?.message.includes('Loading chunk')) {
      return 'Failed to load application resources. This might be due to a network issue or an app update.';
    }
    if (error?.message.includes('Network Error') || error?.message.includes('fetch')) {
      return 'Network connection error. Please check your internet connection and try again.';
    }
    if (error?.name === 'TypeError' && error?.message.includes('Cannot read properties')) {
      return 'Data loading error. Some information may be temporarily unavailable.';
    }
    return 'An unexpected error occurred. Please try refreshing the page.';
  };

  const getSuggestions = () => {
    const suggestions = [];
    
    if (error?.message.includes('Network') || error?.message.includes('fetch')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try refreshing the page');
    }
    
    if (error?.message.includes('ChunkLoadError')) {
      suggestions.push('Clear your browser cache');
      suggestions.push('Try a hard refresh (Ctrl+F5 or Cmd+Shift+R)');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Try refreshing the page');
      suggestions.push('If the problem persists, please contact support');
    }
    
    return suggestions;
  };

  return (
    <Card 
      sx={{ 
        maxWidth: 600, 
        mx: 'auto', 
        mt: 4,
        border: `1px solid ${theme.palette.error.light}`,
      }}
    >
      <CardContent sx={{ textAlign: 'center', p: 3 }}>
        <ErrorIcon 
          sx={{ 
            fontSize: '4rem', 
            color: 'error.main', 
            mb: 2 
          }} 
        />
        
        <Typography variant="h5" color="error" sx={{ mb: 1, fontWeight: 600 }}>
          {getErrorTitle()}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
          {getErrorMessage()}
        </Typography>

        {/* Suggestions */}
        <Box sx={{ mb: 3, textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Try these solutions:
          </Typography>
          {getSuggestions().map((suggestion, index) => (
            <Typography key={index} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              • {suggestion}
            </Typography>
          ))}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {onRetry && canRetry && (
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
              color="primary"
            >
              Try Again {retryCount > 0 && `(${retryCount}/3)`}
            </Button>
          )}
          
          <Button
            variant="outlined"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </Box>

        {/* Error Details (Development/Debug) */}
        {showErrorDetails && error && (
          <Box sx={{ mt: 3 }}>
            <Button
              startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={onToggleDetails}
              size="small"
              color="inherit"
            >
              {showDetails ? 'Hide' : 'Show'} Error Details
            </Button>
            
            <Collapse in={showDetails}>
              <Alert 
                severity="error" 
                icon={<BugReportIcon />}
                sx={{ 
                  mt: 2, 
                  textAlign: 'left',
                  '& .MuiAlert-message': {
                    width: '100%'
                  }
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Error Details:
                </Typography>
                <Typography variant="body2" component="pre" sx={{ 
                  whiteSpace: 'pre-wrap', 
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  mb: 1
                }}>
                  {error.name}: {error.message}
                </Typography>
                {error.stack && (
                  <Typography variant="body2" component="pre" sx={{ 
                    whiteSpace: 'pre-wrap', 
                    fontSize: '0.7rem',
                    fontFamily: 'monospace',
                    opacity: 0.8,
                    maxHeight: 200,
                    overflow: 'auto'
                  }}>
                    {error.stack}
                  </Typography>
                )}
                {errorInfo?.componentStack && (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
                      Component Stack:
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ 
                      whiteSpace: 'pre-wrap', 
                      fontSize: '0.7rem',
                      fontFamily: 'monospace',
                      opacity: 0.8,
                      maxHeight: 150,
                      overflow: 'auto'
                    }}>
                      {errorInfo.componentStack}
                    </Typography>
                  </>
                )}
              </Alert>
            </Collapse>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default ErrorBoundary;
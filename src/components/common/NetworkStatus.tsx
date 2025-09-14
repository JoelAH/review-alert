"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Button,
  Snackbar,
  Box,
  Typography,
  IconButton,
  Collapse,
  LinearProgress,
  Chip,
  useTheme,
} from '@mui/material';
import {
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

// Network status hook
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setWasOffline(!isOnline); // Track if we were offline
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  return { isOnline, wasOffline };
}

// Network status indicator component
export function NetworkStatusIndicator({ 
  showWhenOnline = false,
  position = 'top',
  autoHide = true,
  onRetry,
}: {
  showWhenOnline?: boolean;
  position?: 'top' | 'bottom';
  autoHide?: boolean;
  onRetry?: () => void;
}) {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline && !dismissed) {
      setShowReconnected(true);
      if (autoHide) {
        const timer = setTimeout(() => {
          setShowReconnected(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline, wasOffline, dismissed, autoHide]);

  const handleDismiss = () => {
    setDismissed(true);
    setShowReconnected(false);
  };

  if (isOnline && !showReconnected && !showWhenOnline) {
    return null;
  }

  return (
    <>
      {/* Offline indicator */}
      {!isOnline && (
        <Alert
          severity="warning"
          icon={<OfflineIcon />}
          sx={{
            mb: 2,
            '& .MuiAlert-action': {
              alignItems: 'center',
            },
          }}
          action={
            onRetry && (
              <Button
                color="inherit"
                size="small"
                onClick={onRetry}
                startIcon={<RefreshIcon />}
              >
                Retry
              </Button>
            )
          }
        >
          <Typography variant="body2">
            You&apos;re offline. Some features may not work properly.
          </Typography>
        </Alert>
      )}

      {/* Reconnected notification */}
      <Snackbar
        open={showReconnected}
        autoHideDuration={autoHide ? 3000 : null}
        onClose={handleDismiss}
        anchorOrigin={{
          vertical: position,
          horizontal: 'center',
        }}
      >
        <Alert
          onClose={handleDismiss}
          severity="success"
          icon={<OnlineIcon />}
          sx={{ width: '100%' }}
        >
          Back online! Your connection has been restored.
        </Alert>
      </Snackbar>
    </>
  );
}

// Retry mechanism hook
export function useRetry(maxRetries = 3, initialDelay = 1000) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const retry = useCallback(async (
    operation: () => Promise<any>,
    onSuccess?: (result: any) => void,
    onError?: (error: Error) => void
  ): Promise<any | null> => {
    setIsRetrying(true);
    setLastError(null);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        setRetryCount(0);
        setIsRetrying(false);
        onSuccess?.(result);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        setLastError(err);
        setRetryCount(attempt + 1);

        if (attempt === maxRetries) {
          setIsRetrying(false);
          onError?.(err);
          throw err;
        }

        // Wait before retrying with exponential backoff
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    setIsRetrying(false);
    return null;
  }, [maxRetries, initialDelay]);

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
    setLastError(null);
  }, []);

  return {
    retry,
    retryCount,
    isRetrying,
    lastError,
    canRetry: retryCount < maxRetries,
    reset,
  };
}

// Retry button component
export function RetryButton({
  onRetry,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  disabled = false,
  variant = 'contained',
  size = 'medium',
  showCount = true,
}: {
  onRetry: () => void;
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
  disabled?: boolean;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}) {
  const canRetry = retryCount < maxRetries;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onRetry}
      disabled={disabled || isRetrying || !canRetry}
      startIcon={<RefreshIcon />}
      sx={{
        ...(isRetrying && {
          '& .MuiButton-startIcon': {
            animation: 'spin 1s linear infinite',
          },
        }),
      }}
    >
      {isRetrying ? 'Retrying...' : 'Try Again'}
      {showCount && retryCount > 0 && ` (${retryCount}/${maxRetries})`}
    </Button>
  );
}

// Error retry component with automatic retry logic
export function ErrorWithRetry({
  error,
  onRetry,
  maxRetries = 3,
  autoRetry = false,
  retryDelay = 1000,
  title = 'Something went wrong',
  showErrorDetails = false,
}: {
  error: Error;
  onRetry: () => Promise<void>;
  maxRetries?: number;
  autoRetry?: boolean;
  retryDelay?: number;
  title?: string;
  showErrorDetails?: boolean;
}) {
  const { retry, retryCount, isRetrying, canRetry } = useRetry(maxRetries, retryDelay);
  const [showDetails, setShowDetails] = useState(false);

  // Auto retry for network errors
  useEffect(() => {
    if (autoRetry && canRetry && isNetworkError(error)) {
      const timer = setTimeout(() => {
        retry(onRetry);
      }, retryDelay);
      return () => clearTimeout(timer);
    }
  }, [autoRetry, canRetry, error, onRetry, retry, retryDelay]);

  const handleManualRetry = () => {
    retry(onRetry);
  };

  return (
    <Alert
      severity="error"
      icon={<ErrorIcon />}
      sx={{ mb: 2 }}
      action={
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {showErrorDetails && (
            <Button
              color="inherit"
              size="small"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide' : 'Details'}
            </Button>
          )}
          <RetryButton
            onRetry={handleManualRetry}
            isRetrying={isRetrying}
            retryCount={retryCount}
            maxRetries={maxRetries}
            variant="outlined"
            size="small"
          />
        </Box>
      }
    >
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="body2">
        {getErrorMessage(error)}
      </Typography>
      
      {isRetrying && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress size="small" />
          <Typography variant="caption" color="text.secondary">
            Retrying... ({retryCount}/{maxRetries})
          </Typography>
        </Box>
      )}

      <Collapse in={showDetails}>
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="caption" component="pre" sx={{ 
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '0.75rem'
          }}>
            {error.name}: {error.message}
            {error.stack && `\n\n${error.stack}`}
          </Typography>
        </Box>
      </Collapse>
    </Alert>
  );
}

// Connection status chip
export function ConnectionStatusChip() {
  const { isOnline } = useNetworkStatus();
  const theme = useTheme();

  return (
    <Chip
      icon={isOnline ? <OnlineIcon /> : <OfflineIcon />}
      label={isOnline ? 'Online' : 'Offline'}
      size="small"
      color={isOnline ? 'success' : 'warning'}
      variant="outlined"
      sx={{
        '& .MuiChip-icon': {
          color: isOnline ? theme.palette.success.main : theme.palette.warning.main,
        },
      }}
    />
  );
}

// Utility functions
function isNetworkError(error: Error): boolean {
  return (
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('connection') ||
    error.message.includes('timeout') ||
    error.name === 'NetworkError' ||
    error.name === 'TypeError' && error.message.includes('fetch')
  );
}

function getErrorMessage(error: Error): string {
  if (isNetworkError(error)) {
    return 'Network connection error. Please check your internet connection.';
  }
  
  if (error.message.includes('404')) {
    return 'The requested resource was not found.';
  }
  
  if (error.message.includes('401') || error.message.includes('403')) {
    return 'Authentication error. Please sign in again.';
  }
  
  if (error.message.includes('500')) {
    return 'Server error. Please try again later.';
  }
  
  return error.message || 'An unexpected error occurred.';
}

export default {
  NetworkStatusIndicator,
  RetryButton,
  ErrorWithRetry,
  ConnectionStatusChip,
  useNetworkStatus,
  useRetry,
};
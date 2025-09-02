'use client';

import React from 'react';
import { toast, ToastOptions, Id } from 'react-toastify';

/**
 * Centralized notification service for consistent toast messaging
 */
export class NotificationService {
  private static readonly DEFAULT_OPTIONS: ToastOptions = {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };

  /**
   * Show success notification
   */
  static success(message: string, options?: ToastOptions): Id {
    return toast.success(message, {
      ...this.DEFAULT_OPTIONS,
      ...options,
    });
  }

  /**
   * Show error notification
   */
  static error(message: string, options?: ToastOptions): Id {
    return toast.error(message, {
      ...this.DEFAULT_OPTIONS,
      autoClose: 8000, // Longer duration for errors
      ...options,
    });
  }

  /**
   * Show warning notification
   */
  static warning(message: string, options?: ToastOptions): Id {
    return toast.warning(message, {
      ...this.DEFAULT_OPTIONS,
      ...options,
    });
  }

  /**
   * Show info notification
   */
  static info(message: string, options?: ToastOptions): Id {
    return toast.info(message, {
      ...this.DEFAULT_OPTIONS,
      ...options,
    });
  }

  /**
   * Show loading notification
   */
  static loading(message: string, options?: ToastOptions): Id {
    return toast.loading(message, {
      ...this.DEFAULT_OPTIONS,
      autoClose: false,
      closeOnClick: false,
      ...options,
    });
  }

  /**
   * Update an existing toast
   */
  static update(toastId: Id, options: ToastOptions & { render?: React.ReactNode }): void {
    toast.update(toastId, {
      ...this.DEFAULT_OPTIONS,
      ...options,
    });
  }

  /**
   * Dismiss a specific toast
   */
  static dismiss(toastId?: Id): void {
    toast.dismiss(toastId);
  }

  /**
   * Dismiss all toasts
   */
  static dismissAll(): void {
    toast.dismiss();
  }

  /**
   * Handle API errors with appropriate messaging
   */
  static handleApiError(error: unknown, context?: string): Id {
    let message = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    // Add context if provided
    if (context) {
      message = `${context}: ${message}`;
    }

    // Map common error messages to user-friendly ones
    const friendlyMessage = this.getFriendlyErrorMessage(message);
    
    return this.error(friendlyMessage);
  }

  /**
   * Convert technical error messages to user-friendly ones
   */
  private static getFriendlyErrorMessage(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }

    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('401')) {
      return 'Your session has expired. Please sign in again.';
    }

    if (lowerMessage.includes('forbidden') || lowerMessage.includes('403')) {
      return 'You don\'t have permission to access this resource.';
    }

    if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
      return 'The requested resource was not found.';
    }

    if (lowerMessage.includes('server') || lowerMessage.includes('500')) {
      return 'Server error. Please try again later.';
    }

    if (lowerMessage.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    if (lowerMessage.includes('database')) {
      return 'Database error. Please try again later.';
    }

    // Return original message if no mapping found
    return message;
  }

  /**
   * Show retry notification with action button
   */
  static retryError(message: string, onRetry: () => void, options?: ToastOptions): Id {
    return toast.error(
      React.createElement('div', null,
        React.createElement('div', null, message),
        React.createElement('button', {
          onClick: () => {
            onRetry();
            this.dismissAll();
          },
          style: {
            marginTop: '8px',
            padding: '4px 8px',
            backgroundColor: 'transparent',
            border: '1px solid currentColor',
            borderRadius: '4px',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '12px',
          }
        }, 'Retry')
      ),
      {
        ...this.DEFAULT_OPTIONS,
        autoClose: false,
        closeOnClick: false,
        ...options,
      }
    );
  }

  /**
   * Show connection status notifications
   */
  static connectionLost(): Id {
    return this.warning('Connection lost. Trying to reconnect...', {
      autoClose: false,
      toastId: 'connection-lost', // Prevent duplicates
    });
  }

  static connectionRestored(): Id {
    // Dismiss connection lost notification
    this.dismiss('connection-lost');
    
    return this.success('Connection restored!', {
      autoClose: 3000,
    });
  }

  /**
   * Show data sync notifications
   */
  static syncInProgress(): Id {
    return this.loading('Syncing data...', {
      toastId: 'sync-progress',
    });
  }

  static syncComplete(): void {
    this.update('sync-progress', {
      render: 'Data synced successfully!',
      type: 'success',
      isLoading: false,
      autoClose: 3000,
    });
  }

  static syncFailed(error?: string): void {
    this.update('sync-progress', {
      render: error || 'Sync failed. Please try again.',
      type: 'error',
      isLoading: false,
      autoClose: 5000,
    });
  }
}

/**
 * Hook for using notifications in React components
 */
export function useNotifications() {
  return {
    success: NotificationService.success,
    error: NotificationService.error,
    warning: NotificationService.warning,
    info: NotificationService.info,
    loading: NotificationService.loading,
    handleApiError: NotificationService.handleApiError,
    retryError: NotificationService.retryError,
    dismiss: NotificationService.dismiss,
    dismissAll: NotificationService.dismissAll,
  };
}

export default NotificationService;
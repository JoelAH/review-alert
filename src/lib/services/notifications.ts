'use client';

import React from 'react';
import { toast, ToastOptions, Id } from 'react-toastify';
import { XPAction, Badge, XPAwardResult } from '@/types/gamification';

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

  // Notification preferences - can be extended for user customization
  private static preferences = {
    xpNotifications: true,
    badgeNotifications: true,
    levelUpNotifications: true,
    streakNotifications: true,
    batchNotifications: true,
  };

  // Batching state for XP notifications
  private static xpBatch: {
    totalXP: number;
    actions: Array<{ action: XPAction; amount: number }>;
    timeoutId?: NodeJS.Timeout;
  } = {
    totalXP: 0,
    actions: [],
  };

  /**
   * Set notification preferences
   */
  static setPreferences(newPreferences: Partial<typeof NotificationService.preferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
  }

  /**
   * Get current notification preferences
   */
  static getPreferences(): typeof NotificationService.preferences {
    return { ...this.preferences };
  }

  /**
   * Show XP gain notification with action context
   */
  static xpGained(xpAmount: number, action: XPAction, options?: ToastOptions): Id | null {
    if (!this.preferences.xpNotifications) return null;

    const actionMessages: Record<XPAction, string> = {
      [XPAction.QUEST_CREATED]: 'Quest created',
      [XPAction.QUEST_IN_PROGRESS]: 'Quest started',
      [XPAction.QUEST_COMPLETED]: 'Quest completed',
      [XPAction.APP_ADDED]: 'App added',
      [XPAction.REVIEW_INTERACTION]: 'Review interaction',
      [XPAction.LOGIN_STREAK_BONUS]: 'Login streak bonus',
    };

    const message = `+${xpAmount} XP • ${actionMessages[action]}`;
    
    return toast.success(
      React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', gap: '8px' }
      },
        React.createElement('span', { 
          style: { 
            fontSize: '18px',
            filter: 'drop-shadow(0 0 4px gold)',
          }
        }, '⭐'),
        React.createElement('span', null, message)
      ),
      {
        ...this.DEFAULT_OPTIONS,
        autoClose: 3000,
        className: 'xp-notification',
        ...options,
      }
    );
  }

  /**
   * Show batched XP notification for multiple simultaneous gains
   */
  static batchedXPGained(totalXP: number, actions: Array<{ action: XPAction; amount: number }>, options?: ToastOptions): Id | null {
    if (!this.preferences.xpNotifications || !this.preferences.batchNotifications) return null;

    const actionMessages: Record<XPAction, string> = {
      [XPAction.QUEST_CREATED]: 'Quest created',
      [XPAction.QUEST_IN_PROGRESS]: 'Quest started', 
      [XPAction.QUEST_COMPLETED]: 'Quest completed',
      [XPAction.APP_ADDED]: 'App added',
      [XPAction.REVIEW_INTERACTION]: 'Review interaction',
      [XPAction.LOGIN_STREAK_BONUS]: 'Login streak bonus',
    };

    const actionsList = actions.map(({ action, amount }) => 
      `+${amount} XP • ${actionMessages[action]}`
    ).join('\n');

    return toast.success(
      React.createElement('div', {
        style: { display: 'flex', flexDirection: 'column', gap: '4px' }
      },
        React.createElement('div', {
          style: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }
        },
          React.createElement('span', { 
            style: { 
              fontSize: '18px',
              filter: 'drop-shadow(0 0 4px gold)',
            }
          }, '⭐'),
          React.createElement('span', null, `+${totalXP} XP Total`)
        ),
        React.createElement('div', {
          style: { fontSize: '12px', opacity: 0.8, marginLeft: '26px' }
        }, actionsList)
      ),
      {
        ...this.DEFAULT_OPTIONS,
        autoClose: 4000,
        className: 'xp-batch-notification',
        ...options,
      }
    );
  }

  /**
   * Add XP to batch and show notification after delay
   */
  static addToBatch(xpAmount: number, action: XPAction): void {
    if (!this.preferences.batchNotifications) {
      this.xpGained(xpAmount, action);
      return;
    }

    this.xpBatch.totalXP += xpAmount;
    this.xpBatch.actions.push({ action, amount: xpAmount });

    // Clear existing timeout
    if (this.xpBatch.timeoutId) {
      clearTimeout(this.xpBatch.timeoutId);
    }

    // Set new timeout to show batched notification
    this.xpBatch.timeoutId = setTimeout(() => {
      if (this.xpBatch.actions.length === 1) {
        // Single action, show regular notification
        const { action, amount } = this.xpBatch.actions[0];
        this.xpGained(amount, action);
      } else {
        // Multiple actions, show batched notification
        this.batchedXPGained(this.xpBatch.totalXP, [...this.xpBatch.actions]);
      }

      // Reset batch
      this.xpBatch.totalXP = 0;
      this.xpBatch.actions = [];
      this.xpBatch.timeoutId = undefined;
    }, 1000); // 1 second delay for batching
  }

  /**
   * Show badge earned notification with celebration
   */
  static badgeEarned(badge: Badge, options?: ToastOptions): Id | null {
    if (!this.preferences.badgeNotifications) return null;

    return toast.success(
      React.createElement('div', {
        style: { 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '8px',
          textAlign: 'center'
        }
      },
        React.createElement('div', {
          style: { 
            fontSize: '32px',
            animation: 'bounce 0.6s ease-in-out',
            filter: 'drop-shadow(0 0 8px gold)',
          }
        }, '🏆'),
        React.createElement('div', {
          style: { fontWeight: 'bold', fontSize: '16px' }
        }, 'Badge Earned!'),
        React.createElement('div', {
          style: { fontSize: '14px' }
        }, badge.name),
        React.createElement('div', {
          style: { fontSize: '12px', opacity: 0.8 }
        }, badge.description)
      ),
      {
        ...this.DEFAULT_OPTIONS,
        autoClose: 6000,
        className: 'badge-notification',
        ...options,
      }
    );
  }

  /**
   * Show level up notification with celebration
   */
  static levelUp(newLevel: number, options?: ToastOptions): Id | null {
    if (!this.preferences.levelUpNotifications) return null;

    return toast.success(
      React.createElement('div', {
        style: { 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '8px',
          textAlign: 'center'
        }
      },
        React.createElement('div', {
          style: { 
            fontSize: '36px',
            animation: 'pulse 1s ease-in-out infinite',
            filter: 'drop-shadow(0 0 12px #4CAF50)',
          }
        }, '🎉'),
        React.createElement('div', {
          style: { fontWeight: 'bold', fontSize: '18px', color: '#4CAF50' }
        }, 'Level Up!'),
        React.createElement('div', {
          style: { fontSize: '16px' }
        }, `You reached Level ${newLevel}!`)
      ),
      {
        ...this.DEFAULT_OPTIONS,
        autoClose: 7000,
        className: 'level-up-notification',
        ...options,
      }
    );
  }

  /**
   * Show streak milestone notification
   */
  static streakMilestone(streakDays: number, bonusXP: number, options?: ToastOptions): Id | null {
    if (!this.preferences.streakNotifications) return null;

    return toast.success(
      React.createElement('div', {
        style: { 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '6px',
          textAlign: 'center'
        }
      },
        React.createElement('div', {
          style: { 
            fontSize: '28px',
            filter: 'drop-shadow(0 0 6px orange)',
          }
        }, '🔥'),
        React.createElement('div', {
          style: { fontWeight: 'bold', fontSize: '16px' }
        }, `${streakDays}-Day Streak!`),
        React.createElement('div', {
          style: { fontSize: '14px' }
        }, `+${bonusXP} Bonus XP`)
      ),
      {
        ...this.DEFAULT_OPTIONS,
        autoClose: 5000,
        className: 'streak-notification',
        ...options,
      }
    );
  }

  /**
   * Show comprehensive XP award result notification
   */
  static xpAwardResult(result: XPAwardResult, action: XPAction, options?: ToastOptions): Id | null {
    // Handle level up first (most important)
    if (result.levelUp && result.newLevel) {
      this.levelUp(result.newLevel);
    }

    // Handle badge achievements
    result.badgesEarned.forEach(badge => {
      this.badgeEarned(badge);
    });

    // Handle XP gain (unless batching is preferred)
    if (!this.preferences.batchNotifications) {
      return this.xpGained(result.xpAwarded, action, options);
    } else {
      this.addToBatch(result.xpAwarded, action);
      return null;
    }
  }

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
    // Gamification notifications
    xpGained: NotificationService.xpGained,
    batchedXPGained: NotificationService.batchedXPGained,
    addToBatch: NotificationService.addToBatch,
    badgeEarned: NotificationService.badgeEarned,
    levelUp: NotificationService.levelUp,
    streakMilestone: NotificationService.streakMilestone,
    xpAwardResult: NotificationService.xpAwardResult,
    setPreferences: NotificationService.setPreferences,
    getPreferences: NotificationService.getPreferences,
  };
}

export default NotificationService;
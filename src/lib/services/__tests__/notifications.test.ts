import { NotificationService } from '../notifications';
import { XPAction, Badge, XPAwardResult, BadgeCategory } from '@/types/gamification';

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(() => 'success-id'),
    error: jest.fn(() => 'error-id'),
    warning: jest.fn(() => 'warning-id'),
    info: jest.fn(() => 'info-id'),
    loading: jest.fn(() => 'loading-id'),
    update: jest.fn(),
    dismiss: jest.fn(),
  },
}));

import { toast } from 'react-toastify';

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset preferences to defaults
    NotificationService.setPreferences({
      xpNotifications: true,
      badgeNotifications: true,
      levelUpNotifications: true,
      streakNotifications: true,
      batchNotifications: true,
    });
  });

  describe('success', () => {
    it('should call toast.success with correct parameters', () => {
      const message = 'Success message';
      const result = NotificationService.success(message);

      expect(toast.success).toHaveBeenCalledWith(message, expect.objectContaining({
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }));
      expect(result).toBe('success-id');
    });

    it('should merge custom options', () => {
      const message = 'Success message';
      const customOptions = { autoClose: 3000 };
      
      NotificationService.success(message, customOptions);

      expect(toast.success).toHaveBeenCalledWith(message, expect.objectContaining({
        autoClose: 3000,
      }));
    });
  });

  describe('error', () => {
    it('should call toast.error with longer autoClose duration', () => {
      const message = 'Error message';
      NotificationService.error(message);

      expect(toast.error).toHaveBeenCalledWith(message, expect.objectContaining({
        autoClose: 8000,
      }));
    });
  });

  describe('handleApiError', () => {
    it('should handle Error objects', () => {
      const error = new Error('API error');
      NotificationService.handleApiError(error);

      expect(toast.error).toHaveBeenCalledWith('API error', expect.any(Object));
    });

    it('should handle string errors', () => {
      const error = 'String error';
      NotificationService.handleApiError(error);

      expect(toast.error).toHaveBeenCalledWith('String error', expect.any(Object));
    });

    it('should add context to error message', () => {
      const error = new Error('API error');
      const context = 'Loading reviews';
      NotificationService.handleApiError(error, context);

      expect(toast.error).toHaveBeenCalledWith('Loading reviews: API error', expect.any(Object));
    });

    it('should map network errors to friendly messages', () => {
      const error = new Error('Network error occurred');
      NotificationService.handleApiError(error);

      expect(toast.error).toHaveBeenCalledWith(
        'Network error. Please check your connection and try again.',
        expect.any(Object)
      );
    });

    it('should map 401 errors to friendly messages', () => {
      const error = new Error('Unauthorized access');
      NotificationService.handleApiError(error);

      expect(toast.error).toHaveBeenCalledWith(
        'Your session has expired. Please sign in again.',
        expect.any(Object)
      );
    });

    it('should map server errors to friendly messages', () => {
      const error = new Error('Internal server error');
      NotificationService.handleApiError(error);

      expect(toast.error).toHaveBeenCalledWith(
        'Server error. Please try again later.',
        expect.any(Object)
      );
    });
  });

  describe('retryError', () => {
    it('should render error with retry button', () => {
      const message = 'Operation failed';
      const onRetry = jest.fn();
      
      NotificationService.retryError(message, onRetry);

      expect(toast.error).toHaveBeenCalledWith(
        expect.any(Object), // JSX element
        expect.objectContaining({
          autoClose: false,
          closeOnClick: false,
        })
      );
    });
  });

  describe('connection status', () => {
    it('should show connection lost notification', () => {
      NotificationService.connectionLost();

      expect(toast.warning).toHaveBeenCalledWith(
        'Connection lost. Trying to reconnect...',
        expect.objectContaining({
          autoClose: false,
          toastId: 'connection-lost',
        })
      );
    });

    it('should show connection restored notification', () => {
      NotificationService.connectionRestored();

      expect(toast.dismiss).toHaveBeenCalledWith('connection-lost');
      expect(toast.success).toHaveBeenCalledWith(
        'Connection restored!',
        expect.objectContaining({
          autoClose: 3000,
        })
      );
    });
  });

  describe('sync notifications', () => {
    it('should show sync in progress', () => {
      NotificationService.syncInProgress();

      expect(toast.loading).toHaveBeenCalledWith(
        'Syncing data...',
        expect.objectContaining({
          toastId: 'sync-progress',
        })
      );
    });

    it('should update sync complete', () => {
      NotificationService.syncComplete();

      expect(toast.update).toHaveBeenCalledWith('sync-progress', expect.objectContaining({
        render: 'Data synced successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      }));
    });

    it('should update sync failed', () => {
      const error = 'Sync failed';
      NotificationService.syncFailed(error);

      expect(toast.update).toHaveBeenCalledWith('sync-progress', expect.objectContaining({
        render: error,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      }));
    });
  });

  describe('dismiss methods', () => {
    it('should dismiss specific toast', () => {
      NotificationService.dismiss('test-id');
      expect(toast.dismiss).toHaveBeenCalledWith('test-id');
    });

    it('should dismiss all toasts', () => {
      NotificationService.dismissAll();
      expect(toast.dismiss).toHaveBeenCalledWith();
    });
  });

  describe('notification preferences', () => {
    it('should set and get preferences', () => {
      const newPreferences = {
        xpNotifications: false,
        badgeNotifications: true,
      };

      NotificationService.setPreferences(newPreferences);
      const preferences = NotificationService.getPreferences();

      expect(preferences.xpNotifications).toBe(false);
      expect(preferences.badgeNotifications).toBe(true);
      expect(preferences.levelUpNotifications).toBe(true); // Should remain unchanged
    });
  });

  describe('gamification notifications', () => {
    describe('xpGained', () => {
      it('should show XP gained notification with correct message', () => {
        const result = NotificationService.xpGained(10, XPAction.QUEST_CREATED);

        expect(toast.success).toHaveBeenCalledWith(
          expect.any(Object), // JSX element
          expect.objectContaining({
            autoClose: 3000,
            className: 'xp-notification',
          })
        );
        expect(result).toBe('success-id');
      });

      it('should return null when XP notifications are disabled', () => {
        NotificationService.setPreferences({ xpNotifications: false });
        
        const result = NotificationService.xpGained(10, XPAction.QUEST_CREATED);

        expect(toast.success).not.toHaveBeenCalled();
        expect(result).toBeNull();
      });

      it('should show correct message for different XP actions', () => {
        NotificationService.xpGained(15, XPAction.QUEST_COMPLETED);
        NotificationService.xpGained(20, XPAction.APP_ADDED);
        NotificationService.xpGained(8, XPAction.REVIEW_INTERACTION);

        expect(toast.success).toHaveBeenCalledTimes(3);
      });
    });

    describe('batchedXPGained', () => {
      it('should show batched XP notification with multiple actions', () => {
        const actions = [
          { action: XPAction.QUEST_CREATED, amount: 10 },
          { action: XPAction.QUEST_COMPLETED, amount: 15 },
        ];

        const result = NotificationService.batchedXPGained(25, actions);

        expect(toast.success).toHaveBeenCalledWith(
          expect.any(Object), // JSX element
          expect.objectContaining({
            autoClose: 4000,
            className: 'xp-batch-notification',
          })
        );
        expect(result).toBe('success-id');
      });

      it('should return null when batching is disabled', () => {
        NotificationService.setPreferences({ batchNotifications: false });
        
        const result = NotificationService.batchedXPGained(25, [
          { action: XPAction.QUEST_CREATED, amount: 10 },
        ]);

        expect(toast.success).not.toHaveBeenCalled();
        expect(result).toBeNull();
      });
    });

    describe('addToBatch', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should batch multiple XP gains and show notification after delay', () => {
        NotificationService.addToBatch(10, XPAction.QUEST_CREATED);
        NotificationService.addToBatch(15, XPAction.QUEST_COMPLETED);

        // Should not show notification immediately
        expect(toast.success).not.toHaveBeenCalled();

        // Fast-forward time
        jest.advanceTimersByTime(1000);

        // Should show batched notification
        expect(toast.success).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            className: 'xp-batch-notification',
          })
        );
      });

      it('should show single notification for single action after delay', () => {
        NotificationService.addToBatch(10, XPAction.QUEST_CREATED);

        jest.advanceTimersByTime(1000);

        expect(toast.success).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            className: 'xp-notification',
          })
        );
      });

      it('should show immediate notification when batching is disabled', () => {
        NotificationService.setPreferences({ batchNotifications: false });
        
        NotificationService.addToBatch(10, XPAction.QUEST_CREATED);

        expect(toast.success).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            className: 'xp-notification',
          })
        );
      });
    });

    describe('badgeEarned', () => {
      const mockBadge: Badge = {
        id: 'test-badge',
        name: 'Test Badge',
        description: 'A test badge',
        earnedAt: new Date(),
        category: BadgeCategory.MILESTONE,
      };

      it('should show badge earned notification', () => {
        const result = NotificationService.badgeEarned(mockBadge);

        expect(toast.success).toHaveBeenCalledWith(
          expect.any(Object), // JSX element
          expect.objectContaining({
            autoClose: 6000,
            className: 'badge-notification',
          })
        );
        expect(result).toBe('success-id');
      });

      it('should return null when badge notifications are disabled', () => {
        NotificationService.setPreferences({ badgeNotifications: false });
        
        const result = NotificationService.badgeEarned(mockBadge);

        expect(toast.success).not.toHaveBeenCalled();
        expect(result).toBeNull();
      });
    });

    describe('levelUp', () => {
      it('should show level up notification', () => {
        const result = NotificationService.levelUp(5);

        expect(toast.success).toHaveBeenCalledWith(
          expect.any(Object), // JSX element
          expect.objectContaining({
            autoClose: 7000,
            className: 'level-up-notification',
          })
        );
        expect(result).toBe('success-id');
      });

      it('should return null when level up notifications are disabled', () => {
        NotificationService.setPreferences({ levelUpNotifications: false });
        
        const result = NotificationService.levelUp(5);

        expect(toast.success).not.toHaveBeenCalled();
        expect(result).toBeNull();
      });
    });

    describe('streakMilestone', () => {
      it('should show streak milestone notification', () => {
        const result = NotificationService.streakMilestone(7, 10);

        expect(toast.success).toHaveBeenCalledWith(
          expect.any(Object), // JSX element
          expect.objectContaining({
            autoClose: 5000,
            className: 'streak-notification',
          })
        );
        expect(result).toBe('success-id');
      });

      it('should return null when streak notifications are disabled', () => {
        NotificationService.setPreferences({ streakNotifications: false });
        
        const result = NotificationService.streakMilestone(7, 10);

        expect(toast.success).not.toHaveBeenCalled();
        expect(result).toBeNull();
      });
    });

    describe('xpAwardResult', () => {
      const mockBadge: Badge = {
        id: 'test-badge',
        name: 'Test Badge',
        description: 'A test badge',
        earnedAt: new Date(),
        category: BadgeCategory.MILESTONE,
      };

      it('should show level up notification when user levels up', () => {
        const result: XPAwardResult = {
          xpAwarded: 20,
          totalXP: 250,
          levelUp: true,
          newLevel: 3,
          badgesEarned: [],
        };

        NotificationService.xpAwardResult(result, XPAction.QUEST_COMPLETED);

        // Should show level up notification
        expect(toast.success).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            className: 'level-up-notification',
          })
        );
      });

      it('should show badge notifications for earned badges', () => {
        const result: XPAwardResult = {
          xpAwarded: 20,
          totalXP: 250,
          levelUp: false,
          badgesEarned: [mockBadge],
        };

        NotificationService.xpAwardResult(result, XPAction.QUEST_COMPLETED);

        // Should show badge notification
        expect(toast.success).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            className: 'badge-notification',
          })
        );
      });

      it('should show XP notification when batching is disabled', () => {
        NotificationService.setPreferences({ batchNotifications: false });
        
        const result: XPAwardResult = {
          xpAwarded: 20,
          totalXP: 250,
          levelUp: false,
          badgesEarned: [],
        };

        const xpResult = NotificationService.xpAwardResult(result, XPAction.QUEST_COMPLETED);

        expect(toast.success).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            className: 'xp-notification',
          })
        );
        expect(xpResult).toBe('success-id');
      });

      it('should add to batch when batching is enabled', () => {
        const result: XPAwardResult = {
          xpAwarded: 20,
          totalXP: 250,
          levelUp: false,
          badgesEarned: [],
        };

        const xpResult = NotificationService.xpAwardResult(result, XPAction.QUEST_COMPLETED);

        // Should not show immediate XP notification when batching
        expect(xpResult).toBeNull();
      });

      it('should handle multiple notifications correctly', () => {
        const result: XPAwardResult = {
          xpAwarded: 20,
          totalXP: 250,
          levelUp: true,
          newLevel: 3,
          badgesEarned: [mockBadge],
        };

        NotificationService.xpAwardResult(result, XPAction.QUEST_COMPLETED);

        // Should show both level up and badge notifications
        expect(toast.success).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            className: 'level-up-notification',
          })
        );
        expect(toast.success).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            className: 'badge-notification',
          })
        );
      });
    });
  });
});
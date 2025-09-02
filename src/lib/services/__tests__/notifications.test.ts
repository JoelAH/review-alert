import { NotificationService } from '../notifications';

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
});
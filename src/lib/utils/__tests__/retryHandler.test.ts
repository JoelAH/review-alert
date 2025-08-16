import { AuthError } from 'firebase/auth';
import {
  withRetry,
  withAuthRetry,
  withNetworkRetry,
  checkNetworkConnectivity,
  waitForNetworkConnectivity
} from '../retryHandler';
import { AUTH_ERROR_CODES } from '../authErrorHandler';

// Mock fetch for network connectivity tests
global.fetch = jest.fn();

// Mock Response for tests
global.Response = jest.fn().mockImplementation(() => ({
  ok: true,
  status: 200
})) as any;

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  warn: jest.spyOn(console, 'warn').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
};

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('retryHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
    navigator.onLine = true;
  });

  afterAll(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await withRetry(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const error = new Error('Network error') as AuthError;
      error.code = AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED;
      
      const operation = jest.fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');
      
      const result = await withRetry(operation, { maxAttempts: 3 });
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const error = new Error('Invalid email') as AuthError;
      error.code = AUTH_ERROR_CODES.INVALID_EMAIL;
      
      const operation = jest.fn().mockRejectedValue(error);
      
      await expect(withRetry(operation)).rejects.toThrow('Invalid email');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw retry limit exceeded error after max attempts', async () => {
      const error = new Error('Network error') as AuthError;
      error.code = AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED;
      
      const operation = jest.fn().mockRejectedValue(error);
      
      await expect(withRetry(operation, { maxAttempts: 2 })).rejects.toThrow('Maximum retry attempts exceeded');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should call onRetry callback', async () => {
      const error = new Error('Network error') as AuthError;
      error.code = AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED;
      
      const operation = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');
      
      const onRetry = jest.fn();
      
      await withRetry(operation, { maxAttempts: 2, onRetry });
      
      expect(onRetry).toHaveBeenCalledWith(1, error);
    });

    it('should use custom shouldRetry function', async () => {
      const error = new Error('Custom error');
      const operation = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');
      
      const shouldRetry = jest.fn().mockReturnValue(true);
      
      await withRetry(operation, { maxAttempts: 2, shouldRetry });
      
      expect(shouldRetry).toHaveBeenCalledWith(error);
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should respect custom delay settings', async () => {
      const error = new Error('Network error') as AuthError;
      error.code = AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED;
      
      const operation = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');
      
      const startTime = Date.now();
      await withRetry(operation, { maxAttempts: 2, baseDelay: 100, maxDelay: 100 });
      const endTime = Date.now();
      
      // Should have waited at least 100ms for retry
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });

  describe('withAuthRetry', () => {
    it('should log authentication attempts', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      await withAuthRetry(operation, 'login', 'test@example.com');
      
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry with warning message', async () => {
      const error = new Error('Network error') as AuthError;
      error.code = AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED;
      
      const operation = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');
      
      await withAuthRetry(operation, 'signup', 'test@example.com', { maxAttempts: 2 });
      
      expect(consoleSpy.warn).toHaveBeenCalledWith('Auth operation retry 1:', 'Network error');
    });

    it('should pass custom options to withRetry', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const customOnRetry = jest.fn();
      
      await withAuthRetry(operation, 'login', 'test@example.com', { 
        maxAttempts: 5,
        onRetry: customOnRetry
      });
      
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkNetworkConnectivity', () => {
    it('should return false when navigator.onLine is false', async () => {
      navigator.onLine = false;
      
      const result = await checkNetworkConnectivity();
      
      expect(result).toBe(false);
    });

    it('should return true when fetch succeeds', async () => {
      (fetch as jest.Mock).mockResolvedValue(new Response());
      
      const result = await checkNetworkConnectivity();
      
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache'
      });
    });

    it('should return false when fetch fails', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const result = await checkNetworkConnectivity();
      
      expect(result).toBe(false);
    });

    it('should return false when fetch times out', async () => {
      (fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10000))
      );
      
      const result = await checkNetworkConnectivity();
      
      expect(result).toBe(false);
    }, 10000);
  });

  describe('waitForNetworkConnectivity', () => {
    it('should resolve immediately when connectivity is available', async () => {
      (fetch as jest.Mock).mockResolvedValue(new Response());
      
      const startTime = Date.now();
      const result = await waitForNetworkConnectivity(5000, 1000);
      const endTime = Date.now();
      
      expect(result).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should timeout when connectivity is not restored', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const startTime = Date.now();
      const result = await waitForNetworkConnectivity(1000, 200);
      const endTime = Date.now();
      
      expect(result).toBe(false);
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
    });

    it('should resolve when connectivity is restored during wait', async () => {
      let callCount = 0;
      (fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(new Response());
      });
      
      const result = await waitForNetworkConnectivity(5000, 100);
      
      expect(result).toBe(true);
      expect(callCount).toBeGreaterThan(2);
    }, 10000);
  });

  describe('withNetworkRetry', () => {
    it('should handle network errors with connectivity check', async () => {
      const error = new Error('Network error') as AuthError;
      error.code = AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED;
      
      const operation = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');
      
      // Mock successful connectivity check
      (fetch as jest.Mock).mockResolvedValue(new Response());
      
      const result = await withNetworkRetry(operation, { maxAttempts: 2 });
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
      expect(consoleSpy.log).toHaveBeenCalledWith('Network error detected, checking connectivity...');
    });

    it('should warn when connectivity is not restored', async () => {
      const error = new Error('Network error') as AuthError;
      error.code = AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED;
      
      const operation = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');
      
      // Mock failed connectivity check - simulate network being down
      navigator.onLine = false;
      
      const result = await withNetworkRetry(operation, { maxAttempts: 2 });
      
      expect(result).toBe('success');
      expect(consoleSpy.log).toHaveBeenCalledWith('Network error detected, checking connectivity...');
    }, 15000);

    it('should use custom shouldRetry function for non-network errors', async () => {
      const error = new Error('Custom error');
      const operation = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');
      
      const shouldRetry = jest.fn().mockReturnValue(true);
      
      await withNetworkRetry(operation, { shouldRetry });
      
      expect(shouldRetry).toHaveBeenCalledWith(error);
    });

    it('should call custom onRetry callback', async () => {
      const error = new Error('Network error') as AuthError;
      error.code = AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED;
      
      const operation = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');
      
      const customOnRetry = jest.fn();
      (fetch as jest.Mock).mockResolvedValue(new Response());
      
      await withNetworkRetry(operation, { onRetry: customOnRetry });
      
      expect(customOnRetry).toHaveBeenCalledWith(1, error);
    });
  });
});
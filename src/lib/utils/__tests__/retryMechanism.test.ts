import { RetryMechanism, ApiRetryMechanism, retry, createRetryableFetch } from '../retryMechanism';

// Mock fetch for testing
global.fetch = jest.fn();

describe('RetryMechanism', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('execute', () => {
    it('should return result on first success', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const retryMechanism = new RetryMechanism();

      const result = await retryMechanism.execute(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const retryMechanism = new RetryMechanism({
        maxAttempts: 3,
        initialDelay: 100,
      });

      const resultPromise = retryMechanism.execute(mockFn);

      // Fast-forward through delays
      await jest.advanceTimersByTimeAsync(100);
      await jest.advanceTimersByTimeAsync(200);

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    }, 10000);

    it('should throw error after max attempts', async () => {
      const error = new Error('Persistent error');
      const mockFn = jest.fn().mockRejectedValue(error);
      const onMaxAttemptsReached = jest.fn();

      const retryMechanism = new RetryMechanism({
        maxAttempts: 2,
        initialDelay: 100,
        onMaxAttemptsReached,
      });

      const resultPromise = retryMechanism.execute(mockFn);

      // Fast-forward through delay
      await jest.advanceTimersByTimeAsync(100);

      await expect(resultPromise).rejects.toThrow('Persistent error');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(onMaxAttemptsReached).toHaveBeenCalledWith(error);
    }, 10000);

    it('should not retry if shouldRetry returns false', async () => {
      const error = new Error('Non-retryable error');
      const mockFn = jest.fn().mockRejectedValue(error);

      const retryMechanism = new RetryMechanism({
        shouldRetry: () => false,
      });

      await expect(retryMechanism.execute(mockFn)).rejects.toThrow('Non-retryable error');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      const error = new Error('Network error');
      const mockFn = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const onRetry = jest.fn();

      const retryMechanism = new RetryMechanism({
        initialDelay: 100,
        onRetry,
      });

      const resultPromise = retryMechanism.execute(mockFn);

      // Fast-forward through delay
      await jest.advanceTimersByTimeAsync(100);

      await resultPromise;

      expect(onRetry).toHaveBeenCalledWith(error, 1);
    }, 10000);

    it('should use exponential backoff', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValue('success');

      const retryMechanism = new RetryMechanism({
        initialDelay: 100,
        backoffMultiplier: 2,
        useExponentialBackoff: true,
      });

      const resultPromise = retryMechanism.execute(mockFn);

      // First retry after 100ms
      await jest.advanceTimersByTimeAsync(100);

      // Second retry after 200ms (100 * 2)
      await jest.advanceTimersByTimeAsync(200);

      await resultPromise;
      expect(mockFn).toHaveBeenCalledTimes(3);
    }, 10000);

    it('should respect maxDelay', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValue('success');

      const retryMechanism = new RetryMechanism({
        initialDelay: 1000,
        backoffMultiplier: 10,
        maxDelay: 1500,
        useExponentialBackoff: true,
      });

      const resultPromise = retryMechanism.execute(mockFn);

      // First retry after 1000ms
      await jest.advanceTimersByTimeAsync(1000);

      // Second retry should be capped at maxDelay (1500ms), not 10000ms
      await jest.advanceTimersByTimeAsync(1500);

      await resultPromise;
      expect(mockFn).toHaveBeenCalledTimes(3);
    }, 15000);
  });

  describe('wrap', () => {
    it('should create retryable version of function', async () => {
      const originalFn = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const retryableFn = RetryMechanism.wrap(originalFn, {
        maxAttempts: 2,
        initialDelay: 100,
      });

      const resultPromise = retryableFn('arg1', 'arg2');

      await jest.advanceTimersByTimeAsync(100);

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(originalFn).toHaveBeenCalledTimes(2);
      expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
    }, 10000);
  });
});

describe('ApiRetryMechanism', () => {
  it('should have appropriate defaults for API calls', () => {
    const apiRetry = new ApiRetryMechanism();
    
    // Test that it retries on network errors
    const networkError = new Error('Network error');
    expect(apiRetry['options'].shouldRetry(networkError, 1)).toBe(true);

    // Test that it retries on 5xx errors
    const serverError = { status: 500 };
    expect(apiRetry['options'].shouldRetry(serverError, 1)).toBe(true);

    // Test that it doesn't retry on 4xx errors
    const clientError = { status: 404 };
    expect(apiRetry['options'].shouldRetry(clientError, 1)).toBe(false);
  });
});

describe('retry utility function', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should work as standalone function', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue('success');

    const resultPromise = retry(mockFn, {
      maxAttempts: 2,
      initialDelay: 100,
    });

    await jest.advanceTimersByTimeAsync(100);

    const result = await resultPromise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  }, 10000);
});

describe('createRetryableFetch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should retry failed fetch requests', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ data: 'success' }) };
    
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue(mockResponse);

    const retryableFetch = createRetryableFetch({
      maxAttempts: 2,
      initialDelay: 100,
    });

    const resultPromise = retryableFetch('/api/test');

    await jest.advanceTimersByTimeAsync(100);

    const result = await resultPromise;

    expect(result).toBe(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  }, 10000);

  it('should throw error for non-ok responses', async () => {
    const mockResponse = { 
      ok: false, 
      status: 500, 
      statusText: 'Internal Server Error' 
    };
    
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const retryableFetch = createRetryableFetch({
      maxAttempts: 1,
    });

    await expect(retryableFetch('/api/test')).rejects.toThrow('HTTP 500: Internal Server Error');
  });

  it('should pass through fetch parameters', async () => {
    const mockResponse = { ok: true };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const retryableFetch = createRetryableFetch();
    const init = { method: 'POST', body: 'test' };

    await retryableFetch('/api/test', init);

    expect(global.fetch).toHaveBeenCalledWith('/api/test', init);
  });
});
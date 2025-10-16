/**
 * Fetch utility with timeout and retry logic
 * Provides resilient network requests for better UX
 */

interface FetchWithRetryOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export class FetchTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FetchTimeoutError';
  }
}

export class FetchRetryError extends Error {
  constructor(message: string, public lastError: Error) {
    super(message);
    this.name = 'FetchRetryError';
  }
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new FetchTimeoutError(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Fetch with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    retries = 2,
    retryDelay = 1000,
    onRetry,
    ...fetchOptions
  } = options;

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, fetchOptions);

      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }

      // Return successful responses
      if (response.ok || attempt === retries) {
        return response;
      }

      // Clone response for retry decision
      const clonedResponse = response.clone();
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);

      // Retry on 5xx errors or 429 (rate limit)
      if (response.status >= 500 || response.status === 429) {
        if (attempt < retries) {
          onRetry?.(attempt + 1, lastError);
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          continue;
        }
      }

      return clonedResponse;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on timeout errors from older requests
      if (lastError instanceof FetchTimeoutError && attempt === retries) {
        throw lastError;
      }

      // Retry on network errors
      if (attempt < retries) {
        onRetry?.(attempt + 1, lastError);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }

      throw new FetchRetryError(
        `Failed after ${retries + 1} attempts: ${lastError.message}`,
        lastError
      );
    }
  }

  throw new FetchRetryError(
    `Failed after ${retries + 1} attempts: ${lastError.message}`,
    lastError
  );
}

/**
 * Fetch JSON with retry
 */
export async function fetchJsonWithRetry<T = unknown>(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, options);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

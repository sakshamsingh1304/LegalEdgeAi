/**
 * Fetch wrapper with exponential backoff retry logic.
 * Designed for Render free-tier cold starts (30-60s wake-up time).
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, maxRetries: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxRetries: 3,
  initialDelayMs: 2000,
  maxDelayMs: 15000,
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  const { maxRetries, initialDelayMs, maxDelayMs } = { ...DEFAULT_OPTIONS, ...options };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(input, init);

      // Retry on 502/503/504 (Render returns these during cold start)
      if (response.status >= 502 && response.status <= 504 && attempt < maxRetries) {
        const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);
        console.log(`[Retry] Backend returned ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        options?.onRetry?.(attempt + 1, maxRetries);
        await sleep(delay);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);
        console.log(`[Retry] Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        options?.onRetry?.(attempt + 1, maxRetries);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Failed after retries');
}

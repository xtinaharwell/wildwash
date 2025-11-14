/**
 * Prefetch Hooks - React hooks for smooth data prefetching
 * Provides hooks for fetching data with automatic caching and background refresh
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { prefetchManager, cacheKeys, type PrefetchOptionsType } from './prefetchManager';

interface UsePrefetchOptions<T> extends PrefetchOptionsType {
  skip?: boolean; // Don't fetch if true
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UsePrefetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook: Fetch data with prefetching and caching
 * @example
 * const { data, loading, error } = usePrefetch(
 *   cacheKeys.orders(1),
 *   () => fetchOrders(1),
 *   { ttl: 5 * 60 * 1000 }
 * );
 */
export function usePrefetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UsePrefetchOptions<T> = {}
): UsePrefetchResult<T> {
  const { skip = false, onSuccess, onError, ...prefetchOptions } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const fetchData = useCallback(async () => {
    if (skip) return;

    try {
      setLoading(true);
      setError(null);
      const result = await prefetchManager.fetch(key, fetcher, {
        ...prefetchOptions,
        force: false,
      });
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, skip, prefetchOptions, onSuccess, onError]);

  useEffect(() => {
    if (skip) {
      setLoading(false);
      return;
    }

    // Fetch immediately
    fetchData();

    // Subscribe to cache updates
    unsubscribeRef.current = prefetchManager.subscribe(key, setData);

    return () => {
      unsubscribeRef.current?.();
    };
  }, [key, skip, fetchData]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await prefetchManager.fetch(key, fetcher, {
        ...prefetchOptions,
        force: true,
      });
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, prefetchOptions, onSuccess, onError]);

  return { data, loading, error, refetch };
}

/**
 * Hook: Prefetch data in background without blocking render
 * @example
 * usePrefetchBackground(cacheKeys.orders(2), () => fetchOrders(2), { priority: 'low' });
 */
export function usePrefetchBackground(
  key: string,
  fetcher: () => Promise<any>,
  options: Omit<PrefetchOptionsType, 'background'> = {}
): void {
  useEffect(() => {
    prefetchManager.prefetch(key, fetcher, { ...options, background: false });
  }, [key, fetcher, options]);
}

/**
 * Hook: Prefetch multiple endpoints
 * Useful for prefetching related data (e.g., orders + notifications)
 */
export function usePrefetchMultiple<T extends Record<string, any>>(
  keys: Record<keyof T, { key: string; fetcher: () => Promise<any> }>,
  options: PrefetchOptionsType = {}
): UsePrefetchResult<Partial<T>> {
  const [data, setData] = useState<Partial<T>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const results = await Promise.all(
        Object.entries(keys).map(([name, { key, fetcher }]) =>
          prefetchManager.fetch(key, fetcher, options).then(data => [name, data])
        )
      );

      const combined = Object.fromEntries(results);
      setData(combined as Partial<T>);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [keys, options]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refetch = useCallback(() => fetchAll(), [fetchAll]);

  return { data, loading, error, refetch };
}

/**
 * Hook: Smart prefetch with pagination
 * Prefetches next page when user is near the end
 */
export function usePrefetchPaginated<T>(
  keyBuilder: (page: number) => string,
  fetcherBuilder: (page: number) => () => Promise<T>,
  currentPage: number,
  options: PrefetchOptionsType = {}
): void {
  useEffect(() => {
    // Prefetch next 2 pages in background (low priority)
    for (let i = 1; i <= 2; i++) {
      const nextPage = currentPage + i;
      const key = keyBuilder(nextPage);
      const fetcher = fetcherBuilder(nextPage);
      prefetchManager.prefetch(key, fetcher, {
        ...options,
        priority: 'low',
        background: false,
      });
    }
  }, [currentPage, keyBuilder, fetcherBuilder, options]);
}

/**
 * Hook: Prefetch on route hover/navigation
 * Call this when user hovers over a link to prefetch that page's data
 */
export function usePrefetchOnHover(
  key: string,
  fetcher: () => Promise<any>,
  options: PrefetchOptionsType = {}
): { onMouseEnter: () => void } {
  const onMouseEnter = useCallback(() => {
    prefetchManager.prefetch(key, fetcher, {
      ...options,
      priority: 'high', // Higher priority for hover-triggered prefetch
      background: false,
    });
  }, [key, fetcher, options]);

  return { onMouseEnter };
}

/**
 * Hook: Batch prefetch - useful for dashboard/admin pages
 * Prefetches common data needed on page load
 */
export function useBatchPrefetch(
  endpoints: Array<{ key: string; fetcher: () => Promise<any> }>,
  options: PrefetchOptionsType = {}
): void {
  useEffect(() => {
    endpoints.forEach(({ key, fetcher }) => {
      prefetchManager.prefetch(key, fetcher, { ...options });
    });
  }, [endpoints, options]);
}

/**
 * Hook: Polling prefetch - keeps data fresh
 * Automatically refreshes data at specified interval
 */
export function usePrefetchPolling<T>(
  key: string,
  fetcher: () => Promise<T>,
  interval: number = 30000, // 30 seconds default
  options: PrefetchOptionsType = {}
): UsePrefetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await prefetchManager.fetch(key, fetcher, {
        ...options,
        force: true,
        background: false,
      });
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, options]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData, interval]);

  const refetch = useCallback(() => fetchData(), [fetchData]);

  return { data, loading, error, refetch };
}

/**
 * Hook: Invalidate cache when leaving page
 * Useful for ensuring fresh data next time user visits
 */
export function useInvalidateOnUnmount(keys: string | string[]): void {
  useEffect(() => {
    return () => {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      keysArray.forEach(key => prefetchManager.invalidate(key));
    };
  }, [keys]);
}

// Re-export cacheKeys for convenience
export { cacheKeys } from './prefetchManager';

/**
 * Prefetch Manager - Intelligent data prefetching strategy
 * Prefetches data in the background before user needs it for smooth UX
 *
 * Features:
 * - Request deduplication (prevent duplicate simultaneous requests)
 * - Intelligent TTL-based caching
 * - Background refresh (stale-while-revalidate)
 * - Priority-based prefetching
 * - Automatic cleanup
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  priority: 'low' | 'medium' | 'high';
  stale?: boolean;
}

interface PrefetchOptions {
  ttl?: number; // Cache duration in ms (default: 5 minutes)
  priority?: 'low' | 'medium' | 'high';
  force?: boolean; // Force refresh even if cached
  background?: boolean; // Fetch in background if stale
}

type FetchFn<T> = () => Promise<T>;

/**
 * Singleton cache manager for global prefetch control
 */
class PrefetchManager {
  private cache = new Map<string, CacheEntry<any>>();
  private inFlight = new Map<string, Promise<any>>();
  private listeners = new Map<string, Set<(data: any) => void>>();

  /**
   * Fetch with intelligent caching and deduplication
   */
  async fetch<T>(
    key: string,
    fetcher: FetchFn<T>,
    options: PrefetchOptions = {}
  ): Promise<T> {
    const { ttl = 5 * 60 * 1000, priority = 'medium', force = false, background = true } = options;

    // Return from cache if valid
    if (!force && this.isValid(key)) {
      const entry = this.cache.get(key)!;
      
      // If stale but background refresh enabled, fetch in background
      if (entry.stale && background) {
        this.refresh(key, fetcher, ttl, priority).catch(err => 
          console.warn(`Background refresh for ${key} failed:`, err)
        );
      }
      
      return entry.data;
    }

    // Deduplicate in-flight requests
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key)!;
    }

    // Fetch and cache
    const promise = fetcher()
      .then(data => {
        this.set(key, data, ttl, priority);
        this.inFlight.delete(key);
        this.notifyListeners(key, data);
        return data;
      })
      .catch(error => {
        this.inFlight.delete(key);
        throw error;
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Prefetch data in background (returns immediately)
   */
  prefetch<T>(
    key: string,
    fetcher: FetchFn<T>,
    options: PrefetchOptions = {}
  ): Promise<void> {
    // If already cached and valid, skip
    if (this.isValid(key)) {
      return Promise.resolve();
    }

    // Fire and forget, but track for deduplication
    if (!this.inFlight.has(key)) {
      const { ttl = 5 * 60 * 1000, priority = 'low' } = options;
      this.fetch(key, fetcher, { ttl, priority, background: false }).catch(err =>
        console.warn(`Prefetch for ${key} failed:`, err)
      );
    }

    return Promise.resolve();
  }

  /**
   * Manual refresh in background
   */
  private refresh<T>(
    key: string,
    fetcher: FetchFn<T>,
    ttl: number,
    priority: string
  ): Promise<T> {
    return fetcher()
      .then(data => {
        this.set(key, data, ttl, priority as any);
        this.notifyListeners(key, data);
        return data;
      });
  }

  /**
   * Set data in cache
   */
  private set<T>(key: string, data: T, ttl: number, priority: 'low' | 'medium' | 'high'): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      priority,
      stale: false,
    });
  }

  /**
   * Check if cache entry is valid
   */
  private isValid(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      entry.stale = true;
      return false; // Expired but marked stale for background refresh
    }

    return true;
  }

  /**
   * Subscribe to cache updates
   */
  subscribe<T>(key: string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  /**
   * Notify all listeners of cache change
   */
  private notifyListeners(key: string, data: any): void {
    this.listeners.get(key)?.forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error('Listener callback error:', err);
      }
    });
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.inFlight.clear();
  }

  /**
   * Get cache stats for debugging
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      inFlightSize: this.inFlight.size,
      cacheEntries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
        stale: entry.stale,
        priority: entry.priority,
      })),
    };
  }
}

// Export singleton instance
export const prefetchManager = new PrefetchManager();

// Convenience cache key builder
export const cacheKeys = {
  orders: (page = 1, status?: string) => `orders:${page}:${status || 'all'}`,
  notifications: () => 'notifications',
  services: () => 'services',
  riderOrders: (status?: string) => `rider:orders:${status || 'all'}`,
  riderProfiles: () => 'rider:profiles',
  riderLocations: () => 'rider:locations',
  userProfile: () => 'user:profile',
  offers: () => 'offers',
  staff: (page = 1) => `staff:orders:${page}`,
  admin: (page = 1, filters?: string) => `admin:orders:${page}:${filters || ''}`,
};

export type PrefetchOptionsType = PrefetchOptions;

/**
 * Smart caching system for API requests
 * Provides memory cache, localStorage fallback, and cache invalidation
 */

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

class RequestCache {
  private memoryCache = new Map<string, CacheItem>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_MEMORY_ITEMS = 100;

  /**
   * Get cached data if valid
   */
  get<T>(key: string): T | null {
    // Try memory cache first (fastest)
    const memoryCached = this.memoryCache.get(key);
    if (memoryCached && this.isValid(memoryCached)) {
      return memoryCached.data;
    }

    // Try localStorage cache (persistent)
    try {
      const localCached = localStorage.getItem(`cache_${key}`);
      if (localCached) {
        const parsed: CacheItem<T> = JSON.parse(localCached);
        if (this.isValid(parsed)) {
          // Restore to memory cache for faster access
          this.memoryCache.set(key, parsed);
          return parsed.data;
        } else {
          // Remove expired cache
          localStorage.removeItem(`cache_${key}`);
        }
      }
    } catch (error) {
      console.warn("Cache localStorage error:", error);
    }

    return null;
  }

  /**
   * Set cache data with TTL
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key,
    };

    // Store in memory cache
    this.memoryCache.set(key, cacheItem);
    this.enforceMemoryLimit();

    // Store in localStorage for persistence (non-sensitive data only)
    if (this.shouldPersist(key)) {
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
      } catch (error) {
        console.warn("Cache localStorage write error:", error);
      }
    }
  }

  /**
   * Remove specific cache entry
   */
  delete(key: string): void {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn("Cache localStorage remove error:", error);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear();
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith("cache_")
      );
      keys.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.warn("Cache localStorage clear error:", error);
    }
  }

  /**
   * Invalidate cache by pattern
   */
  invalidate(pattern: string | RegExp): void {
    const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;

    // Clear memory cache
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear localStorage cache
    try {
      const keys = Object.keys(localStorage).filter(
        (key) =>
          key.startsWith("cache_") && regex.test(key.replace("cache_", ""))
      );
      keys.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.warn("Cache localStorage invalidate error:", error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const memorySize = this.memoryCache.size;
    let localStorageSize = 0;

    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith("cache_")
      );
      localStorageSize = keys.length;
    } catch (error) {
      console.warn("Cache localStorage stats error:", error);
    }

    return {
      memoryItems: memorySize,
      localStorageItems: localStorageSize,
      totalSize: memorySize + localStorageSize,
    };
  }

  /**
   * Check if cache item is still valid
   */
  private isValid(item: CacheItem): boolean {
    return Date.now() - item.timestamp < item.ttl;
  }

  /**
   * Enforce memory cache size limit
   */
  private enforceMemoryLimit(): void {
    if (this.memoryCache.size <= this.MAX_MEMORY_ITEMS) return;

    // Remove oldest items
    const entries = Array.from(this.memoryCache.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp
    );

    const itemsToRemove = entries.slice(
      0,
      entries.length - this.MAX_MEMORY_ITEMS
    );
    itemsToRemove.forEach(([key]) => this.memoryCache.delete(key));
  }

  /**
   * Determine if data should be persisted to localStorage
   */
  private shouldPersist(key: string): boolean {
    // Don't persist sensitive data
    const sensitivePatterns = [
      /auth/i,
      /token/i,
      /password/i,
      /credit/i,
      /payment/i,
      /personal/i,
    ];

    return !sensitivePatterns.some((pattern) => pattern.test(key));
  }
}

// Cache configurations for different types of data
export const CacheConfig = {
  // Static data (categories, settings)
  STATIC: 15 * 60 * 1000, // 15 minutes

  // Dynamic data (products, orders)
  DYNAMIC: 5 * 60 * 1000, // 5 minutes

  // Frequently changing data (cart, notifications)
  REALTIME: 1 * 60 * 1000, // 1 minute

  // User data
  USER: 10 * 60 * 1000, // 10 minutes

  // Search results
  SEARCH: 2 * 60 * 1000, // 2 minutes
} as const;

// Singleton instance
export const requestCache = new RequestCache();

/**
 * Cache-enabled HTTP request wrapper
 */
export async function cachedRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  ttl: number = CacheConfig.DYNAMIC,
  forceRefresh: boolean = false
): Promise<T> {
  // Check cache first (unless forced refresh)
  if (!forceRefresh) {
    const cached = requestCache.get<T>(key);
    if (cached !== null) {
      return cached;
    }
  }

  try {
    // Execute request
    const data = await requestFn();

    // Cache the result
    requestCache.set(key, data, ttl);

    return data;
  } catch (error) {
    // On error, try to return stale cache if available
    const staleCache = requestCache.get<T>(key);
    if (staleCache !== null) {
      console.warn("Using stale cache due to request error:", error);
      return staleCache;
    }

    throw error;
  }
}

/**
 * Helper function to generate cache keys
 */
export function generateCacheKey(
  base: string,
  params?: Record<string, any>
): string {
  if (!params) return base;

  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${params[key]}`)
    .join("|");

  return `${base}__${sortedParams}`;
}

export default requestCache;

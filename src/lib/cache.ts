// Simple in-memory cache with TTL (Time To Live)

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache: Map<string, CacheItem<any>> = new Map();

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Get remaining TTL in seconds
  getTTL(key: string): number {
    const item = this.cache.get(key);
    if (!item) return 0;
    
    const remaining = item.ttl - (Date.now() - item.timestamp);
    return Math.max(0, Math.floor(remaining / 1000));
  }
}

// Create singleton instance
export const cache = new SimpleCache();

// Cache keys constants
export const CACHE_KEYS = {
  DASHBOARD_DATA: 'dashboard_data',
  USER_EVENTS: 'user_events',
  USER_JOBS: 'user_jobs',
  USER_DONATIONS: 'user_donations',
  USER_CONNECTIONS: 'user_connections',
  ALUMNI_LIST: 'alumni_list',
} as const;

// Default TTL values in seconds
export const CACHE_TTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 900,        // 15 minutes
  VERY_LONG: 3600,  // 1 hour
} as const;

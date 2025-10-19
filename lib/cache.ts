// Persistent cache using localStorage that survives page refreshes
class PageCache {
  private readonly storagePrefix = 'prison_portal_cache_';
  private memoryCache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  set(key: string, data: unknown, ttlSeconds: number = 300) {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    };

    // Store in memory cache
    this.memoryCache.set(key, cacheItem);

    // Also persist to localStorage if available
    if (this.isLocalStorageAvailable()) {
      try {
        const storageKey = this.storagePrefix + key;
        localStorage.setItem(storageKey, JSON.stringify(cacheItem));
      } catch (error) {
        // If localStorage is full or unavailable, just use memory cache
        console.warn('Failed to write to localStorage:', error);
      }
    }
  }

  get(key: string): unknown {
    const now = Date.now();

    // Try memory cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem) {
      if (now - memoryItem.timestamp > memoryItem.ttl) {
        this.delete(key);
        return null;
      }
      return memoryItem.data;
    }

    // Fall back to localStorage
    if (this.isLocalStorageAvailable()) {
      try {
        const storageKey = this.storagePrefix + key;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const item = JSON.parse(stored) as { data: unknown; timestamp: number; ttl: number };

          // Check if expired
          if (now - item.timestamp > item.ttl) {
            this.delete(key);
            return null;
          }

          // Restore to memory cache for faster subsequent access
          this.memoryCache.set(key, item);
          return item.data;
        }
      } catch (error) {
        console.warn('Failed to read from localStorage:', error);
        return null;
      }
    }

    return null;
  }

  clear() {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear all items from localStorage with our prefix
    if (this.isLocalStorageAvailable()) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.storagePrefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
    }
  }

  delete(key: string) {
    // Delete from memory cache
    this.memoryCache.delete(key);

    // Delete from localStorage
    if (this.isLocalStorageAvailable()) {
      try {
        const storageKey = this.storagePrefix + key;
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn('Failed to delete from localStorage:', error);
      }
    }
  }

  // Clean up expired items from localStorage (call this periodically if needed)
  cleanupExpired() {
    if (!this.isLocalStorageAvailable()) return;

    try {
      const now = Date.now();
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey && storageKey.startsWith(this.storagePrefix)) {
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            const item = JSON.parse(stored) as { data: unknown; timestamp: number; ttl: number };
            if (now - item.timestamp > item.ttl) {
              keysToRemove.push(storageKey);
            }
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`Cleaned up ${keysToRemove.length} expired cache items`);
    } catch (error) {
      console.warn('Failed to cleanup localStorage:', error);
    }
  }
}

export const pageCache = new PageCache();

// Clean up expired cache items when the module loads
if (typeof window !== 'undefined') {
  pageCache.cleanupExpired();
}

import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CACHE_KEYS } from '../config/redis.config';

type CacheStoreIteratorEntry = [string, unknown];

interface CacheStoreWithIterator {
  iterator?: () => AsyncIterable<CacheStoreIteratorEntry>;
}

interface CacheManagerWithStores {
  stores?: unknown[];
}

const isCacheStoreWithIterator = (
  value: unknown,
): value is CacheStoreWithIterator =>
  typeof value === 'object' &&
  value !== null &&
  'iterator' in value &&
  typeof (value as { iterator?: unknown }).iterator === 'function';

/**
 * Redis Cache Service
 * Cung cấp các methods để quản lý cache với Upstash Redis
 * - get, set, delete
 * - getOrFetch (cache-aside pattern)
 * - invalidate patterns
 * - statistics
 */
@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Lấy giá trị từ cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      console.warn(`Cache GET error for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Lưu giá trị vào cache với TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      console.warn(`Cache SET error for key ${key}:`, error);
    }
  }

  /**
   * Lấy hoặc fetch nếu không có trong cache (cache-aside pattern)
   * Ideal cho expensive queries
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined && cached !== null) {
      return cached;
    }

    const data = await fetcher();
    await this.set(key, data, ttl);
    return data;
  }

  /**
   * Xóa một cache key
   */
  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      console.warn(`Cache DELETE error for key ${key}:`, error);
    }
  }

  /**
   * Xóa multiple keys cùng lúc
   */
  async deleteMany(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map((key) => this.cacheManager.del(key)));
    } catch (error) {
      console.warn(`Cache DELETE MANY error:`, error);
    }
  }

  /**
   * Invalidate cache theo pattern (prefix)
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      // cache-manager v7 không expose trực tiếp Redis client.
      // Best-effort: iterate keys nếu underlying store hỗ trợ iterator().
      const manager = this.cacheManager as unknown as CacheManagerWithStores;
      const stores = Array.isArray(manager.stores) ? manager.stores : [];

      let deleted = 0;
      for (const store of stores) {
        if (!isCacheStoreWithIterator(store) || !store.iterator) {
          continue;
        }

        for await (const [key] of store.iterator()) {
          if (typeof key === 'string' && key.startsWith(pattern)) {
            await this.cacheManager.del(key);
            deleted += 1;
          }
        }
      }

      return deleted;
    } catch (error) {
      console.warn(`Cache INVALIDATE PATTERN error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Clear toàn bộ cache
   * ⚠️ Sử dụng cẩn thận - sẽ ảnh hưởng tới performance
   */
  async clear(): Promise<void> {
    try {
      await this.cacheManager.clear();
    } catch (error) {
      console.warn(`Cache CLEAR error:`, error);
    }
  }

  /**
   * Increment counter (sử dụng cho rate limiting, counters)
   */
  async increment(key: string, value: number = 1): Promise<number> {
    try {
      const current = (await this.get<number>(key)) ?? 0;
      const updated = current + value;
      await this.set(key, updated, 60);
      return updated;
    } catch (error) {
      console.warn(`Cache INCREMENT error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Decrement counter
   */
  async decrement(key: string, value: number = 1): Promise<number> {
    try {
      const current = (await this.get<number>(key)) ?? 0;
      const updated = Math.max(0, current - value);
      await this.set(key, updated, 60);
      return updated;
    } catch (error) {
      console.warn(`Cache DECREMENT error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): Promise<{
    connected: boolean;
    info?: string;
  }> {
    try {
      const manager = this.cacheManager as unknown as CacheManagerWithStores;
      const stores = Array.isArray(manager.stores) ? manager.stores : [];
      return Promise.resolve({
        connected: stores.length > 0,
        info: `stores=${stores.length}`,
      });
    } catch {
      return Promise.resolve({ connected: false });
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testKey = '__health_check__';
      await this.set(testKey, true, 10);
      const result = await this.get<boolean>(testKey);
      await this.delete(testKey);
      return result === true;
    } catch {
      return false;
    }
  }
}

/**
 * Helper function để tạo composite cache key
 * Giúp tránh collision và dễ tracking
 */
export function createCacheKey(
  prefix: string,
  ...parts: (string | number)[]
): string {
  return `${prefix}${parts.join(':')}`;
}

/**
 * Helper function để tạo search cache key
 */
export function createSearchCacheKey(
  keyword: string,
  filters?: Record<string, unknown>,
  sort?: string,
): string {
  const parts = [CACHE_KEYS.SEARCH, keyword];

  if (filters && Object.keys(filters).length > 0) {
    const filterStr = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${String(v)}`)
      .join('|');
    parts.push(filterStr);
  }

  if (sort) {
    parts.push(`sort:${sort}`);
  }

  return parts.join(':');
}

/**
 * Helper function để invalidate tất cả search caches
 */
export async function invalidateSearchCache(
  cacheService: CacheService,
): Promise<void> {
  await cacheService.invalidatePattern(CACHE_KEYS.SEARCH);
}

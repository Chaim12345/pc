import Redis from 'ioredis';
import { logger } from '../utils/logger';

class CacheService {
  private client: Redis | null = null;
  private isEnabled: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = new Redis(redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.client.on('connect', () => {
        this.isEnabled = true;
        logger.log('Redis connected successfully');
      });

      this.client.on('error', (error) => {
        this.isEnabled = false;
        logger.error('Redis connection error:', error);
      });

      // Test connection
      await this.client.ping();
      this.isEnabled = true;
    } catch (error) {
      logger.warn('Redis not available, caching disabled:', error);
      this.isEnabled = false;
      this.client = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled || !this.client) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      if (data) {
        return JSON.parse(data) as T;
      }
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async delPattern(pattern: string): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return false;
    }
  }

  async invalidateBoard(boardId: string): Promise<void> {
    await Promise.all([
      this.delPattern(`board:${boardId}*`),
      this.delPattern(`boards:*`),
      this.delPattern(`items:board:${boardId}*`),
    ]);
  }

  async invalidateItem(itemId: string): Promise<void> {
    await Promise.all([
      this.delPattern(`item:${itemId}*`),
      this.delPattern(`items:*`),
      this.delPattern(`comments:item:${itemId}*`),
    ]);
  }

  async invalidateUser(userId: string): Promise<void> {
    await Promise.all([
      this.delPattern(`user:${userId}*`),
      this.delPattern(`users:*`),
    ]);
  }

  isConnected(): boolean {
    return this.isEnabled && this.client !== null;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isEnabled = false;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();


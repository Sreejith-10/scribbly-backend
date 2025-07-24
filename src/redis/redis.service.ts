import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redisClient: Redis;
  private logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB'),
      maxRetriesPerRequest: 10,
      connectTimeout: 5000,
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Connected to redis');
    });

    this.redisClient.on('error', (error) => {
      this.logger.error('Redis error', error);
    });
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.redisClient.setex(key, ttl, serialized);
    } else {
      await this.redisClient.set(key, serialized);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async sAdd(key: string, member: string): Promise<void> {
    await this.redisClient.sadd(key, member);
  }

  async sRem(key: string, member: string): Promise<void> {
    await this.redisClient.srem(key, member);
  }

  async sMembers(key: string): Promise<string[]> {
    return this.redisClient.smembers(key);
  }

  async pushToList(key: string, value: any, maxLength = 100): Promise<void> {
    await this.redisClient.lpush(key, JSON.stringify(value));
    if (maxLength) {
      await this.redisClient.ltrim(key, 0, maxLength - 1);
    }
  }

  async getList(key: string, start = 0, end = -1): Promise<any[]> {
    const items = await this.redisClient.lrange(key, start, end);
    return items.map((item) => JSON.parse(item));
  }

  async acquireLock(key: string, ttl: number): Promise<boolean> {
    const result = await this.redisClient.set(key, 'LOCKED', 'PX', ttl, 'NX');
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async publish(channel: string, message: string) {
    return this.redisClient.publish(channel, message);
  }

  async subscribe(channel: string | string[]) {
    return this.redisClient.subscribe(...channel);
  }
}

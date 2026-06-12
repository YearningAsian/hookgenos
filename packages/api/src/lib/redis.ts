import Redis from 'ioredis';

let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
  redis.on('error', (err) => console.warn('Redis error:', err.message));
}

export { redis };

export async function getCached<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  if (!redis) return fetcher();
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;
  const fresh = await fetcher();
  await redis.setex(key, ttlSeconds, JSON.stringify(fresh));
  return fresh;
}

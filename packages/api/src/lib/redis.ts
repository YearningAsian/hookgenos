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

// Bounded in-memory fallback set for idempotency when Redis is not configured.
// Single-instance only — for multi-instance deployments set REDIS_URL.
const seenEvents = new Set<string>();
const SEEN_EVENTS_MAX = 5000;

/**
 * Atomically claim a one-time key. Returns true the first time the key is seen
 * (caller should process), false on every subsequent call within the TTL
 * (caller should skip — the event was already handled).
 *
 * Used to make Stripe webhook handling idempotent against provider retries.
 */
export async function claimOnce(key: string, ttlSeconds: number): Promise<boolean> {
  if (redis) {
    // SET key NX EX ttl — returns 'OK' only if the key did not already exist.
    const res = await redis.set(key, '1', 'EX', ttlSeconds, 'NX');
    return res === 'OK';
  }
  if (seenEvents.has(key)) return false;
  if (seenEvents.size >= SEEN_EVENTS_MAX) {
    // Drop oldest-ish entry to bound memory (Set preserves insertion order).
    const first = seenEvents.values().next().value;
    if (first !== undefined) seenEvents.delete(first);
  }
  seenEvents.add(key);
  return true;
}

/**
 * Release a previously-claimed one-time key so it can be claimed again.
 * Used when webhook side effects fail and a provider retry must be allowed.
 */
export async function releaseClaim(key: string): Promise<void> {
  if (redis) {
    await redis.del(key);
    return;
  }
  seenEvents.delete(key);
}

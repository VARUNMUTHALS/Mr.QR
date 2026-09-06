import { Redis } from "@upstash/redis";

export interface DestinationCachePayload {
  qrId: string;
  organizationId: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  destinationUrl: string;
  version: number;
}

// In-memory fallback LRU cache for local dev / graceful degradation
const memoryCache = new Map<
  string,
  { data: DestinationCachePayload; expiresAt: number }
>();

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function getCachedDestination(
  shortCode: string
): Promise<DestinationCachePayload | null> {
  const redis = getRedisClient();
  const cacheKey = `qr:destination:${shortCode}`;

  if (redis) {
    try {
      const data = await redis.get<DestinationCachePayload>(cacheKey);
      if (data) return data;
    } catch {
      // Degrade to memory cache on Redis network failure
    }
  }

  // Memory cache fallback
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    if (cached.expiresAt > Date.now()) {
      return cached.data;
    }
    memoryCache.delete(cacheKey);
  }

  return null;
}

export async function setCachedDestination(
  shortCode: string,
  payload: DestinationCachePayload,
  ttlSeconds = 600 // 10 minutes default
): Promise<void> {
  const redis = getRedisClient();
  const cacheKey = `qr:destination:${shortCode}`;

  if (redis) {
    try {
      await redis.set(cacheKey, payload, { ex: ttlSeconds });
      return;
    } catch {
      // Fallback to memory cache
    }
  }

  memoryCache.set(cacheKey, {
    data: payload,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function invalidateCachedDestination(
  shortCode: string
): Promise<void> {
  const redis = getRedisClient();
  const cacheKey = `qr:destination:${shortCode}`;

  if (redis) {
    try {
      await redis.del(cacheKey);
    } catch {}
  }

  memoryCache.delete(cacheKey);
}

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// 1. QR Redirect Limiter: High burst tolerance (120 requests per 60 seconds per IP)
const redirectLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, "60 s"),
      analytics: true,
      prefix: "ratelimit:redirect",
    })
  : null;

// 2. QR Creation Limiter: Low rate (30 creations per hour per organization)
const creationLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 h"),
      analytics: true,
      prefix: "ratelimit:create",
    })
  : null;

// Memory fallback counters for dev / fallback
const memCounters = new Map<string, { count: number; resetAt: number }>();

function checkMemoryLimit(
  key: string,
  max: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = memCounters.get(key);

  if (!entry || entry.resetAt <= now) {
    memCounters.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: max - 1 };
  }

  if (entry.count >= max) {
    return { success: false, remaining: 0 };
  }

  entry.count += 1;
  return { success: true, remaining: max - entry.count };
}

export async function checkRedirectRateLimit(
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  if (redirectLimiter) {
    try {
      const res = await redirectLimiter.limit(identifier);
      return { success: res.success, remaining: res.remaining };
    } catch {
      // Degrade gracefully to in-memory counter
    }
  }

  return checkMemoryLimit(`redirect:${identifier}`, 120, 60_000);
}

export async function checkCreationRateLimit(
  orgId: string
): Promise<{ success: boolean; remaining: number }> {
  if (creationLimiter) {
    try {
      const res = await creationLimiter.limit(orgId);
      return { success: res.success, remaining: res.remaining };
    } catch {}
  }

  return checkMemoryLimit(`create:${orgId}`, 30, 3600_000);
}

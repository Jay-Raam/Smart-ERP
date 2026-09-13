import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/database';

// In-memory sliding window fallback store
const inMemoryStore = new Map<string, number[]>();

export function createSlidingWindowRateLimiter(options: { windowSeconds: number; maxRequests: number }) {
  return async function rateLimiter(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.tenant?.id || 'anonymous';
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `ratelimit:${tenantId}:${clientIp}`;

    const now = Date.now();
    const windowStart = now - options.windowSeconds * 1000;

    let currentCount = 0;

    if (redisClient.status === 'ready') {
      try {
        const multi = redisClient.multi();
        // 1. Remove old requests outside the sliding window
        multi.zremrangebyscore(key, 0, windowStart);
        // 2. Count requests in current window
        multi.zcard(key);
        // 3. Add current timestamp
        multi.zadd(key, now, `${now}-${Math.random()}`);
        // 4. Set TTL on key
        multi.expire(key, options.windowSeconds);

        const results = await multi.exec();
        currentCount = (results?.[1]?.[1] as number) || 0;
      } catch (err) {
        // Fallback to in-memory
        currentCount = handleInMemoryLimiter(key, now, windowStart);
      }
    } else {
      currentCount = handleInMemoryLimiter(key, now, windowStart);
    }

    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - currentCount));

    if (currentCount >= options.maxRequests) {
      return res.status(429).json({
        error: 'TOO_MANY_REQUESTS',
        message: `Rate limit of ${options.maxRequests} requests per ${options.windowSeconds}s exceeded.`,
      });
    }

    next();
  };
}

function handleInMemoryLimiter(key: string, now: number, windowStart: number): number {
  const timestamps = inMemoryStore.get(key) || [];
  const validTimestamps = timestamps.filter((t) => t > windowStart);
  validTimestamps.push(now);
  inMemoryStore.set(key, validTimestamps);
  return validTimestamps.length;
}

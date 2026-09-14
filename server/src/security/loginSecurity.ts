import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { LoginLockout } from '../models/ErpModels';

export const GENERIC_AUTH_ERROR = 'These credentials could not be verified.';
export const LOCKOUT_ERROR = 'Too many login attempts. Please try again later.';

// Security Configuration
export const LOCKOUT_DURATION_MS = 20 * 60 * 1000; // 20 minutes
export const MAX_CONSECUTIVE_FAILED_ATTEMPTS = 3; // > 3 consecutive failures (4th failure triggers lockout)
export const IP_MAX_FAILED_ATTEMPTS = 15; // Max global failed attempts per IP within window

// Pre-computed valid bcrypt hash for constant-time dummy verification when user is unknown
const DUMMY_BCRYPT_HASH = '$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5V8L.EreS95j6xJ0e4.3jFfBqBv2S';

// Local high-speed memory cache for active lockouts
interface MemoryLockoutEntry {
  failedAttempts: number;
  lockedUntil: number | null; // epoch ms
  lastAttemptAt: number;
}

const memoryLockoutCache = new Map<string, MemoryLockoutEntry>();

/**
 * Normalizes identifier (email / mobile) to prevent casing/whitespace bypasses
 */
export function normalizeIdentifier(identifier: string): string {
  return String(identifier || '').trim().toLowerCase();
}

/**
 * Extracts and sanitizes client IP from request headers or socket
 */
export function extractClientIp(req: any): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) {
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0]?.trim();
    if (ip) return ip;
  }
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
}

/**
 * Runs a dummy bcrypt comparison so request processing duration is uniform
 * regardless of whether the account exists in the database or not.
 */
export async function constantTimeDummyCompare(password: string): Promise<void> {
  try {
    await bcrypt.compare(password || '', DUMMY_BCRYPT_HASH);
  } catch {
    // Ignore dummy failure
  }
}

/**
 * Checks if the identifier or IP is currently locked out.
 * Enforces 20-minute lockout using server-side time (Date.now()).
 */
export async function checkLoginLockout(
  identifier: string,
  ipAddress: string
): Promise<{ isLocked: boolean; reason?: string }> {
  const cleanId = normalizeIdentifier(identifier);
  const now = Date.now();

  const idKey = `id:${cleanId}`;
  const ipKey = `ip:${ipAddress}`;

  // 1. Check in-memory fast cache first
  const cachedId = memoryLockoutCache.get(idKey);
  if (cachedId && cachedId.lockedUntil && cachedId.lockedUntil > now) {
    return { isLocked: true, reason: LOCKOUT_ERROR };
  }

  const cachedIp = memoryLockoutCache.get(ipKey);
  if (cachedIp && cachedIp.lockedUntil && cachedIp.lockedUntil > now) {
    return { isLocked: true, reason: LOCKOUT_ERROR };
  }

  // 2. Query persistent MongoDB storage for cluster/restart resilience if connected
  if (mongoose.connection.readyState === 1) {
    try {
      const lockouts = await LoginLockout.find({
        key: { $in: [idKey, ipKey] },
        lockedUntil: { $gt: new Date(now) },
      });

      if (lockouts && lockouts.length > 0) {
        // Sync into memory cache
        for (const item of lockouts) {
          memoryLockoutCache.set(item.key, {
            failedAttempts: item.failedAttempts,
            lockedUntil: item.lockedUntil ? item.lockedUntil.getTime() : null,
            lastAttemptAt: item.lastAttemptAt.getTime(),
          });
        }
        return { isLocked: true, reason: LOCKOUT_ERROR };
      }
    } catch (err) {
      // If DB is temporarily unavailable, fall back safely to memory cache
      console.error('[SECURITY] Error querying LoginLockout in DB:', err);
    }
  }

  return { isLocked: false };
}

/**
 * Records a failed authentication attempt for both the normalized identifier and client IP.
 * Enforces threshold (> 3 consecutive failures locks for 20 minutes).
 */
export async function recordFailedAttempt(
  identifier: string,
  ipAddress: string,
  internalReason: string
): Promise<{ isLocked: boolean }> {
  const cleanId = normalizeIdentifier(identifier);
  const now = Date.now();
  const nowServerDate = new Date(now);

  const idKey = `id:${cleanId}`;
  const ipKey = `ip:${ipAddress}`;

  // --- Process Identifier Lockout ---
  let idRecord = memoryLockoutCache.get(idKey);
  if (!idRecord || (idRecord.lockedUntil && idRecord.lockedUntil <= now)) {
    // Expired or new: reset
    idRecord = { failedAttempts: 0, lockedUntil: null, lastAttemptAt: now };
  } else if (now - idRecord.lastAttemptAt > LOCKOUT_DURATION_MS && !idRecord.lockedUntil) {
    // Reset consecutive window if last attempt was older than lockout window
    idRecord.failedAttempts = 0;
  }

  idRecord.failedAttempts += 1;
  idRecord.lastAttemptAt = now;

  let identifierLocked = false;
  // Rule: After more than 3 consecutive failed login attempts (> 3, i.e. 4th failure), lock for 20 mins
  if (idRecord.failedAttempts > MAX_CONSECUTIVE_FAILED_ATTEMPTS) {
    idRecord.lockedUntil = now + LOCKOUT_DURATION_MS;
    identifierLocked = true;
  }
  memoryLockoutCache.set(idKey, idRecord);

  // --- Process IP Lockout ---
  let ipRecord = memoryLockoutCache.get(ipKey);
  if (!ipRecord || (ipRecord.lockedUntil && ipRecord.lockedUntil <= now)) {
    ipRecord = { failedAttempts: 0, lockedUntil: null, lastAttemptAt: now };
  } else if (now - ipRecord.lastAttemptAt > LOCKOUT_DURATION_MS && !ipRecord.lockedUntil) {
    ipRecord.failedAttempts = 0;
  }

  ipRecord.failedAttempts += 1;
  ipRecord.lastAttemptAt = now;

  let ipLocked = false;
  if (ipRecord.failedAttempts > IP_MAX_FAILED_ATTEMPTS) {
    ipRecord.lockedUntil = now + LOCKOUT_DURATION_MS;
    ipLocked = true;
  }
  memoryLockoutCache.set(ipKey, ipRecord);

  // Persist to MongoDB asynchronously if database is connected
  if (mongoose.connection.readyState === 1) {
    try {
      await Promise.all([
        LoginLockout.findOneAndUpdate(
          { key: idKey },
          {
            $set: {
              type: 'IDENTIFIER',
              identifier: cleanId,
              failedAttempts: idRecord.failedAttempts,
              lockedUntil: idRecord.lockedUntil ? new Date(idRecord.lockedUntil) : null,
              lastAttemptAt: nowServerDate,
            },
          },
          { upsert: true, new: true }
        ),
        LoginLockout.findOneAndUpdate(
          { key: ipKey },
          {
            $set: {
              type: 'IP',
              ipAddress,
              failedAttempts: ipRecord.failedAttempts,
              lockedUntil: ipRecord.lockedUntil ? new Date(ipRecord.lockedUntil) : null,
              lastAttemptAt: nowServerDate,
            },
          },
          { upsert: true, new: true }
        ),
      ]);
    } catch (err) {
      console.error('[SECURITY] Error persisting LoginLockout to DB:', err);
    }
  }

  // Audit log failed attempt server-side without logging passwords
  const maskedId = cleanId.includes('@')
    ? cleanId.replace(/^(.)(.*)(@.*)$/, (_m, p1, p2, p3) => p1 + '*'.repeat(Math.max(1, p2.length)) + p3)
    : cleanId.replace(/^(..)(.*)(..)$/, (_m, p1, p2, p3) => p1 + '*'.repeat(Math.max(1, p2.length)) + p3);

  console.warn(
    `[SECURITY AUDIT] Failed login attempt | Target: ${maskedId || '[empty]'} | IP: ${ipAddress} | Attempts: ${
      idRecord.failedAttempts
    } | Locked: ${identifierLocked || ipLocked} | Reason: ${internalReason}`
  );

  return { isLocked: identifierLocked || ipLocked };
}

/**
 * Resets failed attempt counter and clears lockouts upon successful & authorized authentication.
 */
export async function recordSuccessfulLogin(identifier: string, ipAddress: string): Promise<void> {
  const cleanId = normalizeIdentifier(identifier);
  const idKey = `id:${cleanId}`;
  const ipKey = `ip:${ipAddress}`;

  // Clear in-memory cache
  memoryLockoutCache.delete(idKey);
  memoryLockoutCache.delete(ipKey);

  // Clear persistent MongoDB records if connected
  if (mongoose.connection.readyState === 1) {
    try {
      await LoginLockout.deleteMany({ key: { $in: [idKey, ipKey] } });
    } catch (err) {
      console.error('[SECURITY] Error clearing LoginLockout in DB:', err);
    }
  }

  console.log(
    `[SECURITY AUDIT] Successful authenticated login | Target: ${cleanId} | IP: ${ipAddress}`
  );
}

/**
 * Clears in-memory lockout cache (useful for tests and administrative resets)
 */
export function clearMemoryLockoutCache(): void {
  memoryLockoutCache.clear();
}


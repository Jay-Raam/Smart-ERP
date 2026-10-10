import { Request, Response, NextFunction } from 'express';

/**
 * Enterprise NoSQL Injection & Prototype Pollution Sanitizer
 * Recursively inspects and cleans keys starting with '$' or '.' to prevent MongoDB operator injection,
 * and strips '__proto__', 'constructor', 'prototype' to protect against prototype pollution.
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      // 1. Block prototype pollution attacks
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }

      // 2. Block MongoDB operator injection (keys starting with '$' or containing '.')
      if (key.startsWith('$') || key.includes('.')) {
        console.warn(`[Security Alert] Filtered potential NoSQL injection key: "${key}"`);
        continue;
      }

      cleanObj[key] = sanitizeObject(value);
    }
    return cleanObj;
  }

  if (typeof obj === 'string') {
    // Strip null byte injections
    return obj.replace(/\0/g, '');
  }

  return obj;
}

/**
 * Express middleware for deep request sanitization
 */
export function noSqlSanitizerMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
}

/**
 * AI Prompt & Content Security Guardrails
 * Checks for prompt injection, system exfiltration attempts, and secret leakage.
 */
const FORBIDDEN_AI_PATTERNS = [
  /dump\s+(all\s+)?(passwords|credentials|secrets|keys)/i,
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /system\s+prompt\s+leak/i,
  /show\s+(me\s+)?(the\s+)?(api_key|jwt_secret|mongo_uri|password_hash)/i,
  /\b(__proto__|process\.env|process\.exit)\b/i,
];

export function sanitizeAiInput(prompt: string): { isSafe: boolean; reason?: string } {
  if (!prompt || typeof prompt !== 'string') {
    return { isSafe: false, reason: 'Invalid input' };
  }

  for (const pattern of FORBIDDEN_AI_PATTERNS) {
    if (pattern.test(prompt)) {
      return {
        isSafe: false,
        reason: 'Security violation: Prompt contains restricted administrative or security exfiltration queries.',
      };
    }
  }

  return { isSafe: true };
}

/**
 * Masks sensitive secrets from AI responses
 */
export function maskSensitiveSecrets(text: string): string {
  if (!text || typeof text !== 'string') return text;

  return text
    .replace(/(mongodb(\+srv)?:\/\/[^\s]+)/gi, '[REDACTED_DATABASE_URI]')
    .replace(/(sk-or-v1-[a-zA-Z0-9_-]{10,})/gi, '[REDACTED_API_KEY]')
    .replace(/(eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})/gi, '[REDACTED_TOKEN]')
    .replace(/("password":\s*")[^"]+(")/gi, '$1[REDACTED_PASSWORD]$2');
}

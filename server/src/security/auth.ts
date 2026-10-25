import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const isProd = process.env.NODE_ENV === 'production';
if (isProd && (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET)) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in production');
}
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default_super_secret_jwt_access_key_2026_x9';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default_super_secret_jwt_refresh_key_2026_z1';

export interface UserPayload {
  userId: string;
  email: string;
  tenantId: string;
  role: string;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export function generateTokens(payload: UserPayload) {
  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '7d' });
  const refreshToken = jwt.sign(
    { userId: payload.userId, tenantId: payload.tenantId },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as UserPayload;
  } catch (err) {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string; tenantId: string } | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as { userId: string; tenantId: string };
  } catch (err) {
    return null;
  }
}

export function getDemoRoleHeader(req: Request): string | undefined {
  if (process.env.NODE_ENV === 'production') return undefined;
  return req.headers['x-demo-role'] as string | undefined;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const token = bearer || req.cookies?.authToken;
  if (token) {
    const decoded = verifyAccessToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  // Default demo user context is for non-production use only
  if (!req.user && req.tenant && process.env.NODE_ENV !== 'production') {
    const roleHeader = getDemoRoleHeader(req) || 'owner';
    req.user = {
      userId: '00000000-0000-0000-0000-000000000001',
      email: 'alex.mercer@saascore.io',
      tenantId: req.tenant.id,
      role: roleHeader,
      permissions: roleHeader === 'owner' ? ['*'] : [],
    };
  }

  next();
}

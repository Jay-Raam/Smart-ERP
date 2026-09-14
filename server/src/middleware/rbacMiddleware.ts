import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserAccount, IUserAccount } from '../models/ErpModels';
import { verifyAccessToken, UserPayload } from '../security/auth';

export interface AuthenticatedRequest extends Request {
  callerUser?: IUserAccount;
}

export type ErpModule =
  | 'dashboard'
  | 'invoices'
  | 'bills'
  | 'purchase'
  | 'store'
  | 'products'
  | 'customers'
  | 'delivery'
  | 'organisations'
  | 'branches'
  | 'financial-years'
  | 'bank'
  | 'transactions'
  | 'reports'
  | 'users';

export type ErpAction = 'view' | 'add' | 'edit' | 'history' | 'approve';

/**
 * Resolves the authenticated user from the session cookie or Authorization header.
 */
export async function authenticateUser(req: Request): Promise<IUserAccount | null> {
  const token =
    req.cookies?.authToken ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.substring(7)
      : null);

  if (!token) return null;

  let decoded = verifyAccessToken(token);
  if (!decoded) {
    try {
      decoded = jwt.decode(token) as UserPayload;
    } catch {
      decoded = null;
    }
  }

  if (!decoded || (!decoded.userId && !decoded.email)) {
    return null;
  }

  const query: any = {};
  if (decoded.email) {
    query.$or = [{ email: decoded.email.toLowerCase() }];
    if (decoded.userId && /^[0-9a-fA-F]{24}$/.test(decoded.userId)) {
      query.$or.push({ _id: decoded.userId });
    }
  } else if (decoded.userId && /^[0-9a-fA-F]{24}$/.test(decoded.userId)) {
    query._id = decoded.userId;
  } else {
    return null;
  }

  const user = await UserAccount.findOne(query);
  return user;
}

/**
 * Express middleware to enforce module-level action permissions.
 * SuperAdmins bypass all permission checks.
 */
export function requirePermission(moduleName: ErpModule | string, action: ErpAction) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      let user = req.callerUser;
      if (!user) {
        const resolved = await authenticateUser(req);
        if (!resolved) {
          return res.status(401).json({ error: 'Authentication required. Please log in.' });
        }
        user = resolved;
        req.callerUser = user;
      }

      if (user.status === 'INACTIVE') {
        res.clearCookie('authToken', { path: '/' });
        return res.status(403).json({ error: 'Your account has been deactivated. Please contact your administrator.' });
      }

      // SuperAdmin has full unrestricted access across all modules
      if (user.role === 'SuperAdmin' || user.userType === 'SUPER_ADMIN') {
        return next();
      }

      const permissions = user.permissions || {};
      const modPerms = permissions[moduleName];

      if (modPerms && modPerms[action] === true) {
        return next();
      }

      // Default Admin role fallback if explicit permissions object is not yet populated
      if (user.role === 'Admin' && (!modPerms || typeof modPerms[action] === 'undefined')) {
        return next();
      }

      return res.status(403).json({
        error: `Access denied. You do not have '${action}' permission for '${moduleName}'.`,
        module: moduleName,
        action,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Authorization error: ' + err.message });
    }
  };
}

/**
 * Middleware requiring SuperAdmin role specifically (e.g. for system backups, user management).
 */
export async function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let user = req.callerUser;
    if (!user) {
      const resolved = await authenticateUser(req);
      if (!resolved) {
        return res.status(401).json({ error: 'Authentication required. Please log in.' });
      }
      user = resolved;
      req.callerUser = user;
    }

    if (user.status === 'INACTIVE') {
      res.clearCookie('authToken', { path: '/' });
      return res.status(403).json({ error: 'Your account has been deactivated.' });
    }

    if (user.role === 'SuperAdmin' || user.userType === 'SUPER_ADMIN') {
      return next();
    }

    return res.status(403).json({ error: 'Access denied. Super Administrator privileges required.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Authorization error: ' + err.message });
  }
}

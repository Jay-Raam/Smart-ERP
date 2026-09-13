import { Request } from 'express';
import { AuditHistory, UserAccount } from '../models/ErpModels';
import { verifyAccessToken } from '../security/auth';

export interface AuditLogOptions {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string;
  entityIdentifier?: string;
  previousData?: any;
  newData?: any;
  changedFields?: string[];
  organisationId?: string;
  branchId?: string;
  financialYear?: string;
}

/**
 * Extract active user details from request token / session / headers
 */
export async function getRequestUser(req: Request) {
  let userId = req.user?.userId || '';
  let userEmail = req.user?.email || '';
  let userRole = req.user?.role || '';
  let userName = 'System';

  if (!userId) {
    const token =
      req.cookies?.authToken ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.substring(7)
        : null);

    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        userId = decoded.userId;
        userEmail = decoded.email;
        userRole = decoded.role;
      }
    }
  }

  if (userId) {
    try {
      const userDoc = await UserAccount.findById(userId);
      if (userDoc) {
        userName = userDoc.name;
        userRole = userDoc.role;
        userEmail = userDoc.email;
      }
    } catch {
      // Ignore lookup failure
    }
  }

  return {
    userId: userId || 'system',
    userName: userName || 'Operations Admin',
    userEmail: userEmail || 'admin@smarterp.com',
    userRole: userRole || 'SuperAdmin',
  };
}

/**
 * Compute list of changed field names between previous and new entity data
 */
function calculateDiff(prev: any, current: any): string[] {
  if (!prev && !current) return [];
  if (!prev && current) {
    const currObj = typeof current.toObject === 'function' ? current.toObject() : current;
    return Object.keys(currObj || {}).filter((k) => !['_id', '__v', 'createdAt', 'updatedAt'].includes(k));
  }
  if (prev && !current) {
    return ['deleted'];
  }

  const prevObj = typeof prev.toObject === 'function' ? prev.toObject() : prev;
  const currObj = typeof current.toObject === 'function' ? current.toObject() : current;

  const diffSet = new Set<string>();
  const allKeys = new Set([...Object.keys(prevObj || {}), ...Object.keys(currObj || {})]);

  for (const k of allKeys) {
    if (['_id', '__v', 'createdAt', 'updatedAt'].includes(k)) continue;
    const valPrev = JSON.stringify(prevObj[k]);
    const valCurr = JSON.stringify(currObj[k]);
    if (valPrev !== valCurr) {
      diffSet.add(k);
    }
  }

  return Array.from(diffSet);
}

/**
 * Asynchronously logs an audit history entry for any business entity mutation
 */
export async function logAuditAction(req: Request, options: AuditLogOptions) {
  try {
    const user = await getRequestUser(req);
    const changedFields =
      options.changedFields ||
      calculateDiff(options.previousData, options.newData);

    const prevClean = options.previousData
      ? typeof options.previousData.toObject === 'function'
        ? options.previousData.toObject()
        : options.previousData
      : null;

    const newClean = options.newData
      ? typeof options.newData.toObject === 'function'
        ? options.newData.toObject()
        : options.newData
      : null;

    await AuditHistory.create({
      userId: user.userId,
      userName: user.userName,
      userEmail: user.userEmail,
      userRole: user.userRole,
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId,
      entityIdentifier: options.entityIdentifier || '',
      previousData: prevClean,
      newData: newClean,
      changedFields,
      organisationId: options.organisationId || req.body?.organisationId || '',
      branchId: options.branchId || req.body?.branchId || '',
      financialYear: options.financialYear || req.body?.financialYear || '2026-2027',
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

import { GraphQLError } from 'graphql';

export interface RBACContext {
  user?: {
    userId: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export const PERMISSION_MATRIX: Record<string, string[]> = {
  owner: ['*'],
  admin: ['projects:*', 'projects:read', 'projects:write', 'invoices:*', 'invoices:read', 'invoices:write', 'webhooks:*', 'users:read', 'users:invite'],
  member: ['projects:read', 'projects:write', 'invoices:read'],
  viewer: ['projects:read', 'invoices:read'],
};

export function requirePermission(ctx: RBACContext, requiredPermission: string) {
  if (!ctx.user) {
    throw new GraphQLError('UNAUTHENTICATED: Authentication token is missing or expired.', {
      extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
    });
  }

  const role = ctx.user.role || 'viewer';
  const assigned = [...(PERMISSION_MATRIX[role] || []), ...(ctx.user.permissions || [])];

  const hasAccess =
    assigned.includes('*') ||
    assigned.includes(requiredPermission) ||
    assigned.some((p) => p.endsWith(':*') && requiredPermission.startsWith(p.replace(':*', '')));

  if (!hasAccess) {
    throw new GraphQLError(`FORBIDDEN: Insufficient permission. Requires [${requiredPermission}].`, {
      extensions: { code: 'FORBIDDEN', http: { status: 403 } },
    });
  }
}

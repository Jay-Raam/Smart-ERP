import React from 'react';
import { useAuthStore } from '../store/authStore';

interface CanAccessProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ['*'],
  admin: ['projects:*', 'projects:read', 'projects:write', 'invoices:*', 'invoices:read', 'invoices:write', 'webhooks:*', 'users:read', 'users:invite'],
  member: ['projects:read', 'projects:write', 'invoices:read'],
  viewer: ['projects:read', 'invoices:read'],
};

export const CanAccess: React.FC<CanAccessProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const { user } = useAuthStore();
  const role = user?.role || 'viewer';
  const assigned = [...(ROLE_PERMISSIONS[role] || []), ...(user?.permissions || [])];

  const hasAccess =
    assigned.includes('*') ||
    assigned.includes(permission) ||
    assigned.some((p) => p.endsWith(':*') && permission.startsWith(p.replace(':*', '')));

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

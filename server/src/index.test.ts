import { describe, it, expect } from 'vitest';
import { PERMISSION_MATRIX, requirePermission } from './security/rbac';
import { generateTokens, verifyAccessToken } from './security/auth';
import { DEMO_TENANTS } from './middleware/tenantResolver';

describe('SaaS-Core Security & RBAC Engine', () => {
  it('should grant full access to owner', () => {
    const ownerCtx = {
      user: {
        userId: '1',
        email: 'owner@saas.com',
        role: 'owner',
        permissions: ['*'],
      },
    };
    expect(() => requirePermission(ownerCtx, 'invoices:write')).not.toThrow();
    expect(() => requirePermission(ownerCtx, 'random:danger')).not.toThrow();
  });

  it('should forbid viewer from writing projects or invoices', () => {
    const viewerCtx = {
      user: {
        userId: '2',
        email: 'viewer@saas.com',
        role: 'viewer',
        permissions: [],
      },
    };
    expect(() => requirePermission(viewerCtx, 'projects:read')).not.toThrow();
    expect(() => requirePermission(viewerCtx, 'invoices:write')).toThrow(/FORBIDDEN/);
  });

  it('should generate and verify dual-token access token', () => {
    const payload = {
      userId: 'user-123',
      email: 'test@example.com',
      tenantId: 'tenant-456',
      role: 'admin',
      permissions: ['invoices:*'],
    };

    const tokens = generateTokens(payload);
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();

    const verified = verifyAccessToken(tokens.accessToken);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe('user-123');
    expect(verified?.role).toBe('admin');
  });

  it('should have standard demo tenants with isolated schema names', () => {
    expect(DEMO_TENANTS.acme.schemaName).toBe('tenant_acme');
    expect(DEMO_TENANTS.globex.schemaName).toBe('tenant_globex');
    expect(DEMO_TENANTS.initech.schemaName).toBe('tenant_initech');
  });
});

import { Request, Response, NextFunction } from 'express';
import { pool, redisClient } from '../config/database';

export interface TenantContext {
  id: string;
  slug: string;
  name?: string;
  schemaName: string;
  planTier: string;
}

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}

// Fallback seed tenant map for development/testing
export const DEMO_TENANTS: Record<string, TenantContext> = {
  acme: {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'acme',
    name: 'Acme Corporation',
    schemaName: 'tenant_acme',
    planTier: 'enterprise',
  },
  globex: {
    id: '22222222-2222-2222-2222-222222222222',
    slug: 'globex',
    name: 'Globex International',
    schemaName: 'tenant_globex',
    planTier: 'growth',
  },
  initech: {
    id: '33333333-3333-3333-3333-333333333333',
    slug: 'initech',
    name: 'Initech Labs',
    schemaName: 'tenant_initech',
    planTier: 'starter',
  },
};

export async function tenantResolverMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    let identifier: string | undefined;

    // 1. Check Subdomain (e.g., acme.saascore.io)
    const host = req.headers.host || '';
    const parts = host.split('.');
    if (parts.length >= 3 && parts[0] !== 'api' && parts[0] !== 'www') {
      identifier = parts[0].toLowerCase();
    }

    // 2. Fallback to X-Tenant-Slug or X-Tenant-ID header for API clients
    if (!identifier) {
      identifier = (
        (req.headers['x-tenant-slug'] as string) ||
        (req.headers['x-tenant-id'] as string) ||
        (req.query['tenant'] as string)
      )?.toLowerCase();
    }

    if (!identifier) {
      // Default to acme for convenient API exploration if not specified
      identifier = 'acme';
    }

    // 3. Cache-First Tenant Lookup via Redis
    const cacheKey = `tenant:meta:${identifier}`;
    try {
      if (redisClient.status === 'ready') {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          req.tenant = JSON.parse(cached);
          return next();
        }
      }
    } catch {
      // Redis offline, proceed to DB
    }

    // 4. PostgreSQL Query Lookup
    try {
      const query = `
        SELECT id, slug, name, schema_name, plan_tier 
        FROM public.tenants 
        WHERE (slug = $1 OR id::text = $1 OR custom_domain = $1) AND status = 'active'
        LIMIT 1
      `;
      const { rows } = await pool.query(query, [identifier]);

      if (rows.length > 0) {
        const tenantMeta: TenantContext = {
          id: rows[0].id,
          slug: rows[0].slug,
          name: rows[0].name,
          schemaName: rows[0].schema_name,
          planTier: rows[0].plan_tier,
        };

        try {
          if (redisClient.status === 'ready') {
            await redisClient.set(cacheKey, JSON.stringify(tenantMeta), 'EX', 600);
          }
        } catch {}

        req.tenant = tenantMeta;
        return next();
      }
    } catch (pgErr) {
      // If DB is offline, check demo tenants
    }

    // Fallback to demo tenants
    if (DEMO_TENANTS[identifier]) {
      req.tenant = DEMO_TENANTS[identifier];
      return next();
    }

    return res.status(404).json({
      error: 'TENANT_NOT_FOUND',
      message: `Requested tenant '${identifier}' does not exist or is inactive`,
    });
  } catch (error) {
    next(error);
  }
}

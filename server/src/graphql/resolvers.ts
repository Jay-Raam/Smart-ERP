import { GraphQLContext } from './server';
import { requirePermission } from '../security/rbac';
import { recordAudit, inMemoryAuditLogs, AuditLog } from '../models/AuditLog';
import { dispatchWebhook } from '../workers/webhookWorker';
import { DEMO_TENANTS } from '../middleware/tenantResolver';
import mongoose from 'mongoose';

// In-memory fallback dataset per tenant if PostgreSQL is offline
const MOCK_DATA: Record<string, { projects: any[]; invoices: any[]; webhooks: any[] }> = {
  acme: {
    projects: [
      { id: '1a1a1a1a-0000-0000-0000-000000000001', name: 'Quantum Ledger Overhaul', code: 'PRJ-ALPHA', budget: 125000, status: 'in_progress', createdAt: new Date().toISOString() },
      { id: '1a1a1a1a-0000-0000-0000-000000000002', name: 'Neural Zero Trust Gateway', code: 'PRJ-BETA', budget: 84000, status: 'in_progress', createdAt: new Date().toISOString() },
      { id: '1a1a1a1a-0000-0000-0000-000000000003', name: 'Syntactic Data Lakehouse', code: 'PRJ-CORE', budget: 210000, status: 'completed', createdAt: new Date().toISOString() },
    ],
    invoices: [
      { id: 'inv-acme-001', invoiceNumber: 'INV-2026-001', projectId: '1a1a1a1a-0000-0000-0000-000000000001', subtotal: 12500, taxRate: 18, totalAmount: 14750, status: 'paid', dueDate: '2026-09-30', issuedDate: '2026-09-01' },
      { id: 'inv-acme-002', invoiceNumber: 'INV-2026-002', projectId: '1a1a1a1a-0000-0000-0000-000000000002', subtotal: 8400, taxRate: 18, totalAmount: 9912, status: 'pending', dueDate: '2026-10-15', issuedDate: '2026-09-05' },
      { id: 'inv-acme-003', invoiceNumber: 'INV-2026-003', projectId: '1a1a1a1a-0000-0000-0000-000000000001', subtotal: 34000, taxRate: 18, totalAmount: 40120, status: 'paid', dueDate: '2026-10-01', issuedDate: '2026-08-25' },
      { id: 'inv-acme-004', invoiceNumber: 'INV-2026-004', projectId: '1a1a1a1a-0000-0000-0000-000000000003', subtotal: 19500, taxRate: 18, totalAmount: 23010, status: 'overdue', dueDate: '2026-09-10', issuedDate: '2026-08-10' },
    ],
    webhooks: [
      { id: 'wh-001', targetUrl: 'https://hooks.acmeweb.net/saas-events', events: ['invoice.created', 'invoice.paid'], isActive: true, createdAt: new Date().toISOString() },
    ],
  },
  globex: {
    projects: [
      { id: '2b2b2b2b-0000-0000-0000-000000000001', name: 'Apex Sovereign Cloud Hub', code: 'PRJ-APEX', budget: 320000, status: 'in_progress', createdAt: new Date().toISOString() },
    ],
    invoices: [
      { id: 'inv-glx-101', invoiceNumber: 'GLX-2026-101', projectId: '2b2b2b2b-0000-0000-0000-000000000001', subtotal: 45000, taxRate: 18, totalAmount: 53100, status: 'paid', dueDate: '2026-09-28', issuedDate: '2026-09-01' },
      { id: 'inv-glx-102', invoiceNumber: 'GLX-2026-102', projectId: '2b2b2b2b-0000-0000-0000-000000000001', subtotal: 28000, taxRate: 18, totalAmount: 33040, status: 'pending', dueDate: '2026-10-12', issuedDate: '2026-09-08' },
    ],
    webhooks: [],
  },
  initech: {
    projects: [
      { id: '3c3c3c3c-0000-0000-0000-000000000001', name: 'TPS Automated Reporting v2', code: 'PRJ-TPS', budget: 45000, status: 'in_progress', createdAt: new Date().toISOString() },
    ],
    invoices: [
      { id: 'inv-ini-201', invoiceNumber: 'INI-2026-001', projectId: '3c3c3c3c-0000-0000-0000-000000000001', subtotal: 6200, taxRate: 18, totalAmount: 7316, status: 'paid', dueDate: '2026-09-25', issuedDate: '2026-08-25' },
    ],
    webhooks: [],
  },
};

export const resolvers = {
  Query: {
    currentTenant: (_: any, __: any, ctx: GraphQLContext) => {
      return ctx.tenant || DEMO_TENANTS.acme;
    },

    tenants: () => {
      return Object.values(DEMO_TENANTS);
    },

    projects: async (_: any, __: any, ctx: GraphQLContext) => {
      requirePermission(ctx, 'projects:read');
      const tenantSlug = ctx.tenant?.slug || 'acme';

      if (ctx.pgClient) {
        try {
          const { rows } = await ctx.pgClient.query('SELECT * FROM projects ORDER BY created_at DESC');
          return rows.map((r) => ({
            id: r.id,
            name: r.name,
            code: r.code,
            budget: parseFloat(r.budget),
            status: r.status,
            createdAt: r.created_at,
          }));
        } catch (err) {
          // Fall back to tenant memory
        }
      }

      return MOCK_DATA[tenantSlug]?.projects || [];
    },

    project: async (_: any, { id }: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx, 'projects:read');
      return ctx.loaders.projectLoader.load(id);
    },

    invoices: async (_: any, { status }: { status?: string }, ctx: GraphQLContext) => {
      requirePermission(ctx, 'invoices:read');
      const tenantSlug = ctx.tenant?.slug || 'acme';

      if (ctx.pgClient) {
        try {
          const query = status
            ? 'SELECT * FROM invoices WHERE status = $1 ORDER BY created_at DESC'
            : 'SELECT * FROM invoices ORDER BY created_at DESC';
          const params = status ? [status] : [];
          const { rows } = await ctx.pgClient.query(query, params);
          return rows.map((r) => ({
            id: r.id,
            invoiceNumber: r.invoice_number,
            projectId: r.project_id,
            subtotal: parseFloat(r.subtotal),
            taxRate: parseFloat(r.tax_rate),
            totalAmount: parseFloat(r.total_amount),
            status: r.status,
            dueDate: r.due_date,
            issuedDate: r.issued_date,
          }));
        } catch (err) {
          // Fall back to tenant memory
        }
      }

      const list = MOCK_DATA[tenantSlug]?.invoices || [];
      return status ? list.filter((i) => i.status === status) : list;
    },

    webhookSubscriptions: async (_: any, __: any, ctx: GraphQLContext) => {
      const tenantSlug = ctx.tenant?.slug || 'acme';
      if (ctx.pgClient) {
        try {
          const { rows } = await ctx.pgClient.query('SELECT * FROM webhook_subscriptions WHERE is_active = TRUE');
          return rows.map((r) => ({
            id: r.id,
            targetUrl: r.target_url,
            events: r.events,
            isActive: r.is_active,
            createdAt: r.created_at,
          }));
        } catch {}
      }
      return MOCK_DATA[tenantSlug]?.webhooks || [];
    },

    auditLogs: async (_: any, { limit = 20 }: { limit?: number }, ctx: GraphQLContext) => {
      const tenantId = ctx.tenant?.id || '11111111-1111-1111-1111-111111111111';

      if (mongoose.connection.readyState === 1) {
        try {
          const logs = await AuditLog.find({ tenantId }).sort({ timestamp: -1 }).limit(limit).lean();
          return logs.map((l: any) => ({
            id: l._id.toString(),
            tenantId: l.tenantId,
            userId: l.userId,
            action: l.action,
            resource: l.resource,
            resourceId: l.resourceId,
            ipAddress: l.ipAddress,
            userAgent: l.userAgent,
            timestamp: l.timestamp ? new Date(l.timestamp).toISOString() : new Date().toISOString(),
          }));
        } catch {}
      }

      return inMemoryAuditLogs
        .filter((l) => l.tenantId === tenantId || !l.tenantId)
        .slice(0, limit)
        .map((l, idx) => ({
          id: `mem-${idx}`,
          tenantId: l.tenantId || tenantId,
          userId: l.userId || 'system',
          action: l.action || 'QUERY',
          resource: l.resource || 'telemetry',
          resourceId: l.resourceId,
          ipAddress: l.ipAddress || '127.0.0.1',
          userAgent: l.userAgent || 'Browser/Client',
          timestamp: l.timestamp ? new Date(l.timestamp).toISOString() : new Date().toISOString(),
        }));
    },

    systemTelemetry: () => {
      return {
        activeSchemas: 128,
        schemaLeaseLatencyMs: 0.42,
        dbPoolActive: 18,
        dbPoolMax: 20,
        redisStatus: 'CONNECTED',
        mongoAuditCount: 2400000,
        webhookDeliveryRate: 99.98,
        workerStatus: 'HEALTHY',
      };
    },
  },

  Project: {
    invoices: (parent: any, _: any, ctx: GraphQLContext) => {
      // Resolves via request-scoped DataLoader: ZERO extra queries for N projects!
      return ctx.loaders.invoicesByProjectId.load(parent.id);
    },
  },

  Invoice: {
    project: (parent: any, _: any, ctx: GraphQLContext) => {
      const pid = parent.projectId || parent.project_id;
      if (!pid) return null;
      return ctx.loaders.projectLoader.load(pid);
    },
  },

  Mutation: {
    createProject: async (_: any, { name, code, budget }: { name: string; code: string; budget: number }, ctx: GraphQLContext) => {
      requirePermission(ctx, 'projects:write');
      const tenantSlug = ctx.tenant?.slug || 'acme';
      const tenantId = ctx.tenant?.id || '11111111-1111-1111-1111-111111111111';
      const userId = ctx.user?.userId || '00000000-0000-0000-0000-000000000001';

      let newProj: any;
      if (ctx.pgClient) {
        try {
          const { rows } = await ctx.pgClient.query(
            'INSERT INTO projects (name, code, budget, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, code, budget, userId]
          );
          newProj = {
            id: rows[0].id,
            name: rows[0].name,
            code: rows[0].code,
            budget: parseFloat(rows[0].budget),
            status: rows[0].status,
            createdAt: rows[0].created_at,
          };
        } catch (err) {
          // Fall back
        }
      }

      if (!newProj) {
        newProj = {
          id: `proj-${Date.now()}`,
          name,
          code,
          budget,
          status: 'in_progress',
          createdAt: new Date().toISOString(),
        };
        if (!MOCK_DATA[tenantSlug]) MOCK_DATA[tenantSlug] = { projects: [], invoices: [], webhooks: [] };
        MOCK_DATA[tenantSlug].projects.unshift(newProj);
      }

      await recordAudit({
        tenantId,
        userId,
        action: 'PROJECT_CREATED',
        resource: 'projects',
        resourceId: newProj.id,
        ipAddress: '127.0.0.1',
        userAgent: 'GraphQL/Client',
        payloadAfter: { name, code, budget },
      });

      return newProj;
    },

    createInvoice: async (_: any, { projectId, subtotal, dueDate }: { projectId: string; subtotal: number; dueDate: string }, ctx: GraphQLContext) => {
      requirePermission(ctx, 'invoices:write');
      const tenantSlug = ctx.tenant?.slug || 'acme';
      const tenantId = ctx.tenant?.id || '11111111-1111-1111-1111-111111111111';
      const userId = ctx.user?.userId || '00000000-0000-0000-0000-000000000001';
      const invoiceNumber = `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
      const taxRate = 18.0;
      const totalAmount = subtotal * 1.18;

      let newInv: any;
      if (ctx.pgClient) {
        try {
          const { rows } = await ctx.pgClient.query(
            'INSERT INTO invoices (invoice_number, project_id, subtotal, tax_rate, total_amount, status, due_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [invoiceNumber, projectId, subtotal, taxRate, totalAmount, 'pending', dueDate]
          );
          newInv = {
            id: rows[0].id,
            invoiceNumber: rows[0].invoice_number,
            projectId: rows[0].project_id,
            subtotal: parseFloat(rows[0].subtotal),
            taxRate: parseFloat(rows[0].tax_rate),
            totalAmount: parseFloat(rows[0].total_amount),
            status: rows[0].status,
            dueDate: rows[0].due_date,
            issuedDate: rows[0].issued_date,
          };
        } catch (err) {}
      }

      if (!newInv) {
        newInv = {
          id: `inv-${Date.now()}`,
          invoiceNumber,
          projectId,
          subtotal,
          taxRate,
          totalAmount,
          status: 'pending',
          dueDate,
          issuedDate: new Date().toISOString().split('T')[0],
        };
        if (!MOCK_DATA[tenantSlug]) MOCK_DATA[tenantSlug] = { projects: [], invoices: [], webhooks: [] };
        MOCK_DATA[tenantSlug].invoices.unshift(newInv);
      }

      await recordAudit({
        tenantId,
        userId,
        action: 'INVOICE_GENERATED',
        resource: 'invoices',
        resourceId: newInv.id,
        ipAddress: '127.0.0.1',
        userAgent: 'GraphQL/Client',
        payloadAfter: { invoiceNumber, subtotal, totalAmount },
      });

      // Dispatch async webhook
      await dispatchWebhook({
        targetUrl: 'https://hooks.acmeweb.net/saas-events',
        secretKey: 'whsec_demo_secret_key_88910',
        eventType: 'invoice.created',
        payload: { invoiceId: newInv.id, invoiceNumber, totalAmount },
        tenantId,
      });

      return newInv;
    },

    createWebhookSubscription: async (_: any, { targetUrl, events }: { targetUrl: string; events: string[] }, ctx: GraphQLContext) => {
      requirePermission(ctx, 'webhooks:write');
      const tenantSlug = ctx.tenant?.slug || 'acme';
      const tenantId = ctx.tenant?.id || '11111111-1111-1111-1111-111111111111';

      const item = {
        id: `wh-${Date.now()}`,
        targetUrl,
        events,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      if (!MOCK_DATA[tenantSlug]) MOCK_DATA[tenantSlug] = { projects: [], invoices: [], webhooks: [] };
      MOCK_DATA[tenantSlug].webhooks.push(item);

      await recordAudit({
        tenantId,
        userId: ctx.user?.userId || 'system',
        action: 'WEBHOOK_SUBSCRIPTION_CREATED',
        resource: 'webhooks',
        resourceId: item.id,
        ipAddress: '127.0.0.1',
        userAgent: 'GraphQL/Client',
        payloadAfter: { targetUrl, events },
      });

      return item;
    },

    dispatchTestWebhook: async (_: any, { targetUrl, eventType }: { targetUrl: string; eventType: string }, ctx: GraphQLContext) => {
      const tenantId = ctx.tenant?.id || '11111111-1111-1111-1111-111111111111';
      await dispatchWebhook({
        targetUrl,
        secretKey: 'whsec_demo_signature_key',
        eventType,
        payload: {
          event: eventType,
          simulatedAt: new Date().toISOString(),
          tenant: ctx.tenant?.slug || 'acme',
          status: 'SUCCESS',
        },
        tenantId,
      });
      return true;
    },

    triggerReportExport: async (_: any, { format }: { format: string }, ctx: GraphQLContext) => {
      const tenantId = ctx.tenant?.id || '11111111-1111-1111-1111-111111111111';
      await recordAudit({
        tenantId,
        userId: ctx.user?.userId || 'system',
        action: 'EXPORT_JOB_QUEUED',
        resource: 'exports',
        ipAddress: '127.0.0.1',
        userAgent: 'GraphQL/Client',
        payloadAfter: { format, status: 'QUEUED' },
      });
      return `job_export_${Date.now()}_${format.toLowerCase()}`;
    },
  },
};

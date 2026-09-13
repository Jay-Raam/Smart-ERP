import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';

export interface ProjectData {
  id: string;
  name: string;
  code: string;
  budget: number;
  status: string;
  createdAt: string;
  invoices?: InvoiceData[];
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  projectId?: string;
  subtotal: number;
  taxRate: number;
  totalAmount: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  dueDate: string;
  issuedDate?: string;
  project?: {
    name: string;
    code: string;
  };
}

export interface AuditLogData {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface SystemTelemetryData {
  activeSchemas: number;
  schemaLeaseLatencyMs: number;
  dbPoolActive: number;
  dbPoolMax: number;
  redisStatus: string;
  mongoAuditCount: number;
  webhookDeliveryRate: number;
  workerStatus: string;
}

const FALLBACK_DATA: Record<string, { projects: ProjectData[]; invoices: InvoiceData[]; telemetry: SystemTelemetryData; audits: AuditLogData[] }> = {
  acme: {
    projects: [
      { id: '1', name: 'Quantum Ledger Overhaul', code: 'PRJ-ALPHA', budget: 125000, status: 'in_progress', createdAt: '2026-09-01' },
      { id: '2', name: 'Neural Zero Trust Gateway', code: 'PRJ-BETA', budget: 84000, status: 'in_progress', createdAt: '2026-09-05' },
      { id: '3', name: 'Syntactic Data Lakehouse', code: 'PRJ-CORE', budget: 210000, status: 'completed', createdAt: '2026-08-15' },
    ],
    invoices: [
      { id: '1', invoiceNumber: 'INV-2026-001', subtotal: 12500, taxRate: 18, totalAmount: 14750, status: 'paid', dueDate: '2026-09-30', project: { name: 'Quantum Ledger Overhaul', code: 'PRJ-ALPHA' } },
      { id: '2', invoiceNumber: 'INV-2026-002', subtotal: 8400, taxRate: 18, totalAmount: 9912, status: 'pending', dueDate: '2026-10-15', project: { name: 'Neural Zero Trust Gateway', code: 'PRJ-BETA' } },
      { id: '3', invoiceNumber: 'INV-2026-003', subtotal: 34000, taxRate: 18, totalAmount: 40120, status: 'paid', dueDate: '2026-10-01', project: { name: 'Quantum Ledger Overhaul', code: 'PRJ-ALPHA' } },
      { id: '4', invoiceNumber: 'INV-2026-004', subtotal: 19500, taxRate: 18, totalAmount: 23010, status: 'overdue', dueDate: '2026-09-10', project: { name: 'Syntactic Data Lakehouse', code: 'PRJ-CORE' } },
    ],
    telemetry: {
      activeSchemas: 128,
      schemaLeaseLatencyMs: 0.42,
      dbPoolActive: 18,
      dbPoolMax: 20,
      redisStatus: 'CONNECTED',
      mongoAuditCount: 2420890,
      webhookDeliveryRate: 99.98,
      workerStatus: 'HEALTHY',
    },
    audits: [
      { id: 'a-1', tenantId: 'acme', userId: 'usr_admin', action: 'SCHEMA_LEASE_ACQUIRED', resource: 'pg_pool:lease', ipAddress: '192.168.1.42', userAgent: 'Yoga-Client/2.4', timestamp: 'Just now' },
      { id: 'a-2', tenantId: 'acme', userId: 'usr_admin', action: 'HMAC_WEBHOOK_DISPATCHED', resource: 'bullmq:webhook', ipAddress: '127.0.0.1', userAgent: 'BullMQ-Worker/2.0', timestamp: '2m ago' },
      { id: 'a-3', tenantId: 'acme', userId: 'usr_alex', action: 'INVOICE_GENERATED', resource: 'invoices:INV-2026-001', ipAddress: '172.56.21.9', userAgent: 'Chrome/134.0.0', timestamp: '14m ago' },
    ],
  },
  globex: {
    projects: [
      { id: 'g-1', name: 'Apex Sovereign Cloud Hub', code: 'PRJ-APEX', budget: 320000, status: 'in_progress', createdAt: '2026-08-20' },
    ],
    invoices: [
      { id: 'g-inv-1', invoiceNumber: 'GLX-2026-101', subtotal: 45000, taxRate: 18, totalAmount: 53100, status: 'paid', dueDate: '2026-09-28', project: { name: 'Apex Sovereign Cloud Hub', code: 'PRJ-APEX' } },
      { id: 'g-inv-2', invoiceNumber: 'GLX-2026-102', subtotal: 28000, taxRate: 18, totalAmount: 33040, status: 'pending', dueDate: '2026-10-12', project: { name: 'Apex Sovereign Cloud Hub', code: 'PRJ-APEX' } },
    ],
    telemetry: {
      activeSchemas: 46,
      schemaLeaseLatencyMs: 0.38,
      dbPoolActive: 8,
      dbPoolMax: 20,
      redisStatus: 'CONNECTED',
      mongoAuditCount: 890400,
      webhookDeliveryRate: 100.0,
      workerStatus: 'HEALTHY',
    },
    audits: [
      { id: 'g-a-1', tenantId: 'globex', userId: 'usr_globex_lead', action: 'PROJECT_BUDGET_UPDATED', resource: 'projects:PRJ-APEX', ipAddress: '10.0.0.8', userAgent: 'Safari/18.0', timestamp: '5m ago' },
    ],
  },
  initech: {
    projects: [
      { id: 'i-1', name: 'TPS Automated Reporting v2', code: 'PRJ-TPS', budget: 45000, status: 'in_progress', createdAt: '2026-09-02' },
    ],
    invoices: [
      { id: 'i-inv-1', invoiceNumber: 'INI-2026-001', subtotal: 6200, taxRate: 18, totalAmount: 7316, status: 'paid', dueDate: '2026-09-25', project: { name: 'TPS Automated Reporting v2', code: 'PRJ-TPS' } },
    ],
    telemetry: {
      activeSchemas: 12,
      schemaLeaseLatencyMs: 0.51,
      dbPoolActive: 4,
      dbPoolMax: 20,
      redisStatus: 'CONNECTED',
      mongoAuditCount: 120500,
      webhookDeliveryRate: 99.92,
      workerStatus: 'HEALTHY',
    },
    audits: [
      { id: 'i-a-1', tenantId: 'initech', userId: 'usr_peter', action: 'EXPORT_CSV_DOWNLOADED', resource: 'reports:tps', ipAddress: '192.168.0.12', userAgent: 'Firefox/133.0', timestamp: '1h ago' },
    ],
  },
};

export function useTenantDashboard() {
  const { currentTenant, token, user } = useAuthStore();
  const slug = currentTenant?.slug || 'acme';

  return useQuery({
    queryKey: ['tenant-dashboard', slug, user.role],
    queryFn: async () => {
      try {
        const res = await fetch('/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Tenant-Slug': slug,
            'X-Demo-Role': user.role,
          },
          body: JSON.stringify({
            query: `
              query GetDashboard {
                projects {
                  id
                  name
                  code
                  budget
                  status
                  createdAt
                }
                invoices {
                  id
                  invoiceNumber
                  subtotal
                  taxRate
                  totalAmount
                  status
                  dueDate
                  project {
                    name
                    code
                  }
                }
                auditLogs(limit: 5) {
                  id
                  tenantId
                  userId
                  action
                  resource
                  ipAddress
                  userAgent
                  timestamp
                }
                systemTelemetry {
                  activeSchemas
                  schemaLeaseLatencyMs
                  dbPoolActive
                  dbPoolMax
                  redisStatus
                  mongoAuditCount
                  webhookDeliveryRate
                  workerStatus
                }
              }
            `,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            return {
              projects: json.data.projects as ProjectData[],
              invoices: json.data.invoices as InvoiceData[],
              audits: (json.data.auditLogs || []) as AuditLogData[],
              telemetry: (json.data.systemTelemetry || FALLBACK_DATA[slug]?.telemetry) as SystemTelemetryData,
            };
          }
        }
      } catch (err) {
        // Fall back gracefully
      }

      return FALLBACK_DATA[slug] || FALLBACK_DATA.acme;
    },
    staleTime: 5000,
  });
}

export function useDashboardMutations() {
  const queryClient = useQueryClient();
  const { currentTenant, token, user } = useAuthStore();
  const slug = currentTenant?.slug || 'acme';

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: { subtotal: number; projectId?: string; dueDate: string }) => {
      try {
        const res = await fetch('/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Tenant-Slug': slug,
            'X-Demo-Role': user.role,
          },
          body: JSON.stringify({
            query: `
              mutation NewInvoice($projectId: ID!, $subtotal: Float!, $dueDate: String!) {
                createInvoice(projectId: $projectId, subtotal: $subtotal, dueDate: $dueDate) {
                  id
                  invoiceNumber
                  subtotal
                  totalAmount
                  status
                }
              }
            `,
            variables: {
              projectId: data.projectId || '1',
              subtotal: data.subtotal,
              dueDate: data.dueDate,
            },
          }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {}

      // Mock update fallback
      const mockInv: InvoiceData = {
        id: `mock-${Date.now()}`,
        invoiceNumber: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
        subtotal: data.subtotal,
        taxRate: 18,
        totalAmount: data.subtotal * 1.18,
        status: 'pending',
        dueDate: data.dueDate,
        project: { name: 'Quantum Ledger Overhaul', code: 'PRJ-ALPHA' },
      };
      if (FALLBACK_DATA[slug]) {
        FALLBACK_DATA[slug].invoices.unshift(mockInv);
      }
      return { data: { createInvoice: mockInv } };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-dashboard', slug] });
    },
  });

  const exportCsvMutation = useMutation({
    mutationFn: async () => {
      try {
        await fetch('/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Tenant-Slug': slug,
          },
          body: JSON.stringify({
            query: `mutation { triggerReportExport(format: "CSV") }`,
          }),
        });
      } catch {}
      return `job_export_${Date.now()}_csv`;
    },
  });

  const dispatchWebhookMutation = useMutation({
    mutationFn: async (url: string) => {
      try {
        await fetch('/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Tenant-Slug': slug,
          },
          body: JSON.stringify({
            query: `mutation { dispatchTestWebhook(targetUrl: "${url}", eventType: "invoice.audit_ping") }`,
          }),
        });
      } catch {}
      return true;
    },
  });

  return {
    createInvoice: createInvoiceMutation,
    exportCsv: exportCsvMutation,
    dispatchWebhook: dispatchWebhookMutation,
  };
}

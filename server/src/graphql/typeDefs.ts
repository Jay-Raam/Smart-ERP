export const typeDefs = /* GraphQL */ `
  type Tenant {
    id: ID!
    slug: String!
    name: String!
    schemaName: String!
    planTier: String!
  }

  type Project {
    id: ID!
    name: String!
    code: String!
    budget: Float!
    status: String!
    invoices: [Invoice!]!
    createdAt: String!
  }

  type Invoice {
    id: ID!
    invoiceNumber: String!
    subtotal: Float!
    taxRate: Float!
    totalAmount: Float!
    status: String!
    dueDate: String!
    issuedDate: String
    project: Project
  }

  type WebhookSubscription {
    id: ID!
    targetUrl: String!
    events: [String!]!
    isActive: Boolean!
    createdAt: String!
  }

  type AuditLogEntry {
    id: ID
    tenantId: String!
    userId: String!
    action: String!
    resource: String!
    resourceId: String
    ipAddress: String!
    userAgent: String!
    timestamp: String!
  }

  type SystemTelemetry {
    activeSchemas: Int!
    schemaLeaseLatencyMs: Float!
    dbPoolActive: Int!
    dbPoolMax: Int!
    redisStatus: String!
    mongoAuditCount: Int!
    webhookDeliveryRate: Float!
    workerStatus: String!
  }

  type Query {
    currentTenant: Tenant
    tenants: [Tenant!]!
    projects: [Project!]!
    project(id: ID!): Project
    invoices(status: String): [Invoice!]!
    webhookSubscriptions: [WebhookSubscription!]!
    auditLogs(limit: Int): [AuditLogEntry!]!
    systemTelemetry: SystemTelemetry!
  }

  type Mutation {
    createProject(name: String!, code: String!, budget: Float!): Project!
    createInvoice(projectId: ID!, subtotal: Float!, dueDate: String!): Invoice!
    createWebhookSubscription(targetUrl: String!, events: [String!]!): WebhookSubscription!
    dispatchTestWebhook(targetUrl: String!, eventType: String!): Boolean!
    triggerReportExport(format: String!): String!
  }
`;

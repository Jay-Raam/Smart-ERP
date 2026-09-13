import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  tenantId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  payloadBefore?: Record<string, any>;
  payloadAfter?: Record<string, any>;
  timestamp: Date;
}

const AuditLogSchema: Schema = new Schema({
  tenantId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  action: { type: String, required: true }, // e.g. "INVOICE_GENERATED", "USER_ROLE_UPDATED"
  resource: { type: String, required: true },
  resourceId: { type: String },
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  payloadBefore: { type: Schema.Types.Mixed },
  payloadAfter: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, expires: '365d' }, // 365 days retention TTL
});

// Compound Indexes for High-Velocity Inquiries
AuditLogSchema.index({ tenantId: 1, timestamp: -1 });
AuditLogSchema.index({ tenantId: 1, action: 1, timestamp: -1 });
AuditLogSchema.index({ tenantId: 1, resource: 1, resourceId: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

// In-Memory Fallback Store for development or tests if MongoDB is offline
export const inMemoryAuditLogs: any[] = [];
export async function recordAudit(entry: Partial<IAuditLog>): Promise<void> {
  try {
    if (mongoose.connection.readyState === 1) {
      await AuditLog.create(entry);
    } else {
      inMemoryAuditLogs.unshift({ ...entry, timestamp: new Date() });
      if (inMemoryAuditLogs.length > 500) inMemoryAuditLogs.pop();
    }
  } catch (err) {
    inMemoryAuditLogs.unshift({ ...entry, timestamp: new Date() });
  }
}

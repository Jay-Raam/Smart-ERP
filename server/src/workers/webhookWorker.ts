import { Worker, Queue } from 'bullmq';
import crypto from 'crypto';
import axios from 'axios';
import { redisConnection, redisClient } from '../config/database';
import { recordAudit } from '../models/AuditLog';

export interface WebhookJobData {
  targetUrl: string;
  secretKey: string;
  eventType: string;
  payload: Record<string, any>;
  tenantId: string;
}

let webhookQueue: Queue | null = null;
let webhookWorker: Worker | null = null;

// Initialize BullMQ if Redis is available, else fallback to in-memory async execution
try {
  webhookQueue = new Queue('webhook-dispatch', {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  });

  webhookWorker = new Worker(
    'webhook-dispatch',
    async (job) => {
      await processWebhookJob(job.data);
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  webhookWorker.on('failed', (job, err) => {
    console.error(`[BullMQ Webhook Job ${job?.id} Failed]`, err.message);
  });
} catch (err: any) {
  console.warn('ℹ BullMQ Redis queue unavailable, using direct async dispatcher:', err.message);
}

export async function processWebhookJob(data: WebhookJobData) {
  const { targetUrl, secretKey, eventType, payload, tenantId } = data;
  const timestamp = Date.now();
  const signaturePayload = `${timestamp}.${JSON.stringify(payload)}`;

  // Generate HMAC-SHA256 Cryptographic Signature
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(signaturePayload)
    .digest('hex');

  try {
    const response = await axios.post(targetUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-SaaS-Signature': `t=${timestamp},v1=${signature}`,
        'X-SaaS-Event': eventType,
        'X-SaaS-Tenant-Id': tenantId,
      },
      timeout: 5000,
      validateStatus: () => true, // Don't throw for 4xx/5xx in test webhook simulation
    });

    await recordAudit({
      tenantId,
      userId: 'system-bullmq-worker',
      action: 'WEBHOOK_DELIVERED',
      resource: 'webhook',
      ipAddress: '127.0.0.1',
      userAgent: 'BullMQ-Worker/2.0',
      payloadAfter: { targetUrl, eventType, statusCode: response.status, signatureSample: signature.slice(0, 10) + '...' },
    });

    return { status: response.status, signature };
  } catch (error: any) {
    await recordAudit({
      tenantId,
      userId: 'system-bullmq-worker',
      action: 'WEBHOOK_DELIVERY_FAILED',
      resource: 'webhook',
      ipAddress: '127.0.0.1',
      userAgent: 'BullMQ-Worker/2.0',
      payloadAfter: { targetUrl, eventType, error: error.message },
    });
    throw error;
  }
}

export async function dispatchWebhook(data: WebhookJobData) {
  if (webhookQueue && redisClient.status === 'ready') {
    return await webhookQueue.add('dispatch', data);
  } else {
    // Asynchronous non-blocking dispatch
    setImmediate(async () => {
      try {
        await processWebhookJob(data);
      } catch {}
    });
    return { id: `local-job-${Date.now()}` };
  }
}

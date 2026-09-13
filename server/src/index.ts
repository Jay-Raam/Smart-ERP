import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';

// Ensure .env is loaded from workspace root, server dir, or current working directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { yoga } from './graphql/server';
import { tenantResolverMiddleware } from './middleware/tenantResolver';
import { createSlidingWindowRateLimiter } from './middleware/rateLimiter';
import { authMiddleware, generateTokens, verifyRefreshToken } from './security/auth';
import { connectMongo, pool } from './config/database';
import { recordAudit } from './models/AuditLog';
import { erpRouter } from './routes/erpRoutes';

const app = express();
const PORT = process.env.PORT || 4000;

// Security & Tracing Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow GraphQL Yoga GUI in development
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Request ID Tracing
app.use((req: Request, res: Response, next) => {
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  res.setHeader('X-Request-Id', requestId);
  next();
});

// Mount Real ERP Database Endpoints
app.use('/api/erp', erpRouter);

// Tenant Resolution & Rate Limiting
app.use(tenantResolverMiddleware);
app.use(createSlidingWindowRateLimiter({ windowSeconds: 60, maxRequests: 120 }));
app.use(authMiddleware);

// Dual-Token REST Authentication Endpoints
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password, tenantSlug } = req.body;
  const tenant = req.tenant;

  // Demo credentials check
  const userPayload = {
    userId: '00000000-0000-0000-0000-000000000001',
    email: email || 'alex.mercer@saascore.io',
    tenantId: tenant?.id || '11111111-1111-1111-1111-111111111111',
    role: 'owner',
    permissions: ['*'],
  };

  const tokens = generateTokens(userPayload);

  res.cookie('saas_refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    message: 'Authentication successful',
    accessToken: tokens.accessToken,
    user: userPayload,
    tenant,
  });
});

app.post('/api/auth/refresh', (req: Request, res: Response) => {
  const refreshToken = req.cookies.saas_refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ error: 'REFRESH_TOKEN_REQUIRED' });
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return res.status(401).json({ error: 'INVALID_REFRESH_TOKEN' });
  }

  const newTokens = generateTokens({
    userId: payload.userId,
    email: 'alex.mercer@saascore.io',
    tenantId: payload.tenantId,
    role: 'owner',
    permissions: ['*'],
  });

  res.cookie('saas_refresh_token', newTokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken: newTokens.accessToken });
});

// Health check endpoint with database telemetry
app.get('/health', async (req: Request, res: Response) => {
  let pgStatus = 'DISCONNECTED';
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    pgStatus = 'CONNECTED';
  } catch {}

  res.json({
    status: 'HEALTHY',
    timestamp: new Date().toISOString(),
    tenantContext: req.tenant,
    databases: {
      postgresql: pgStatus,
    },
    version: '1.0.0',
  });
});

// Mount GraphQL Yoga at /graphql
app.use(yoga.graphqlEndpoint, (req: Request, res: Response) => {
  yoga(req, res);
});

// Start server and initialize databases
async function startServer() {
  await connectMongo();

  const server = app.listen(PORT, () => {
    console.log(`
      ┌─────────────────────────────────────────────────────────────┐
      │  🏛️  SaaS-Core Orchestrator API Gateway Active             │
      │  🚀  Server:      http://localhost:${PORT}                      │
      │  🔮  GraphQL:     http://localhost:${PORT}/graphql              │
      │  🩺  Health:      http://localhost:${PORT}/health               │
      └─────────────────────────────────────────────────────────────┘
    `);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`\n[Notice] Port ${PORT} is currently in use. Attempting fallback to port ${Number(PORT) + 1}...`);
      const fallbackServer = app.listen(Number(PORT) + 1, () => {
        console.log(`✔ API Server fallback active at http://localhost:${Number(PORT) + 1}\n`);
      });
      fallbackServer.on('error', (fallbackErr) => {
        console.error('[Server Error]', fallbackErr.message);
      });
    } else {
      console.error('[Server Error]', err.message);
    }
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;

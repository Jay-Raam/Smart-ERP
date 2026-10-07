import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/src/index';
import { connectMongo } from '../server/src/config/database';
import { initPostgresSchema } from '../server/src/services/postgresService';

// Connection state cache across serverless warm invocations
let isDbInitialized = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Ensure MongoDB & PostgreSQL schema are initialized before request execution
  if (!isDbInitialized) {
    try {
      await Promise.all([connectMongo(), initPostgresSchema()]);
      isDbInitialized = true;
    } catch (error) {
      console.error('[Vercel Serverless Gateway] Database cold-start initialization error:', error);
    }
  }

  // Delegate request lifecycle to Express application instance
  return app(req, res);
}

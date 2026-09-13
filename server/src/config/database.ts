import { Pool } from 'pg';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import path from 'path';
import dotenv from 'dotenv';

// Ensure .env is loaded from workspace root, server dir, or current working directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PG_URL = process.env.DATABASE_URL || 'postgresql://saas_admin:super_secret_pg_password@localhost:5432/saas_core';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/saas_audit';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Check if database is cloud-hosted (Supabase, Neon, AWS, Render)
const isCloudPostgres = PG_URL.includes('supabase') || PG_URL.includes('neon') || PG_URL.includes('amazonaws') || PG_URL.includes('render');

// PostgreSQL Connection Pool
export const pool = new Pool({
  connectionString: PG_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: isCloudPostgres ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.warn('[PostgreSQL Pool Notice]', err.message);
});

// Redis Client with graceful error suppression for offline/paused instances
export const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableReadyCheck: false,
  connectTimeout: 4000,
  retryStrategy(times) {
    if (times > 3) return null; // stop retrying after 3 attempts
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true,
});

redisClient.on('error', () => {
  // Silent fallback so development continues smoothly even if Redis cloud instance is paused
});

export const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
};

// MongoDB Connect Helper
export async function connectMongo(): Promise<boolean> {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 4000 });
    console.log('✔ MongoDB Atlas connected successfully');
    return true;
  } catch (error: any) {
    console.warn('ℹ MongoDB connection notice (running in resilient audit trail mode):', error.message);
    return false;
  }
}

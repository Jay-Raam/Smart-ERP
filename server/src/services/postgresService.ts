import { PoolClient } from 'pg';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { pool, redisClient } from '../config/database';

let isPgConnected = false;
let lastPgCheckTime = 0;
const PG_CHECK_INTERVAL_MS = 30000;

/**
 * Checks whether PostgreSQL is actively reachable
 */
export async function isPostgresAvailable(): Promise<boolean> {
  const now = Date.now();
  if (now - lastPgCheckTime < PG_CHECK_INTERVAL_MS && isPgConnected) {
    return isPgConnected;
  }

  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    isPgConnected = true;
    lastPgCheckTime = now;
    return true;
  } catch (err: any) {
    isPgConnected = false;
    lastPgCheckTime = now;
    return false;
  }
}

/**
 * Initializes the Polyglot relational schema if PostgreSQL is reachable
 */
export async function initPostgresSchema(): Promise<boolean> {
  try {
    const available = await isPostgresAvailable();
    if (!available) {
      console.log('ℹ PostgreSQL cloud instance not currently reachable (using MongoDB Atlas as active store).');
      return false;
    }

    const sqlPath = path.resolve(__dirname, '../config/init-polyglot-db.sql');
    if (fs.existsSync(sqlPath)) {
      const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
      await pool.query(sqlContent);
      console.log('✔ PostgreSQL polyglot relational schema verified and initialized.');
      return true;
    }
    return false;
  } catch (err: any) {
    console.warn('[PostgreSQL Init Notice]', err.message);
    return false;
  }
}

/**
 * Executes a callback within a managed ACID transaction with row-level safety
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Record a double-entry financial transaction in PostgreSQL with row-level locks
 */
export async function recordFinancialTransactionPG(data: {
  organisationId: string;
  branchId?: string;
  financialYear?: string;
  bankAccountId: string;
  transactionNumber: string;
  transactionDate: string;
  transactionType: string;
  paymentMode?: string;
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  debitAmount?: number;
  creditAmount?: number;
  description?: string;
  createdBy?: string;
}) {
  return await withTransaction(async (client) => {
    // Acquire exclusive row lock on the target bank account
    const accResult = await client.query(
      `SELECT id, current_balance FROM public.bank_accounts WHERE id = $1 FOR UPDATE`,
      [data.bankAccountId]
    );

    let currentBalance = 0;
    if (accResult.rows.length > 0) {
      currentBalance = Number(accResult.rows[0].current_balance) || 0;
    }

    const debit = Number(data.debitAmount) || 0;
    const credit = Number(data.creditAmount) || 0;
    const newBalance = currentBalance + credit - debit;

    // Insert financial transaction ledger entry
    const insertTxQuery = `
      INSERT INTO public.financial_transactions (
        organisation_id,
        branch_id,
        financial_year,
        bank_account_id,
        transaction_number,
        transaction_date,
        transaction_type,
        payment_mode,
        reference_type,
        reference_id,
        reference_number,
        debit_amount,
        credit_amount,
        running_balance,
        description,
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING *;
    `;

    const txRes = await client.query(insertTxQuery, [
      data.organisationId,
      data.branchId || null,
      data.financialYear || '2026-2027',
      data.bankAccountId,
      data.transactionNumber,
      data.transactionDate,
      data.transactionType,
      data.paymentMode || 'NEFT/RTGS',
      data.referenceType || null,
      data.referenceId || null,
      data.referenceNumber || null,
      debit,
      credit,
      newBalance,
      data.description || null,
      data.createdBy || 'System',
    ]);

    // Update account balance
    if (accResult.rows.length > 0) {
      await client.query(
        `UPDATE public.bank_accounts SET current_balance = $1, updated_at = NOW() WHERE id = $2`,
        [newBalance, data.bankAccountId]
      );
    }

    return txRes.rows[0];
  });
}

/**
 * Retrieve financial transactions ledger from PostgreSQL
 */
export async function getFinancialTransactionsPG(filter: {
  organisationId: string;
  branchId?: string;
  financialYear?: string;
  bankAccountId?: string;
  limit?: number;
  offset?: number;
}) {
  const params: any[] = [filter.organisationId];
  let whereClauses = ['organisation_id = $1'];

  if (filter.branchId) {
    params.push(filter.branchId);
    whereClauses.push(`branch_id = $${params.length}`);
  }
  if (filter.financialYear) {
    params.push(filter.financialYear);
    whereClauses.push(`financial_year = $${params.length}`);
  }
  if (filter.bankAccountId) {
    params.push(filter.bankAccountId);
    whereClauses.push(`bank_account_id = $${params.length}`);
  }

  const whereSql = whereClauses.join(' AND ');
  const limit = filter.limit || 50;
  const offset = filter.offset || 0;

  const countQuery = `SELECT COUNT(*) AS total FROM public.financial_transactions WHERE ${whereSql};`;
  const dataQuery = `
    SELECT * FROM public.financial_transactions 
    WHERE ${whereSql}
    ORDER BY transaction_date DESC, created_at DESC 
    LIMIT $${params.length + 1} OFFSET $${params.length + 2};
  `;

  const [countRes, dataRes] = await Promise.all([
    pool.query(countQuery, params),
    pool.query(dataQuery, [...params, limit, offset]),
  ]);

  return {
    total: parseInt(countRes.rows[0]?.total || '0', 10),
    transactions: dataRes.rows,
  };
}

/**
 * Health telemetry for all 3 tiers of the enterprise polyglot stack
 */
export async function getPolyglotHealthTelemetry() {
  let pgStatus = 'DISCONNECTED';
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    pgStatus = 'CONNECTED';
  } catch (err: any) {
    pgStatus = err.message?.includes('tenant') ? 'PAUSED' : 'OFFLINE';
  }

  const mongoState = mongoose.connection.readyState;
  const mongoStatus = mongoState === 1 ? 'CONNECTED' : mongoState === 2 ? 'CONNECTING' : 'DISCONNECTED';

  let redisStatus = 'STANDBY';
  try {
    if (redisClient.status === 'ready') {
      redisStatus = 'CONNECTED';
    } else {
      redisStatus = 'STANDBY';
    }
  } catch {
    redisStatus = 'OFFLINE';
  }

  return {
    architecture: 'Enterprise Polyglot Multi-Model',
    tiers: {
      relational_core: {
        engine: 'PostgreSQL',
        role: 'ACID Financial Ledgers, Bank Accounts & Relational RBAC Hierarchy',
        status: pgStatus,
      },
      document_store: {
        engine: 'MongoDB Atlas',
        role: 'Append-Only Audit Trails, High-Throughput Event Store & Document Storage',
        status: mongoStatus,
      },
      cache_layer: {
        engine: 'Redis',
        role: 'Sliding-Window Rate Limiting, Active Session Keys & High-Speed Caching',
        status: redisStatus,
      },
    },
    resilience_strategy: 'Dual-Store Dynamic Failover Active',
  };
}

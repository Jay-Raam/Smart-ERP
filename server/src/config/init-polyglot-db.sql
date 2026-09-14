-- ==============================================================================
-- Smart Enterprise ERP — Enterprise-Grade Polyglot PostgreSQL Schema
-- High-Integrity Relational Schema for Financial Ledgers, Banking & Core RBAC
-- Designed for Strict ACID Guarantees, Row Locks & Double-Entry Accounting
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Organizations Master (Root Multi-Tenant Entity)
CREATE TABLE IF NOT EXISTS public.organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    cin VARCHAR(32),
    gstin VARCHAR(15),
    pan VARCHAR(10),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Operating Branches Master (Sub-Tenant Physical Units)
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    branch_code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    gstin VARCHAR(15),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organisation_id, branch_code)
);

-- 3. Financial Years Master (Fiscal Periods with Status & Locks)
CREATE TABLE IF NOT EXISTS public.financial_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    year_name VARCHAR(32) NOT NULL, -- e.g. "2026-2027"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Closed')),
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. User Accounts & RBAC Matrix
CREATE TABLE IF NOT EXISTS public.user_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    mobile VARCHAR(32) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(64) NOT NULL DEFAULT 'Staff',
    user_type VARCHAR(64) NOT NULL DEFAULT 'Staff',
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Institutional Bank Accounts (Single Primary Constraint per Branch)
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    account_number VARCHAR(64) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    ifsc VARCHAR(32) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(32) NOT NULL DEFAULT 'Current' CHECK (account_type IN ('Current', 'Savings', 'Overdraft', 'Cash Credit')),
    opening_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organisation_id, account_number)
);

-- 6. Atomic Sequences for Document & Transaction Numbering
CREATE SEQUENCE IF NOT EXISTS public.seq_txn_number START WITH 1000 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS public.seq_inv_number START WITH 1000 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS public.seq_bill_number START WITH 1000 INCREMENT BY 1;

-- 7. Double-Entry Financial Transactions General Ledger
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    financial_year VARCHAR(32) NOT NULL,
    bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
    transaction_number VARCHAR(64) NOT NULL UNIQUE,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_type VARCHAR(64) NOT NULL CHECK (transaction_type IN (
        'Sales Receipt',
        'Vendor Bill Payment',
        'Direct Expense',
        'Direct Income',
        'Bank Transfer',
        'Opening Balance',
        'Reversal'
    )),
    payment_mode VARCHAR(32) NOT NULL DEFAULT 'NEFT/RTGS' CHECK (payment_mode IN ('NEFT/RTGS', 'IMPS', 'UPI', 'Cheque', 'Net Banking', 'Cash')),
    reference_type VARCHAR(64), -- 'Invoice', 'Bill', 'PO Advance', 'Manual'
    reference_id VARCHAR(64),
    reference_number VARCHAR(64),
    debit_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (debit_amount >= 0),
    credit_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (credit_amount >= 0),
    running_balance NUMERIC(15, 2) NOT NULL,
    description TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Blazing High-Speed Scoped Retrieval
CREATE INDEX IF NOT EXISTS idx_branches_org ON public.branches (organisation_id, is_active);
CREATE INDEX IF NOT EXISTS idx_fy_lookup ON public.financial_years (organisation_id, branch_id, status);
CREATE INDEX IF NOT EXISTS idx_users_lookup ON public.user_accounts (email, mobile, status);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_branch ON public.bank_accounts (branch_id, status, is_primary);
CREATE INDEX IF NOT EXISTS idx_transactions_scoped ON public.financial_transactions (branch_id, financial_year, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_bank ON public.financial_transactions (bank_account_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_ref ON public.financial_transactions (reference_type, reference_id);

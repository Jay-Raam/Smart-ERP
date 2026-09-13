-- ==============================================================================
-- SaaS-Core Multi-Tenant PostgreSQL Schema Initialization & Dynamic Provisioning
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS public;

-- Platform Global Tenants Registry
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(63) NOT NULL UNIQUE,          -- e.g. "acme" -> acme.saascore.io
    name VARCHAR(255) NOT NULL,
    custom_domain VARCHAR(255) UNIQUE,         -- e.g. "portal.acme.com"
    plan_tier VARCHAR(32) NOT NULL DEFAULT 'starter' CHECK (plan_tier IN ('starter', 'growth', 'enterprise')),
    schema_name VARCHAR(63) NOT NULL UNIQUE,   -- e.g. "tenant_acme"
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deprovisioned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Global Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_superadmin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tenant Membership & RBAC Bridge
CREATE TABLE IF NOT EXISTS public.tenant_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

-- Indexing Strategy
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants (slug);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON public.tenants (custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_tenant_members_lookup ON public.tenant_members (user_id, tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tenant_members_permissions_gin ON public.tenant_members USING gin (permissions);

-- ------------------------------------------------------------------------------
-- Dynamic Tenant Schema Provisioning Function
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.provision_new_tenant(
    p_tenant_slug VARCHAR,
    p_tenant_name VARCHAR,
    p_owner_user_id UUID,
    p_plan_tier VARCHAR DEFAULT 'enterprise'
) RETURNS UUID AS $$
DECLARE
    v_tenant_id UUID;
    v_schema_name VARCHAR;
BEGIN
    v_schema_name := 'tenant_' || lower(regexp_replace(p_tenant_slug, '[^a-zA-Z0-9_]', '', 'g'));

    -- 1. Insert into public.tenants
    INSERT INTO public.tenants (slug, name, schema_name, plan_tier)
    VALUES (p_tenant_slug, p_tenant_name, v_schema_name, p_plan_tier)
    ON CONFLICT (slug) DO UPDATE 
        SET name = EXCLUDED.name,
            updated_at = NOW()
    RETURNING id INTO v_tenant_id;

    -- 2. Bind owner to tenant
    INSERT INTO public.tenant_members (tenant_id, user_id, role, permissions)
    VALUES (v_tenant_id, p_owner_user_id, 'owner', '["*"]'::jsonb)
    ON CONFLICT (tenant_id, user_id) DO NOTHING;

    -- 3. Dynamically create isolated schema
    EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || quote_ident(v_schema_name);

    -- 4. Create Tenant-Specific Tables
    EXECUTE '
        CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            code VARCHAR(32) NOT NULL UNIQUE,
            budget NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
            status VARCHAR(32) NOT NULL DEFAULT ''in_progress'',
            created_by UUID NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.invoices (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            invoice_number VARCHAR(64) NOT NULL UNIQUE,
            project_id UUID REFERENCES ' || quote_ident(v_schema_name) || '.projects(id) ON DELETE SET NULL,
            subtotal NUMERIC(15, 2) NOT NULL,
            tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
            total_amount NUMERIC(15, 2) NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT ''draft'',
            issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
            due_date DATE NOT NULL DEFAULT CURRENT_DATE + INTERVAL ''30 days'',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.webhook_subscriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            target_url TEXT NOT NULL,
            secret_key VARCHAR(128) NOT NULL,
            events TEXT[] NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON ' || quote_ident(v_schema_name) || '.invoices (project_id);
        CREATE INDEX IF NOT EXISTS idx_invoices_status ON ' || quote_ident(v_schema_name) || '.invoices (status);
        CREATE INDEX IF NOT EXISTS idx_projects_code ON ' || quote_ident(v_schema_name) || '.projects (code);
    ';

    RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- Seed Default Admin and Demo Tenants: Acme Corp and Globex Intl
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_admin_id UUID;
    v_acme_id UUID;
    v_globex_id UUID;
    v_acme_proj_alpha UUID;
    v_acme_proj_beta UUID;
    v_globex_proj_apex UUID;
BEGIN
    -- Insert Default Platform Admin (Password: "Admin@123456" hashed with bcrypt)
    INSERT INTO public.users (id, email, password_hash, full_name, is_superadmin)
    VALUES (
        '00000000-0000-0000-0000-000000000001',
        'alex.mercer@saascore.io',
        '$2a$12$e8Y04.CknDghN40G7Kk8Aup50U1W8s1v5Oa2rK19m8H7xQ2x8/wU.',
        'Alex Mercer',
        TRUE
    ) ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO v_admin_id;

    -- Provision Acme Corp
    v_acme_id := public.provision_new_tenant('acme', 'Acme Corporation', v_admin_id, 'enterprise');

    -- Provision Globex Intl
    v_globex_id := public.provision_new_tenant('globex', 'Globex International', v_admin_id, 'growth');

    -- Seed Projects & Invoices for Acme (tenant_acme)
    INSERT INTO tenant_acme.projects (name, code, budget, status, created_by)
    VALUES 
        ('Quantum Ledger Overhaul', 'PRJ-ALPHA', 125000.00, 'in_progress', v_admin_id)
    ON CONFLICT (code) DO NOTHING
    RETURNING id INTO v_acme_proj_alpha;

    IF v_acme_proj_alpha IS NULL THEN
        SELECT id INTO v_acme_proj_alpha FROM tenant_acme.projects WHERE code = 'PRJ-ALPHA';
    END IF;

    INSERT INTO tenant_acme.projects (name, code, budget, status, created_by)
    VALUES 
        ('Neural Zero Trust Gateway', 'PRJ-BETA', 84000.00, 'in_progress', v_admin_id)
    ON CONFLICT (code) DO NOTHING
    RETURNING id INTO v_acme_proj_beta;

    IF v_acme_proj_beta IS NULL THEN
        SELECT id INTO v_acme_proj_beta FROM tenant_acme.projects WHERE code = 'PRJ-BETA';
    END IF;

    INSERT INTO tenant_acme.invoices (invoice_number, project_id, subtotal, tax_rate, total_amount, status, due_date)
    VALUES
        ('INV-2026-001', v_acme_proj_alpha, 12500.00, 18.00, 14750.00, 'paid', CURRENT_DATE + INTERVAL '10 days'),
        ('INV-2026-002', v_acme_proj_beta, 8400.00, 18.00, 9912.00, 'pending', CURRENT_DATE + INTERVAL '20 days'),
        ('INV-2026-003', v_acme_proj_alpha, 34000.00, 18.00, 40120.00, 'paid', CURRENT_DATE + INTERVAL '30 days')
    ON CONFLICT (invoice_number) DO NOTHING;

    -- Seed Projects & Invoices for Globex (tenant_globex)
    INSERT INTO tenant_globex.projects (name, code, budget, status, created_by)
    VALUES 
        ('Apex Sovereign Cloud Hub', 'PRJ-APEX', 320000.00, 'in_progress', v_admin_id)
    ON CONFLICT (code) DO NOTHING
    RETURNING id INTO v_globex_proj_apex;

    IF v_globex_proj_apex IS NULL THEN
        SELECT id INTO v_globex_proj_apex FROM tenant_globex.projects WHERE code = 'PRJ-APEX';
    END IF;

    INSERT INTO tenant_globex.invoices (invoice_number, project_id, subtotal, tax_rate, total_amount, status, due_date)
    VALUES
        ('GLX-2026-101', v_globex_proj_apex, 45000.00, 18.00, 53100.00, 'paid', CURRENT_DATE + INTERVAL '14 days'),
        ('GLX-2026-102', v_globex_proj_apex, 28000.00, 18.00, 33040.00, 'pending', CURRENT_DATE + INTERVAL '28 days')
    ON CONFLICT (invoice_number) DO NOTHING;

    -- Seed Webhook Subscriptions
    INSERT INTO tenant_acme.webhook_subscriptions (target_url, secret_key, events)
    VALUES ('https://hooks.acmeweb.net/saas-events', 'whsec_acme_prod_7782194aef91c80b', ARRAY['invoice.created', 'invoice.paid'])
    ON CONFLICT DO NOTHING;

END $$;

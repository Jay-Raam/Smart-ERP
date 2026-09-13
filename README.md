# ✦ SaaS-Core: Multi-Tenant Enterprise B2B SaaS Orchestrator & Ultra-Premium Frontend Design System

> Inspired by **[Third Studio](https://third-studio.vercel.app/)** Aesthetic & Motion Engineering.
> Built on **React 19**, **Three.js WebGL**, **Tailwind CSS**, **GraphQL Yoga**, **PostgreSQL Schema Isolation**, **MongoDB Atlas**, **Redis**, and **BullMQ**.

---

## 📑 Architecture Overview

```
                                  ┌────────────────────────────────┐
                                  │      React 19 Client UI        │
                                  │  • Three.js 3D Particle Graph  │
                                  │  • Spotlight Cursor Glow       │
                                  │  • ⌘K Fuzzy Command Palette    │
                                  │  • Enterprise Invoicing Table  │
                                  └───────────────┬────────────────┘
                                                  │ HTTP / GraphQL
                                                  ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             Express Gateway & Security Pipeline Layer                            │
│  • Subdomain / Header Tenant Resolver  (acme.saascore.io -> tenant_acme)                         │
│  • Redis Sliding-Window Distributed Rate Limiting (120 req / 60s)                                │
│  • Dual-Token JWT Protocol (15-min Memory Access Token + 7-day HttpOnly Strict Refresh Cookie)   │
│  • Granular RBAC Engine: owner (*), admin, member, viewer                                        │
└─────────────────────────────┬───────────────────┬──────────────────────────┬─────────────────────┘
                              │                   │                          │
                              ▼                   ▼                          ▼
               ┌───────────────────────┐ ┌─────────────────┐      ┌────────────────────┐
               │     GraphQL Yoga      │ │  MongoDB Atlas  │      │   Redis / BullMQ   │
               │  • Connection Leases  │ │  • Audit Trails │      │  • Sliding Limits  │
               │  • DataLoaders (N+1)  │ │  • 365-Day TTL  │      │  • Hot Meta Cache  │
               │  • Schema-per-tenant  │ │  • Compound Idx │      │  • HMAC Webhooks   │
               └──────────┬────────────┘ └─────────────────┘      └────────────────────┘
                          │
                          ▼
               ┌─────────────────────────────────────────────────────────────────┐
               │                   PostgreSQL 16 Database                        │
               │  • public: tenants, users, tenant_members                       │
               │  • tenant_acme: projects, invoices, webhook_subscriptions       │
               │  • tenant_globex: projects, invoices, webhook_subscriptions     │
               └─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Visual DNA & Design System

The frontend is styled according to the **Third Studio** luxury engineering aesthetic:
- **Obsidian Dark Surfaces**: Deep `#050505` and `#0A0A0A` backdrops with architectural grid patterns.
- **Neon Volt Accents**: Third Studio signature neon volt (`#D4FF00`) with real-time telemetry cyan (`#00F0FF`).
- **Interactive Three.js Spatial Background**: 2,000-particle spherical cluster with additive blending and mouse-coordinate responsive tilt.
- **Spotlight Cards**: Radial cursor-following lighting gradient (`rgba(212, 255, 0, 0.08)`) with `backdrop-blur-2xl`.
- **Luxury Command Palette (`⌘K` / `Ctrl+K`)**: Instant keyboard navigation, tenant switcher (`⌘1`, `⌘2`, `⌘3`), invoice creation, and RBAC role simulation.
- **Enterprise Invoicing Table**: Schema-leased data presentation with search, status filters, and CSV report export.
- **Declarative RBAC (`<CanAccess />`)**: Granular UI gating ensuring unauthorized operations are disabled or hidden.

---

## 🚀 Quick Start

### 1. Run with Docker Compose (Full Stack + Databases)

```bash
docker compose up --build
```
This spins up:
- **PostgreSQL 16** on `:5432` with auto-initialized schemas and seed data (`init-db.sql`)
- **MongoDB 7.0** on `:27017`
- **Redis 7.2** on `:6379`
- **SaaS-Core API Server** on `:4000`

### 2. Run Local Development (Zero-Config Mode)

The system includes built-in mock and local fallback simulation so you can immediately explore the UI and architecture without external DB setup:

```bash
# Install root dependencies
npm install

# Start development servers
npm run dev:client   # Starts Vite React client at http://localhost:5173
npm run dev:server   # Starts Express + GraphQL Yoga at http://localhost:4000
```

---

## 🧪 Testing

Run backend tests verifying tenant resolution, dual-token JWT rotation, and RBAC permission matrices:

```bash
npm test
```

---

## 📂 Repository Structure

```
├── client/                               # Frontend Architecture (React 19 + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── canvas/
│   │   │   │   └── TenantNetworkScene.tsx # Three.js 3D WebGL Background
│   │   │   ├── dashboard/
│   │   │   │   └── BentoTelemetryGrid.tsx # Glassmorphic Bento Metrics Grid
│   │   │   ├── table/
│   │   │   │   └── EnterpriseDataTable.tsx# Isolated Schema Invoices Table
│   │   │   ├── ui/
│   │   │   │   ├── AnimatedCounter.tsx    # Framer Motion Spring Numbers
│   │   │   │   ├── CommandPalette.tsx     # Luxury ⌘K Fuzzy Palette
│   │   │   │   ├── Sparkline.tsx          # Real-time Telemetry Trendlines
│   │   │   │   └── SpotlightCard.tsx      # Cursor Tracking Glow Card
│   │   │   └── CanAccess.tsx              # Declarative RBAC Component Guard
│   │   ├── hooks/
│   │   │   └── useTenantData.ts           # GraphQL Queries & Mutations
│   │   ├── store/
│   │   │   └── authStore.ts               # Zustand Multi-Tenant State
│   │   ├── styles/
│   │   │   └── theme.css                  # Third Studio Design Tokens
│   │   ├── App.tsx                        # Master Orchestrator Dashboard
│   │   └── main.tsx                       # React 19 Entry & React Query
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                               # Backend Orchestrator (Express + GraphQL)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts                # PostgreSQL, MongoDB & Redis Pools
│   │   ├── graphql/
│   │   │   ├── dataloaders.ts             # N+1 Query Eliminator
│   │   │   ├── resolvers.ts               # Tenant Leased Resolvers
│   │   │   ├── server.ts                  # GraphQL Yoga Factory
│   │   │   └── typeDefs.ts                # Schema Definitions
│   │   ├── middleware/
│   │   │   ├── rateLimiter.ts             # Redis Sliding-Window Limiter
│   │   │   └── tenantResolver.ts          # Subdomain/Header Dynamic Lease
│   │   ├── models/
│   │   │   └── AuditLog.ts                # MongoDB TTL Mongoose Schema
│   │   ├── security/
│   │   │   ├── auth.ts                    # Dual-Token JWT Generator
│   │   │   └── rbac.ts                    # Granular Permission Guard
│   │   ├── workers/
│   │   │   └── webhookWorker.ts           # BullMQ HMAC-SHA256 Dispatcher
│   │   ├── index.ts                       # Express Entry & Gateway
│   │   └── index.test.ts                  # Vitest Security & RBAC Suite
│   ├── package.json
│   └── tsconfig.json
│
├── .github/workflows/ci.yml              # CI/CD Pipeline Matrix
├── docker-compose.yml                     # Multi-Service Orchestration
├── Dockerfile                             # Multi-Stage Production Build
├── init-db.sql                            # Dynamic PostgreSQL Schema DDL
├── package.json                           # Root Workspace Orchestrator
└── README.md
```

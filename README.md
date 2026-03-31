# SaaS Project Management Tool

> Enterprise-grade, multi-tenant project management platform inspired by Asana and Azure DevOps.
> Supports 500+ concurrent users, configurable workflows, role-based access control, and AI-powered features.

---

## Table of Contents

1. [System Overview & Architecture](#1-system-overview--architecture)
2. [Database Design](#2-database-design)
3. [API Design](#3-api-design)
4. [UI/UX Wireframes](#4-uiux-wireframes)
5. [Configuration System](#5-configuration-system)
6. [AI Integration](#6-ai-integration)
7. [Scope of Work](#7-scope-of-work)
8. [Feature List](#8-feature-list)
9. [Team Structure & Cost](#9-team-structure--cost)
10. [Best Practices & Risks](#10-best-practices--risks)

---

## 1. System Overview & Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          INTERNET / CDN (CloudFront)                        │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────────┐
│                        LOAD BALANCER (AWS ALB / Nginx)                      │
│                    SSL Termination | Rate Limiting | WAF                    │
└──────────┬─────────────────────────────────────────────┬────────────────────┘
           │                                             │
┌──────────▼──────────┐                    ┌────────────▼──────────┐
│   FRONTEND TIER     │                    │    API GATEWAY         │
│  React 18 + Vite    │                    │  (Kong / AWS API GW)   │
│  Hosted: S3 + CF    │                    │  Auth | Throttle | Log │
│  PWA + SSR option   │                    └────────────┬──────────┘
└─────────────────────┘                                 │
                                         ┌──────────────▼──────────────┐
                                         │      BACKEND SERVICES        │
                              ┌──────────┴──────────────────────────────┴──────────┐
                              │                                                     │
                   ┌──────────▼──────────┐                        ┌────────────────▼──────┐
                   │   Core API Service  │                        │   Worker / Queue Svc   │
                   │  Node.js + Express  │                        │  BullMQ + Redis        │
                   │  Clustered (PM2)    │                        │  Emails | Notifs | AI  │
                   │  4 replicas         │                        └────────────────────────┘
                   └──────────┬──────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
┌─────────▼────────┐ ┌────────▼───────┐ ┌────────▼────────┐
│  PRIMARY DB      │ │  REDIS CLUSTER │ │  OBJECT STORE   │
│  PostgreSQL 15   │ │  Cache+Session │ │  AWS S3         │
│  RDS Multi-AZ    │ │  Pub/Sub       │ │  Attachments    │
│  Read Replicas   │ │                │ │  Exports        │
└──────────────────┘ └────────────────┘ └─────────────────┘
          │
┌─────────▼────────┐
│  READ REPLICA    │
│  PostgreSQL 15   │
│  Reports / BI    │
└──────────────────┘

OBSERVABILITY:
  ┌────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐
  │ Prometheus │  │   Grafana    │  │   Sentry    │  │  CloudWatch  │
  │  Metrics  │  │  Dashboards  │  │  Error Trk  │  │    Logs      │
  └────────────┘  └──────────────┘  └─────────────┘  └──────────────┘
```

### Tenant Isolation Model

```
SCHEMA-BASED MULTI-TENANCY (PostgreSQL Row-Level Security)

┌──────────────────────────────────────────────────┐
│                PostgreSQL Database               │
│                                                  │
│  ┌──────────────────┐  ┌──────────────────┐      │
│  │  org_id = uuid-1 │  │  org_id = uuid-2 │      │
│  │  Tenant: Acme    │  │  Tenant: GlobalX │      │
│  │  - Projects      │  │  - Projects      │      │
│  │  - Tasks         │  │  - Tasks         │      │
│  │  - Users         │  │  - Users         │      │
│  │  - Configs       │  │  - Configs       │      │
│  └──────────────────┘  └──────────────────┘      │
│                                                  │
│  RLS Policy: WHERE org_id = current_org_id()     │
└──────────────────────────────────────────────────┘
```

### Recommended Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React 18 + TypeScript | Component reuse, large ecosystem |
| **State Mgmt** | Zustand + React Query | Lightweight, server-state caching |
| **UI Library** | shadcn/ui + Tailwind CSS | Fully customizable, accessible |
| **Drag & Drop** | @dnd-kit/core | Modern, accessible DnD |
| **Charts** | Recharts | Lightweight, composable |
| **Backend** | Node.js 20 + Express 5 | High throughput, async I/O |
| **ORM** | Prisma 5 | Type-safe, migrations |
| **Auth** | JWT + Refresh Tokens | Stateless, scalable |
| **Database** | PostgreSQL 15 (RDS) | JSONB, RLS, full-text search |
| **Cache** | Redis 7 (ElastiCache) | Session, pub/sub, job queue |
| **Queue** | BullMQ | Reliable background jobs |
| **File Storage** | AWS S3 + CloudFront | Scalable object storage |
| **Email** | AWS SES / SendGrid | Transactional email |
| **AI** | Anthropic Claude API | Task generation, summaries |
| **CI/CD** | GitHub Actions + ECR | Automated pipelines |
| **Container** | Docker + ECS Fargate | Serverless containers |
| **IaC** | Terraform | Reproducible infra |
| **Monitoring** | Prometheus + Grafana | Metrics & alerting |
| **Logging** | Winston + CloudWatch | Centralized logs |
| **Error Tracking** | Sentry | Real-time error monitoring |

### Scalability Approach (500 Concurrent Users)

```
LOAD CALCULATION:
  - 500 concurrent users
  - Peak: ~50 API req/user/min = 25,000 req/min = ~416 req/sec
  - DB connections: 500 users × 2 connections = 1,000 (use PgBouncer)
  - WebSocket connections: 500 (for real-time updates)

SCALING STRATEGY:
  ┌─────────────────────────────────────────────────────┐
  │  Horizontal Pod Autoscaling (HPA)                   │
  │                                                     │
  │  API Servers:   4 pods × 2 CPU / 4GB RAM            │
  │  Workers:       2 pods × 1 CPU / 2GB RAM            │
  │  Redis:         Cluster mode (3 shards)             │
  │  PostgreSQL:    1 Primary + 2 Read Replicas         │
  │  PgBouncer:     Connection pooling (max 100/pool)   │
  └─────────────────────────────────────────────────────┘

  Caching Strategy:
  - L1: In-process LRU cache (org configs, permissions)
  - L2: Redis cache (user sessions, dashboard data, TTL 5min)
  - L3: CDN cache (static assets, public reports)

  Read/Write Split:
  - Writes → Primary PostgreSQL
  - Reports/Analytics → Read Replica
  - Aggregate queries → Materialized views (refreshed every 5min)
```

### Security Considerations

| Area | Implementation |
|------|---------------|
| **Authentication** | JWT (15min) + Refresh Token (7 days) + HttpOnly cookies |
| **Authorization** | RBAC with Row-Level Security (PostgreSQL RLS) |
| **Data Isolation** | org_id column on every table + RLS policies |
| **Input Validation** | Zod schemas at API boundary |
| **SQL Injection** | Parameterized queries via Prisma ORM |
| **XSS** | Content Security Policy headers + DOMPurify |
| **CSRF** | SameSite cookies + CSRF token for mutations |
| **Rate Limiting** | 100 req/min per IP, 1000 req/min per org |
| **Secrets** | AWS Secrets Manager / HashiCorp Vault |
| **Encryption at Rest** | AES-256 (RDS encrypted, S3 SSE) |
| **Encryption in Transit** | TLS 1.3 enforced |
| **Audit Logging** | Immutable activity_logs table per org |
| **Compliance** | SOC 2 Type II readiness, GDPR-ready |

---

## Project Structure

```
project-management-tool/
├── README.md
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── docs/
│   ├── 01-architecture.md
│   ├── 02-database-schema.sql
│   ├── 03-api-design.yaml         # OpenAPI 3.0 spec
│   ├── 04-ui-wireframes.md
│   ├── 05-configuration-system.md
│   ├── 06-ai-integration.md
│   ├── 07-scope-of-work.md
│   ├── 08-feature-list.md
│   ├── 09-team-cost.md
│   └── 10-best-practices-risks.md
├── database/
│   ├── schema.sql                 # Full schema DDL
│   ├── indexes.sql                # Index strategy
│   ├── rls-policies.sql           # Row-Level Security
│   └── seed.sql                   # Sample data (2 orgs)
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── utils/
│   │   └── app.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ui/               # shadcn/ui base components
    │   │   ├── layout/           # Header, Sidebar, Shell
    │   │   ├── admin/            # Admin-specific components
    │   │   ├── pm/               # Project Manager components
    │   │   └── user/             # User-specific components
    │   ├── pages/
    │   ├── hooks/
    │   ├── store/
    │   ├── api/
    │   ├── lib/
    │   └── App.tsx
    ├── package.json
    ├── vite.config.ts
    └── Dockerfile
```

---

*See individual documentation files in `/docs` for detailed specifications.*
*See `/database` for complete SQL schema and seed data.*
*See `/backend` and `/frontend` for implementation scaffolding.*

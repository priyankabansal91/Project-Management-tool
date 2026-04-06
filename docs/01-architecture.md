# 1. System Overview & Architecture

> Complete architecture specification for the SaaS Project Management Tool.

---

## 1.1 High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            INTERNET / CDN (CloudFront)                           │
│                        Static assets (JS/CSS/images) cached                      │
└──────────────────────────────────┬───────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         LOAD BALANCER (AWS ALB / Nginx)                           │
│                     SSL Termination │ Rate Limiting │ WAF                         │
│                     Health checks   │ Geo-routing   │ DDoS protection             │
└──────────┬──────────────────────────────────────────────────┬────────────────────┘
           │                                                  │
           ▼                                                  ▼
┌─────────────────────────┐                    ┌──────────────────────────┐
│    FRONTEND TIER        │                    │     API GATEWAY           │
│    React 18 + Vite      │                    │    (Kong / AWS API GW)    │
│    Hosted: S3 + CF      │                    │    JWT Validation         │
│    PWA-enabled          │                    │    Rate Limiting          │
│    SSR optional (Next)  │                    │    Request Logging        │
└─────────────────────────┘                    │    API Versioning         │
                                               └────────────┬─────────────┘
                                                            │
                                            ┌───────────────▼───────────────┐
                                            │       BACKEND SERVICES         │
                                 ┌──────────┴───────────────────────────────┴──────────┐
                                 │                                                      │
                      ┌──────────▼───────────┐                     ┌───────────────────▼───────┐
                      │   Core API Service   │                     │   Background Workers       │
                      │   Node.js + Express  │                     │   BullMQ + Redis           │
                      │   Clustered (PM2)    │◄────WebSocket──────►│   - Email notifications    │
                      │   4 replicas min     │                     │   - AI task generation      │
                      │                      │                     │   - Report generation       │
                      └──────────┬───────────┘                     │   - Audit log processing    │
                                 │                                 │   - Scheduled jobs          │
                                 │                                 └───────────────────────────┘
             ┌───────────────────┼───────────────────┐
             │                   │                   │
   ┌─────────▼────────┐ ┌───────▼────────┐ ┌───────▼─────────┐
   │  PRIMARY DB       │ │  REDIS CLUSTER │ │  OBJECT STORE   │
   │  PostgreSQL 15    │ │  Cache+Session │ │  AWS S3          │
   │  RDS Multi-AZ     │ │  Pub/Sub       │ │  Attachments     │
   │  Connection Pool  │ │  Job Queue     │ │  Exports/Reports │
   └────────┬──────────┘ └────────────────┘ └─────────────────┘
            │
  ┌─────────▼──────────┐
  │  READ REPLICA(s)   │
  │  PostgreSQL 15     │
  │  Reports / BI      │
  │  Dashboard queries │
  └────────────────────┘

OBSERVABILITY LAYER:
  ┌────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐
  │ Prometheus │  │   Grafana    │  │   Sentry    │  │  CloudWatch  │
  │  Metrics   │  │  Dashboards  │  │  Error Trk  │  │    Logs      │
  └────────────┘  └──────────────┘  └─────────────┘  └──────────────┘
```

---

## 1.2 Multi-Tenant Isolation Model

We use **shared database, shared schema** with **Row-Level Security (RLS)** — the most cost-effective approach for 500 concurrent users that still provides strong data isolation.

```
┌──────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                        │
│                                                              │
│  ┌────────────────────┐     ┌────────────────────┐           │
│  │  org_id = uuid-1   │     │  org_id = uuid-2   │           │
│  │  Tenant: Acme Corp │     │  Tenant: GlobalTech │           │
│  │  ┌──────────────┐  │     │  ┌──────────────┐  │           │
│  │  │ Projects (3) │  │     │  │ Projects (5) │  │           │
│  │  │ Tasks (45)   │  │     │  │ Tasks (120)  │  │           │
│  │  │ Users (15)   │  │     │  │ Users (30)   │  │           │
│  │  │ Configs      │  │     │  │ Configs      │  │           │
│  │  └──────────────┘  │     │  └──────────────┘  │           │
│  └────────────────────┘     └────────────────────┘           │
│                                                              │
│  RLS Policy: WHERE org_id = current_setting('app.org_id')    │
│  Enforced at DB level — even app bugs cannot leak data       │
└──────────────────────────────────────────────────────────────┘
```

### Why RLS over Schema-per-Tenant?

| Criteria | Shared Schema + RLS | Schema-per-Tenant |
|----------|--------------------|--------------------|
| Operational complexity | Low | High (DDL per tenant) |
| Migration effort | Single migration | N migrations |
| Connection pooling | Simple | Complex (schema switching) |
| Cross-tenant queries | Impossible (RLS) | Possible (risk) |
| Cost at 500 users | Low | Medium |
| Scaling to 10K+ tenants | Excellent | Poor |

---

## 1.3 Recommended Tech Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| **Frontend** | React + TypeScript | 18.x | Component reuse, huge ecosystem, hiring pool |
| **Build Tool** | Vite | 5.x | Fast HMR, ESBuild bundling |
| **State Mgmt** | Zustand + React Query | Latest | Lightweight store + server-state caching |
| **UI Library** | shadcn/ui + Tailwind CSS | Latest | Accessible, customizable, no vendor lock |
| **Drag & Drop** | @dnd-kit/core | 6.x | Modern, accessible, performant |
| **Charts** | Recharts | 2.x | Composable SVG charts, React-native |
| **Real-time** | Socket.io | 4.x | WebSocket with fallback, room-based |
| **Backend** | Node.js + Express | 20 LTS / 5.x | High throughput, non-blocking I/O |
| **ORM** | Prisma | 5.x | Type-safe queries, migrations, introspection |
| **Validation** | Zod | 3.x | Runtime + compile-time type safety |
| **Auth** | JWT + Refresh Tokens | — | Stateless, horizontally scalable |
| **Database** | PostgreSQL | 15+ | JSONB, RLS, FTS, mature ecosystem |
| **Connection Pool** | PgBouncer | 1.21+ | Reduce DB connection overhead |
| **Cache / Queue** | Redis | 7.x | Session cache, pub/sub, BullMQ backend |
| **Job Queue** | BullMQ | 5.x | Reliable background processing |
| **File Storage** | AWS S3 + CloudFront | — | Scalable, pre-signed URLs |
| **Email** | AWS SES / SendGrid | — | Transactional + marketing email |
| **AI** | Anthropic Claude API | claude-sonnet-4-6 | Task generation, summaries, reports |
| **Container** | Docker + ECS Fargate | — | Serverless containers, no EC2 mgmt |
| **IaC** | Terraform | 1.x | Reproducible infrastructure |
| **CI/CD** | GitHub Actions | — | Native integration, marketplace |
| **Monitoring** | Prometheus + Grafana | — | Industry standard metrics + dashboards |
| **Logging** | Winston + CloudWatch | — | Structured logging, centralized |
| **Error Tracking** | Sentry | — | Real-time errors, release tracking |
| **APM** | OpenTelemetry | — | Distributed tracing |

---

## 1.4 Scalability Approach (500 Concurrent Users)

### Load Calculation

```
Assumptions:
  - 500 concurrent users (peak)
  - Average: 30-50 API requests/user/minute during active use
  - Peak: 500 × 50 = 25,000 req/min ≈ 416 req/sec
  - WebSocket connections: 500 persistent
  - DB connections needed: ~100 (via PgBouncer pooling)

Sizing:
  ┌─────────────────────────────────────────────────────────┐
  │  COMPUTE                                                 │
  │  API Servers:  4 pods × 2 vCPU / 4GB RAM (ECS Fargate) │
  │  Workers:      2 pods × 1 vCPU / 2GB RAM                │
  │  Auto-scale:   CPU > 70% → add pod (max 8)              │
  │                                                          │
  │  DATABASE                                                │
  │  Primary:      db.r6g.xlarge (4 vCPU, 32GB)             │
  │  Read Replica: db.r6g.large (2 vCPU, 16GB) × 1-2        │
  │  PgBouncer:    Transaction pooling (max_client: 500)    │
  │                                                          │
  │  CACHE                                                   │
  │  Redis:        cache.r6g.large (2 vCPU, 13GB)           │
  │  Mode:         Cluster with 3 shards                     │
  │                                                          │
  │  STORAGE                                                 │
  │  S3:           Standard tier (auto-scales)               │
  │  CloudFront:   Global edge caching                       │
  └─────────────────────────────────────────────────────────┘
```

### Caching Strategy (3 Tiers)

```
┌──────────────────────────────────────────────────────────┐
│  L1: In-Process LRU Cache (per pod)                       │
│  - Org configurations, permission matrices                │
│  - Workflow definitions                                    │
│  - TTL: 60 seconds                                        │
│  - Library: lru-cache (Node.js)                           │
├──────────────────────────────────────────────────────────┤
│  L2: Redis Cache (shared across pods)                     │
│  - User sessions and JWT blacklist                        │
│  - Dashboard aggregations                                  │
│  - Project stats (from materialized views)                 │
│  - TTL: 5 minutes                                         │
├──────────────────────────────────────────────────────────┤
│  L3: CDN Cache (CloudFront)                               │
│  - Static frontend assets (JS, CSS, images)               │
│  - Public report PDFs                                      │
│  - TTL: 24 hours (with cache-busting via content hash)    │
└──────────────────────────────────────────────────────────┘
```

### Read/Write Split

```
WRITES → Primary PostgreSQL
  - Task CRUD, comments, status changes
  - User management, auth

READS → Read Replica(s)
  - Dashboard analytics
  - Reports (burndown, velocity, time tracking)
  - Search queries
  - Activity feed

MATERIALIZED VIEWS (refreshed every 5 min):
  - mv_project_stats: task counts, completion %, overdue
  - mv_member_workload: open tasks, hours logged per member
```

---

## 1.5 Security Architecture

### Authentication Flow

```
┌──────────┐     POST /auth/login       ┌──────────────┐
│  Client  │ ────────────────────────►  │   API Server  │
│ (React)  │                            │               │
│          │  ◄──────────────────────── │  Validate pwd │
│          │   { access_token (15min) } │  Issue JWT    │
│          │   Set-Cookie: refresh_tok  │  Store refresh│
└──────────┘   (HttpOnly, Secure, 7d)  └──────────────┘

JWT Payload:
{
  "sub": "user-uuid",
  "org_id": "org-uuid",
  "role": "project_manager",
  "iat": 1711929600,
  "exp": 1711930500    // 15 min
}
```

### RBAC Permission Matrix

| Resource | org_admin | project_manager | member | viewer |
|----------|-----------|-----------------|--------|--------|
| Org settings | CRUD | Read | Read | Read |
| Users/Roles | CRUD | Read | Read | Read |
| Workflows | CRUD | CRUD | Read | Read |
| Custom fields | CRUD | CRUD | Read | Read |
| Projects | CRUD | CRUD (own) | Read (assigned) | Read (visible) |
| Tasks | CRUD | CRUD | CRU (assigned) | Read |
| Comments | CRUD | CRUD | CRU (own) | Read |
| Reports | Full | Project-scoped | My tasks | My tasks |
| AI features | Full | Full | Limited | None |

### Security Checklist

| Area | Implementation | Status |
|------|---------------|--------|
| Authentication | JWT (15min) + Refresh Token (7d) + HttpOnly cookies | Required |
| Authorization | RBAC + PostgreSQL Row-Level Security | Required |
| Data Isolation | `org_id` on every table + RLS policies | Required |
| Input Validation | Zod schemas at every API boundary | Required |
| SQL Injection | Parameterized queries via Prisma ORM | Required |
| XSS Prevention | CSP headers + DOMPurify for user content | Required |
| CSRF Protection | SameSite=Strict cookies + CSRF token | Required |
| Rate Limiting | 100 req/min (unauth), 1000/min (auth), 20/min (AI) | Required |
| Secrets Management | AWS Secrets Manager / env injection | Required |
| Encryption at Rest | AES-256 (RDS, S3 SSE-S3) | Required |
| Encryption in Transit | TLS 1.3 enforced everywhere | Required |
| Audit Logging | Immutable `activity_logs` table | Required |
| Dependency Scanning | Snyk / npm audit in CI | Required |
| CORS | Whitelist production domain only | Required |
| Password Policy | Min 8 chars, upper+lower+digit+special | Required |
| Account Lockout | Lock after 5 failed attempts, 15min cooldown | Required |
| Compliance | SOC 2 Type II readiness, GDPR-ready | Phase 2 |

---

## 1.6 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Region (us-east-1)                │
│                                                              │
│  ┌──────────────────────────────┐                            │
│  │       VPC (10.0.0.0/16)     │                            │
│  │                              │                            │
│  │  ┌─── Public Subnets ──┐    │    ┌──────────────┐        │
│  │  │ ALB │ NAT Gateway    │    │    │  CloudFront  │        │
│  │  └──────────────────────┘    │    │  + S3 (SPA)  │        │
│  │                              │    └──────────────┘        │
│  │  ┌─── Private Subnets ──┐   │                             │
│  │  │ ECS Fargate (API)    │   │                             │
│  │  │ ECS Fargate (Worker) │   │                             │
│  │  │ ElastiCache (Redis)  │   │                             │
│  │  └──────────────────────┘   │                             │
│  │                              │                             │
│  │  ┌─── DB Subnets ──────┐   │                             │
│  │  │ RDS Primary (AZ-a)  │   │                             │
│  │  │ RDS Replica (AZ-b)  │   │                             │
│  │  └──────────────────────┘   │                             │
│  └──────────────────────────────┘                            │
│                                                              │
│  External: Route53 │ ACM (TLS) │ SES │ Secrets Manager       │
└─────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```
Developer Push → GitHub Actions:
  1. Lint + Type Check (ESLint, tsc)
  2. Unit Tests (Vitest)
  3. Integration Tests (Supertest + test DB)
  4. Build Docker image
  5. Push to ECR
  6. Deploy to ECS (rolling update, blue/green for prod)
  7. Run smoke tests
  8. Notify Slack
```

---

## 1.7 Request Flow (End-to-End)

```
User clicks "Create Task" →
  1. React form → Zod validation (client-side)
  2. POST /v1/projects/:id/tasks → API Gateway
  3. API Gateway → JWT validation → rate limit check
  4. Express middleware → extract org_id from JWT
  5. SET LOCAL app.current_org_id = :org_id (PgBouncer)
  6. Prisma → INSERT INTO tasks (RLS enforced)
  7. Emit WebSocket event → "task:created" to project room
  8. Enqueue notification job → BullMQ → Redis
  9. Worker picks up job → INSERT notification + send email
  10. Return 201 { task } → React updates UI optimistically
```

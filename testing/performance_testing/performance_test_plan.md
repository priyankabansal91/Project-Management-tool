# Performance Test Plan — Q-Flow (QCI Project Management Tool)

**Document Version:** 1.0  
**Prepared By:** QCI Engineering / Performance Engineering Team  
**Date:** 2026-05-06  
**Application Version:** As of branch `claude/saas-project-management-design-BsbSY`  
**Status:** APPROVED FOR EXECUTION

---

## Table of Contents

1. [Objectives and Scope](#1-objectives-and-scope)
2. [Performance Goals and SLAs](#2-performance-goals-and-slas)
3. [Test Environment Requirements](#3-test-environment-requirements)
4. [Test Types](#4-test-types)
5. [Entry and Exit Criteria](#5-entry-and-exit-criteria)
6. [Tools Selection Matrix](#6-tools-selection-matrix)
7. [Data Preparation Strategy](#7-data-preparation-strategy)
8. [Metrics to Collect](#8-metrics-to-collect)
9. [Monitoring Setup](#9-monitoring-setup)
10. [Risk Areas from Architecture Review](#10-risk-areas-from-architecture-review)
11. [Test Schedule](#11-test-schedule)

---

## 1. Objectives and Scope

### 1.1 Objectives

The performance testing program for Q-Flow has the following primary objectives:

1. **Establish baseline performance metrics** for all critical API endpoints under normal operating conditions (50 concurrent users).
2. **Validate SLA compliance** — confirm the application meets response-time, throughput, and error-rate targets before any production release.
3. **Identify breaking points** — determine the maximum load the current single-process Node.js architecture can sustain before response times degrade beyond acceptable thresholds.
4. **Detect memory leaks** — run extended soak tests to identify unbounded memory growth in the Node.js heap.
5. **Confirm rate limiter correctness** — verify the global 300 req/min and auth-specific 10 req/15 min limiters behave as configured under real concurrent load.
6. **Quantify database connection pool saturation** — understand how the 25-connection Prisma pool behaves as concurrency grows toward and beyond that ceiling.
7. **Produce a capacity plan** — determine the realistic concurrent-user ceiling on current infrastructure and the investment needed to reach 2× and 5× that ceiling.

### 1.2 In Scope

| Area | Detail |
|------|--------|
| Backend API | All endpoints mounted in `backend/src/app.js` under `/v1/*` |
| Auth subsystem | POST /v1/auth/login, /register, /send-otp, /verify-otp (authLimiter: 10 req/15 min) |
| Dashboard | GET /v1/dashboard/overview — highest DB query fan-out |
| Project/Task CRUD | GET /v1/projects, GET/POST /v1/tasks/project/:id |
| Search | GET /v1/search?q= — LIKE-based, no full-text index |
| Time logging | GET/POST /v1/time-logs/my |
| MIS & Financial | GET /v1/mis/division-overview, GET /v1/financial/dashboard |
| Notifications | GET /v1/notifications |
| Frontend bundle | Lighthouse CI scores, LCP, bundle size (initial load) |
| Database layer | PostgreSQL 17, connection pool behavior, slow query identification |

### 1.3 Out of Scope

- WebSocket / real-time event performance (not implemented)
- CDN and edge-cache performance (CDN not configured)
- Mobile native app performance
- Third-party integrations (Outlook integration endpoints)
- Email delivery throughput (SMTP is a third-party dependency)
- Redis cluster performance (Redis not implemented in application code)

---

## 2. Performance Goals and SLAs

### 2.1 Response Time Targets (HTTP API)

| Endpoint Category | p50 Target | p95 Target | p99 Target | Max Acceptable |
|-------------------|-----------|-----------|-----------|----------------|
| Auth (login/register) | ≤ 200 ms | ≤ 500 ms | ≤ 800 ms | 2 000 ms |
| Dashboard overview | ≤ 300 ms | ≤ 800 ms | ≤ 1 500 ms | 3 000 ms |
| Project list (paginated) | ≤ 100 ms | ≤ 300 ms | ≤ 600 ms | 1 500 ms |
| Task list / Kanban view | ≤ 200 ms | ≤ 500 ms | ≤ 900 ms | 2 000 ms |
| Task create (POST) | ≤ 150 ms | ≤ 400 ms | ≤ 700 ms | 1 500 ms |
| Time log (GET/POST) | ≤ 100 ms | ≤ 300 ms | ≤ 500 ms | 1 200 ms |
| Search | ≤ 200 ms | ≤ 600 ms | ≤ 1 200 ms | 3 000 ms |
| Financial dashboard | ≤ 150 ms | ≤ 400 ms | ≤ 800 ms | 2 000 ms |
| MIS division overview | ≤ 300 ms | ≤ 800 ms | ≤ 1 500 ms | 3 000 ms |
| Notifications (GET) | ≤ 100 ms | ≤ 300 ms | ≤ 500 ms | 1 000 ms |
| OTP send | ≤ 500 ms | ≤ 1 500 ms | ≤ 3 000 ms | 6 000 ms |
| Health check | ≤ 10 ms | ≤ 30 ms | ≤ 50 ms | 100 ms |

> **Note on OTP:** The OTP send endpoint calls `sendOtpEmail()` synchronously before returning the response (`backend/src/services/otpService.js:sendOtp()`). When SMTP is configured and the remote mail server is slow, this directly inflates p95/p99 for this endpoint. The target above assumes the SMTP round-trip is under 2 seconds.

### 2.2 Throughput Targets

| Test Phase | Target RPS (requests/sec) |
|------------|--------------------------|
| Baseline (50 VU) | ≥ 120 RPS aggregate |
| Peak load (200 VU) | ≥ 300 RPS aggregate |
| Stress ceiling | To be measured — document breaking point |

### 2.3 Error Rate Targets

| Condition | Acceptable Error Rate |
|-----------|-----------------------|
| Baseline (50 VU) | < 0.1% (HTTP 5xx) |
| Peak load (200 VU) | < 0.5% (HTTP 5xx) |
| Stress test (400–1 000 VU) | < 5% at documented breaking point |
| Auth flood (500 concurrent login attempts) | 429 responses expected; 0% 5xx errors |

### 2.4 Availability Target

- **Uptime during sustained soak:** 100% (no process crashes or OOM kills)
- **Recovery after spike:** < 30 seconds to return to baseline latency after spike traffic subsides

### 2.5 Resource Utilization Targets

| Resource | Warning Threshold | Critical Threshold |
|----------|------------------|--------------------|
| Node.js heap usage | 75% of `--max-old-space-size` | 90% |
| PostgreSQL active connections | 20 (80% of pool of 25) | 25 (pool exhausted) |
| PostgreSQL CPU | 60% | 85% |
| Host server CPU | 70% | 90% |
| Host server memory | 75% | 90% |

---

## 3. Test Environment Requirements

### 3.1 Application Under Test (AUT)

The performance tests target a **dedicated staging environment** that mirrors production as closely as possible. Do NOT run load tests against the shared development environment or production.

| Component | Specification |
|-----------|---------------|
| Backend runtime | Node.js 20 LTS (single process, no pm2 cluster) |
| Backend entry | `backend/src/app.js`, port 4000 |
| Frontend | React 18 / Vite production build served via Nginx or `vite preview`, port 5173 |
| Database | PostgreSQL 17, db=`project_mgmt`, user=`postgres` |
| Prisma pool | Default Prisma pool size (connection_limit=25 via DATABASE_URL) |
| Redis | Not implemented — no Redis instance required |
| Email (SMTP) | Point to a stub/mailhog instance to avoid real email delivery delays polluting OTP test results |
| Rate limiting | express-rate-limit in-memory store (default) — single-process behavior |

### 3.2 Load Generator Hardware

| Spec | Minimum | Recommended |
|------|---------|-------------|
| CPU | 4 cores | 8 cores |
| RAM | 8 GB | 16 GB |
| Network | 100 Mbps to AUT | 1 Gbps (same LAN as AUT) |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| k6 version | v0.49.0+ | v0.52.0+ |

> **Important:** The load generator and the AUT server must be on the same local network or connected via a low-latency link (< 2 ms RTT). Network latency from the load generator to AUT must be factored out of reported response times.

### 3.3 AUT Server (Staging)

| Spec | Minimum (current single-node) | Target for scale testing |
|------|------------------------------|--------------------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Storage | SSD, 20 GB | SSD, 50 GB |
| PostgreSQL server | Co-located or < 1 ms RTT | Dedicated DB server |
| Node.js heap | Default (1.5 GB) | `--max-old-space-size=2048` |

### 3.4 Test Data Volume Requirements

See [Section 7](#7-data-preparation-strategy) for detailed seed data requirements. At a minimum, the database must contain:

- 5 organizations with full membership hierarchies
- 50 users per organization (250 total) across all six roles
- 20 projects per organization (100 total)
- 500 tasks per project (50 000 total tasks)
- 10 sprints per project with task assignments
- Time logs: ≥ 200 000 records
- Audit log entries: ≥ 500 000 records (for MIS/reporting query realism)
- Notifications: ≥ 100 000 records

---

## 4. Test Types

### 4.1 Baseline Load Test

**Purpose:** Establish reference performance numbers under expected normal daily usage.

| Parameter | Value |
|-----------|-------|
| Virtual Users | 50 |
| Ramp-up | 5 VU/30 seconds (total ramp: 5 min) |
| Steady-state duration | 15 minutes |
| Ramp-down | 5 VU/30 seconds |
| Traffic mix | Realistic usage mix (see Scenario 1) |

**What it measures:** p50/p95/p99 latency, RPS, error rate, and baseline memory/CPU footprint under expected daily concurrent user count.

### 4.2 Peak Load Test

**Purpose:** Validate behavior at the highest anticipated concurrent user count (end-of-quarter reporting peaks, all-hands project reviews).

| Parameter | Value |
|-----------|-------|
| Virtual Users | 200 |
| Ramp-up | 20 VU/60 seconds (total ramp: 10 min) |
| Steady-state duration | 20 minutes |
| Ramp-down | 20 VU/60 seconds |
| Traffic mix | Dashboard-heavy (30% dashboard, 25% tasks, 20% projects, 15% notifications, 10% misc) |

**What it measures:** Whether the 25-connection PostgreSQL pool saturates, how p95 latency degrades from baseline, and whether the global rate limiter (300 req/min) triggers at 200 VU.

### 4.3 Stress Test

**Purpose:** Find the breaking point — the VU count at which error rates exceed 5% or p99 exceeds 3× the SLA target.

| Parameter | Value |
|-----------|-------|
| Virtual Users | Ramp from 50 → 1 000 in 15 stages of +50 VU each |
| Stage duration | 2 minutes per stage |
| Total duration | ~30 minutes |
| Abort condition | Error rate > 10% OR p99 > 10 000 ms |

**What it measures:** The exact VU count at which the application enters degraded service; the shape of the degradation curve (graceful vs. cliff).

### 4.4 Spike Test

**Purpose:** Simulate a sudden burst of user activity (announcement email, time-sensitive deadline) and measure recovery time.

| Parameter | Value |
|-----------|-------|
| Baseline VUs | 10 |
| Spike VUs | 500 (instant ramp — 0 seconds) |
| Spike duration | 2 minutes |
| Recovery | Instant drop back to 10 VU |
| Post-spike observation | 5 minutes |

**What it measures:** Behavior of the in-memory rate limiter under sudden spikes, request queuing in the connection pool, and time to recover baseline latency.

### 4.5 Soak Test

**Purpose:** Detect memory leaks, connection pool leaks, and gradual performance degradation over an extended period.

| Parameter | Value |
|-----------|-------|
| Virtual Users | 100 (steady, no ramp variation) |
| Duration | 30 minutes minimum; 2 hours preferred |
| Traffic mix | Full usage mix including search and dashboard |

**What it measures:** Node.js heap growth rate over time, PostgreSQL connection count stability, and whether p95 latency drifts upward as the run continues.

### 4.6 Scalability Test

**Purpose:** Measure the proportional increase in throughput when the application is scaled horizontally (requires running 2 Node.js instances behind a load balancer).

| Parameter | Value |
|-----------|-------|
| Configuration A | 1 Node.js process (baseline) |
| Configuration B | 2 Node.js processes behind Nginx upstream |
| VU count for each | 200 VU steady-state |
| Duration per config | 15 minutes |

> **Note:** The current deployment uses a single Node.js process with no pm2 cluster. This test documents the throughput gain achievable by switching to `pm2 start app.js -i 2` (2 workers). Because the current in-memory rate limiter does not share state across processes, rate limit correctness must be re-validated in this configuration using a shared store (e.g., Redis).

---

## 5. Entry and Exit Criteria

### 5.1 Entry Criteria (must all be met before testing begins)

- [ ] Staging environment is provisioned and matches production specifications
- [ ] Seed data volume meets minimum requirements (Section 7)
- [ ] All application unit and E2E tests pass on the staging build
- [ ] Backend health check (`GET /health`) returns `200 OK` in < 50 ms from load generator
- [ ] Load generator connectivity to AUT is confirmed (< 5 ms RTT)
- [ ] Monitoring tools are active and collecting data (pg_stat_activity, node metrics)
- [ ] SMTP is pointed to stub server (mailhog or ethereal.email) to eliminate mail delivery latency
- [ ] Baseline system metrics captured (CPU idle < 10%, memory free > 80%)
- [ ] k6 version ≥ 0.49.0 confirmed on load generator
- [ ] Test scripts have been dry-run with 2 VU for 30 seconds without errors

### 5.2 Exit Criteria (test is considered passed when all are met)

| Criterion | Pass Condition |
|-----------|---------------|
| Baseline p95 latency | All endpoint categories meet SLA targets (Section 2.1) |
| Baseline error rate | < 0.1% HTTP 5xx |
| Peak load p95 latency | All endpoint categories within 2× SLA target |
| Peak load error rate | < 0.5% HTTP 5xx |
| Rate limiter (auth) | 429 responses returned cleanly; no 5xx under auth flood |
| Global rate limiter | No 5xx errors caused by rate limiter; only 429s |
| Soak test | No OOM crash; heap growth < 50 MB over 30 minutes |
| Soak test DB connections | Active connections never exceed 25 |

### 5.3 Suspension Criteria

Testing is suspended immediately if any of the following occur:

- The AUT process crashes (SIGKILL, OOM, unhandled exception leading to process exit)
- PostgreSQL becomes unresponsive (connection refused / all connections in use for > 60 seconds)
- Error rate exceeds 50% for more than 2 minutes during a non-stress test
- The staging database sustains data corruption

---

## 6. Tools Selection Matrix

### 6.1 Primary Load Generator: k6

| Criterion | Assessment |
|-----------|------------|
| Language | JavaScript/TypeScript — matches the team's existing skill set |
| Protocol support | HTTP/1.1, HTTP/2, WebSockets, gRPC |
| Scripting | Full ES6+ scripting; supports complex workflows, auth token handling, parametrized data |
| CI integration | Docker image + JSON/CSV output; integrates with GitHub Actions |
| Metrics | Built-in p50/p95/p99/p99.9 per-metric; custom trend metrics |
| Output formats | JSON summary, InfluxDB/Prometheus remote write, Grafana k6 Cloud |
| Cost | Open-source (Apache 2.0); free for self-hosted execution |
| Verdict | **Selected as primary load generation tool for all 6 scenarios** |

### 6.2 Alternative: Apache JMeter

| Criterion | Assessment |
|-----------|------------|
| Language | XML test plans + Java; higher learning curve for the JS-first team |
| GUI | Strong GUI for test building — useful for one-off exploratory testing |
| Protocol | HTTP, JDBC (can test DB directly), FTP, JMS |
| Drawbacks | Higher memory per VU (JVM threads vs k6 goroutines); verbose test plans |
| Verdict | **Available as secondary tool** for visual test construction; not primary |

### 6.3 Alternative: Artillery

| Criterion | Assessment |
|-----------|------------|
| Language | YAML test plans + JS hooks |
| Strengths | Very readable for simple load patterns; good for smoke-test-level perf checks |
| Drawbacks | Less flexible for complex auth flows; fewer built-in metrics than k6 |
| Verdict | **Not selected** — k6's scripting model better supports the auth token lifecycle needed for Q-Flow |

### 6.4 Frontend Performance: Lighthouse CI

| Criterion | Assessment |
|-----------|------------|
| Purpose | Measures Core Web Vitals (LCP, FID/INP, CLS), accessibility, best practices |
| Integration | `lhci autorun` in GitHub Actions; compares against baseline |
| Metrics | LCP, TBT, CLS, bundle size, render-blocking resources |
| Verdict | **Selected for frontend performance gates** — run as part of CI on every PR |

### 6.5 Database Query Analysis: pg_stat_statements

| Criterion | Assessment |
|-----------|------------|
| Purpose | Captures per-query execution time, call count, shared buffer hits, I/O stats |
| Setup | `CREATE EXTENSION pg_stat_statements;` in staging DB |
| Use | Run `SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 20;` after each load test |
| Verdict | **Selected for slow-query identification** during and after load test runs |

### 6.6 Summary Selection Table

| Tool | Role | Phase |
|------|------|-------|
| k6 | Primary load generator | All test phases |
| pg_stat_statements | Database query profiling | All test phases |
| pg_stat_activity | Real-time connection pool monitoring | All test phases |
| Lighthouse CI | Frontend Core Web Vitals | Baseline + post-optimization |
| node --inspect + clinic.js | Node.js heap/CPU profiling | Soak test analysis |
| JMeter | Ad-hoc exploratory testing | Optional |

---

## 7. Data Preparation Strategy

### 7.1 Why Seed Data Volume Matters

Query plan choices made by PostgreSQL's planner depend on table statistics. A test against a near-empty database produces artificially fast response times (sequential scans on small tables are faster than index scans). To get realistic query plans, the database must contain production-representative data volumes before testing begins.

### 7.2 Target Seed Data Volumes

| Table | Target Row Count | Notes |
|-------|-----------------|-------|
| `organizations` | 5 | One org per functional division in QCI |
| `users` | 250 | 50 per org, mix of all 6 roles |
| `org_members` | 250 | One membership per user |
| `projects` | 100 | 20 per org, mix of statuses |
| `workflow_configs` | 10 | 2 per org (default + custom) |
| `tasks` | 50 000 | 500 per project; mix of priorities and statuses |
| `task_comments` | 200 000 | Average 4 comments per task |
| `task_subtasks` | 25 000 | 0.5 subtasks per task on average |
| `sprints` | 200 | 2 per project |
| `sprint_tasks` | 30 000 | 60% of tasks sprint-assigned |
| `time_logs` | 200 000 | Average 4 logs per task |
| `activity_logs` | 500 000 | Key table for dashboard recent-activity query |
| `notifications` | 100 000 | Mix of read/unread, all users |
| `email_otps` | 1 000 | Mostly expired/used; simulates realistic table size |
| `approval_requests` | 5 000 | Mix of statuses |
| `audit_log` | 500 000 | Required for realistic MIS query cost |

### 7.3 Seed Data Generation Approach

1. **Extend existing Prisma seed script** (`backend/prisma/seed.js`) with volume multipliers controlled by environment variables:
   ```bash
   SEED_USERS=250 SEED_TASKS_PER_PROJECT=500 npm run db:seed
   ```

2. **Use `faker` library** for realistic text in task titles, comments, and audit log messages to avoid simple pattern-based LIKE query optimizations by PostgreSQL.

3. **Distribute created_at timestamps** uniformly over the last 12 months so time-series queries (activity log, reports) produce realistic date-range scans.

4. **Verify seeded counts** before each test run:
   ```sql
   SELECT schemaname, relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;
   ```

5. **VACUUM ANALYZE** all tables after seeding:
   ```sql
   VACUUM ANALYZE;
   ```

### 7.4 Test User Credentials

Pre-create a pool of 100 test user accounts (test_user_001@qci.test … test_user_100@qci.test) with known password `Perf@test123!`. The k6 scripts pull credentials from a parametrized CSV to distribute authentication requests across distinct users and avoid artificial token-sharing.

---

## 8. Metrics to Collect

### 8.1 HTTP Request Metrics (k6 built-ins)

| Metric | Description | Alerting Threshold |
|--------|-------------|-------------------|
| `http_req_duration` | Full round-trip time from k6 to response | p95 > SLA target → fail |
| `http_req_duration{phase:connect}` | TCP connect time | > 10 ms indicates network issue |
| `http_req_duration{phase:tls}` | TLS handshake time | > 50 ms |
| `http_req_duration{phase:sending}` | Time to send request body | — |
| `http_req_duration{phase:waiting}` | TTFB (time to first byte) | p95 > 500 ms → investigate |
| `http_req_duration{phase:receiving}` | Response body download time | — |
| `http_req_failed` | Rate of non-2xx / non-3xx responses | > 0.5% → fail |
| `http_reqs` | Total request count / RPS | Target: ≥ 120 RPS at 50 VU |
| `iterations` | Complete user-journey iterations per second | — |
| `vus` | Active virtual users at each moment | — |
| `vus_max` | Peak VU count reached | — |

### 8.2 Custom Business Metrics (k6 Trend objects)

```js
// Define in k6 script init section:
const dashboardDuration = new Trend('dashboard_duration', true);
const taskCreateDuration = new Trend('task_create_duration', true);
const searchDuration = new Trend('search_duration', true);
const loginDuration = new Trend('login_duration', true);
```

### 8.3 PostgreSQL Metrics

Collect via a monitoring script querying the staging DB every 10 seconds:

| Metric | Query / Source |
|--------|---------------|
| Active connections | `SELECT count(*) FROM pg_stat_activity WHERE state = 'active'` |
| Idle connections | `SELECT count(*) FROM pg_stat_activity WHERE state = 'idle'` |
| Connections waiting | `SELECT count(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock'` |
| Longest running query | `SELECT max(now() - pg_stat_activity.query_start) FROM pg_stat_activity WHERE state = 'active'` |
| Cache hit ratio | `SELECT sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) FROM pg_statio_user_tables` |
| Top slow queries | `SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10` |
| Transaction rate | `SELECT xact_commit + xact_rollback FROM pg_stat_database WHERE datname = 'project_mgmt'` |

### 8.4 Node.js Process Metrics

Collect via a sidecar monitoring script running on the AUT server:

| Metric | Collection Method |
|--------|-----------------|
| Heap used (MB) | `process.memoryUsage().heapUsed / 1024 / 1024` — expose via `/metrics` endpoint |
| Heap total (MB) | `process.memoryUsage().heapTotal / 1024 / 1024` |
| External memory (MB) | `process.memoryUsage().external / 1024 / 1024` |
| RSS (MB) | `process.memoryUsage().rss / 1024 / 1024` |
| Event loop lag (ms) | Measured via `perf_hooks.monitorEventLoopDelay()` |
| CPU user time | `process.cpuUsage()` delta per 10-second interval |
| Active handles | `process._getActiveHandles().length` |
| Active requests | `process._getActiveRequests().length` |

### 8.5 Host OS Metrics

| Metric | Tool |
|--------|------|
| CPU utilization (%) | `vmstat 5` / `mpstat` |
| Memory usage (%) | `free -m` every 5 sec |
| Network I/O (bytes in/out) | `sar -n DEV 5` |
| Disk I/O (for PG WAL) | `iostat -x 5` |

---

## 9. Monitoring Setup

### 9.1 PostgreSQL Monitoring

**Step 1 — Enable pg_stat_statements:**
```sql
-- Run as superuser on staging DB
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
-- Restart PostgreSQL after this change
SELECT pg_reload_conf();
```

**Step 2 — Real-time connection watcher** (run during every test):
```bash
# poll_pg.sh — run during every test, output to CSV
while true; do
  psql -U postgres -d project_mgmt -c "
    SELECT
      now() AS ts,
      count(*) FILTER (WHERE state = 'active') AS active,
      count(*) FILTER (WHERE state = 'idle') AS idle,
      count(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_tx,
      count(*) FILTER (WHERE wait_event_type = 'Lock') AS waiting,
      max(now() - query_start) FILTER (WHERE state = 'active') AS longest_running
    FROM pg_stat_activity
    WHERE datname = 'project_mgmt';
  " -t -A -F',' >> pg_connections_$(date +%Y%m%d_%H%M).csv
  sleep 5
done
```

**Step 3 — Slow query report** (run immediately after each test):
```sql
SELECT
  left(query, 120) AS query_snippet,
  calls,
  round(mean_exec_time::numeric, 2) AS mean_ms,
  round(max_exec_time::numeric, 2) AS max_ms,
  round(total_exec_time::numeric, 2) AS total_ms,
  round(stddev_exec_time::numeric, 2) AS stddev_ms,
  rows / calls AS avg_rows
FROM pg_stat_statements
WHERE calls > 10
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### 9.2 Node.js Metrics Endpoint

Add a lightweight `/metrics` route to the staging build of `backend/src/app.js` (do not ship to production):

```js
// Staging-only metrics endpoint (add to app.js, staging build only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/metrics', (req, res) => {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();
    res.json({
      timestamp: new Date().toISOString(),
      heap_used_mb: (mem.heapUsed / 1024 / 1024).toFixed(2),
      heap_total_mb: (mem.heapTotal / 1024 / 1024).toFixed(2),
      rss_mb: (mem.rss / 1024 / 1024).toFixed(2),
      external_mb: (mem.external / 1024 / 1024).toFixed(2),
      cpu_user_ms: (cpu.user / 1000).toFixed(2),
      cpu_system_ms: (cpu.system / 1000).toFixed(2),
      active_handles: process._getActiveHandles().length,
      active_requests: process._getActiveRequests().length,
      uptime_s: process.uptime().toFixed(0),
    });
  });
}
```

**Metrics polling script** (run from load generator during test):
```bash
# poll_node.sh
while true; do
  curl -s http://AUT_HOST:4000/metrics >> node_metrics_$(date +%Y%m%d_%H%M).jsonl
  echo "" >> node_metrics_$(date +%Y%m%d_%H%M).jsonl
  sleep 10
done
```

### 9.3 k6 Output Configuration

Run k6 with JSON output for post-processing:
```bash
k6 run \
  --out json=results/run_$(date +%Y%m%d_%H%M).json \
  --summary-trend-stats "p(50),p(95),p(99),min,max" \
  scenarios/scenario_01_baseline.js
```

---

## 10. Risk Areas from Architecture Review

This section documents architectural characteristics of the current Q-Flow implementation that are most likely to produce performance failures under load. Each risk is rated by likelihood and impact.

### 10.1 Single-Process Node.js (CRITICAL RISK)

| Attribute | Detail |
|-----------|--------|
| Risk | Node.js event loop is single-threaded. CPU-intensive work (bcrypt.compare in auth, large JSON serialization for dashboard) blocks all other requests during that computation. |
| Evidence | `backend/src/app.js` — `app.listen(PORT, ...)` with no cluster mode, no pm2 `-i max` |
| Likelihood | High — bcrypt compare is synchronous CPU work; large team workload queries serialize JSON in one tick |
| Impact | Critical — one slow request can delay all other concurrent requests |
| Mitigation | Run `pm2 start app.js -i <cpu_count>` for cluster mode; move bcrypt to worker threads |

### 10.2 No Redis Caching on Dashboard (HIGH RISK)

| Attribute | Detail |
|-----------|--------|
| Risk | `GET /v1/dashboard/overview` executes at least 5 + (2 × project_count) database queries on every single request. With 20 active projects, that is 45 Prisma queries per dashboard page load. No caching layer exists. |
| Evidence | `backend/src/services/dashboardService.js` — `Promise.all([...])` with project-level nested queries |
| Likelihood | Certain — every dashboard navigation hits DB |
| Impact | High — at 200 concurrent users, this alone can exhaust the 25-connection pool |
| Mitigation | Add Redis caching for `dashboard:overview:{orgId}:{userId}` with 30-second TTL; Redis URL is already in `.env` but not wired |

### 10.3 25-Connection PostgreSQL Pool Saturation (HIGH RISK)

| Attribute | Detail |
|-----------|--------|
| Risk | Prisma's default connection pool limit is 25. Each concurrent request that touches the DB holds a connection for the duration of its query chain. Dashboard overview uses multiple sequential queries (the `projectProgress` loop uses `Promise.all` but within each project it runs 2 queries). Under 200 concurrent users, the pool will saturate and requests will queue waiting for a free connection. |
| Evidence | `backend/src/config/prisma.js` — no `connection_limit` override; default Prisma pool = `num_physical_cpus × 2 + 1` or 25, whichever is lower |
| Likelihood | High — 200 VU × average 0.2s DB hold time = 40 concurrent DB connections required |
| Impact | High — pool exhaustion manifests as dramatically increased p99 latency and eventual timeouts |
| Mitigation | `DATABASE_URL` with `?connection_limit=50`; or add PgBouncer in transaction pooling mode |

### 10.4 N+1 Query Pattern in Kanban View (MEDIUM RISK)

| Attribute | Detail |
|-----------|--------|
| Risk | `GET /v1/tasks/project/:id?view=kanban` triggers an extra `prisma.project.findFirst()` (to load workflow config) AFTER already fetching all tasks. If the project has no custom workflow, it falls back to a second query: `prisma.workflowConfig.findFirst()`. This is 2–3 sequential queries after the main task fetch. |
| Evidence | `backend/src/services/taskService.js:listByProject()` lines after `const mapped = tasks.map(formatTask)` |
| Likelihood | Certain — every Kanban view load triggers this pattern |
| Impact | Medium — adds 10–30 ms per request; becomes significant at high concurrency when those queries contend for pool connections |
| Mitigation | Include `workflowConfig` in the initial `prisma.project.findFirst()` by adding it to the task query's project include, or cache workflow config per org |

### 10.5 Synchronous OTP Email Sending (MEDIUM RISK)

| Attribute | Detail |
|-----------|--------|
| Risk | `POST /v1/auth/send-otp` calls `await sendOtpEmail(...)` before returning the HTTP response. When SMTP is slow or unreachable, this endpoint blocks for the full SMTP round-trip time (can be 2–10 seconds). The event loop is not blocked (it's async/await), but the request slot is held open, and the auth rate limiter window is consumed. |
| Evidence | `backend/src/services/otpService.js:sendOtp()` — `await sendOtpEmail(...)` inline before `return` |
| Likelihood | Certain — any SMTP delay directly adds to p95/p99 |
| Impact | Medium — affects only OTP flows, but during password-reset surges all auth slots fill up |
| Mitigation | Fire the email in a background job (`setImmediate`/queue) and return `{sent: true}` immediately; use a transactional email queue (BullMQ + Redis) |

### 10.6 LIKE-Based Search Without Full-Text Index (MEDIUM RISK)

| Attribute | Detail |
|-----------|--------|
| Risk | The production search endpoint (when wired to PostgreSQL) would use `{ contains: query, mode: 'insensitive' }` Prisma filters, which translate to `ILIKE '%query%'`. Leading wildcards prevent index use — PostgreSQL must perform a sequential scan of the tasks table (50 000+ rows). |
| Evidence | `backend/src/services/taskService.js:getMyTasks()` and `listByProject()` — `where.title = { contains: search, mode: 'insensitive' }` |
| Likelihood | High — search is used in every Kanban filter bar |
| Impact | Medium — sequential scans on 50 K rows are fast on SSD, but at 100 concurrent searches this degrades |
| Mitigation | Add PostgreSQL GIN full-text index on `tasks(title, description)`; use `to_tsvector` + `plainto_tsquery` via Prisma raw query |

### 10.7 Dashboard Team Workload Query (MEDIUM RISK)

| Attribute | Detail |
|-----------|--------|
| Risk | In `dashboardService.getOverview()`, the team workload section uses `prisma.orgMember.findMany()` with a deep include: `user.assignedTasks` (where tasks are not paginated). For an org with 50 members × 200 open tasks each = 10 000 task objects fetched and mapped in Node.js memory per dashboard request. |
| Evidence | `backend/src/services/dashboardService.js` — `assignedTasks: { where: { orgId, deletedAt: null, completedAt: null }, select: {...} }` inside member include |
| Likelihood | Medium — only large orgs with many members and tasks exhibit this |
| Impact | Medium to High — potential for 50–200 MB heap spike per heavy dashboard request |
| Mitigation | Replace with aggregation query using `prisma.task.groupBy()` or a raw SQL COUNT/GROUP BY per user |

### 10.8 In-Memory Rate Limiter (LOW RISK, MEDIUM FUTURE RISK)

| Attribute | Detail |
|-----------|--------|
| Risk | `express-rate-limit` uses an in-memory store by default. In a single-process deployment this is functionally correct. However, when the application is scaled to cluster mode (`pm2 -i N`), each process maintains its own rate-limit counter, effectively multiplying the limit by N. |
| Evidence | `backend/src/app.js` — `rateLimit({...})` with no `store` override |
| Likelihood | Low currently (single process); High when cluster mode is added |
| Impact | Medium — auth rate limit could allow 10 × N_workers login attempts per 15 min instead of 10 |
| Mitigation | Switch to `rate-limit-redis` store when Redis is wired; already partially set up (REDIS_URL in .env) |

---

## 11. Test Schedule

### 11.1 Testing Phases

| Phase | Activity | Duration | Owner |
|-------|----------|----------|-------|
| Preparation | Provision staging environment; run seed scripts; verify entry criteria | 2 days | DevOps + Backend |
| Dry Run | Execute each scenario at 2 VU for 60 seconds; verify no script errors | 0.5 days | Performance Engineer |
| Baseline Tests | Scenario 1 (Baseline Load) × 3 runs; collect average | 1 day | Performance Engineer |
| Peak Load Tests | Scenario 2 (Peak Load) × 2 runs | 0.5 days | Performance Engineer |
| Stress Tests | Scenario 3 (Stress) × 1 run | 0.5 days | Performance Engineer |
| Spike Tests | Scenario 4 (Spike) × 2 runs | 0.25 days | Performance Engineer |
| Soak Tests | Scenario 5 (Soak) — 30-minute minimum, 2-hour extended | 1 day | Performance Engineer |
| Auth Flood | Scenario 6 (Auth Flood) × 2 runs | 0.25 days | Performance Engineer |
| Analysis | Query pg_stat_statements; analyze k6 results; write report | 1.5 days | Performance Engineer + Backend |
| Remediation | Implement top-3 recommendations; re-run baseline + peak | 3–5 days | Backend Team |
| Re-test | Validate improvements against baseline | 1 day | Performance Engineer |

### 11.2 Recommended Testing Window

- **Best time:** Tuesday–Thursday, 09:00–17:00 local time
- **Avoid:** Monday mornings (real user load on staging may interfere), Friday afternoons
- **Staging freeze:** No deployments to staging during active test runs
- **Database:** Reset to clean seed state between stress and soak tests to ensure consistent starting conditions

---

*End of Performance Test Plan*

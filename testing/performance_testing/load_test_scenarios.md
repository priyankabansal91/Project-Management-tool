# Load Test Scenarios — Q-Flow (QCI Project Management Tool)

**Document Version:** 1.0  
**Tool:** k6 v0.49.0+  
**Base URL:** `http://localhost:4000` (staging — replace with staging host IP)  
**Date:** 2026-05-06

---

## Prerequisites

Before running any scenario:

1. **Install k6:** `brew install k6` / `choco install k6` / `apt install k6`
2. **Prepare credentials CSV** at `testing/performance_testing/data/users.csv`:
   ```
   email,password
   test_user_001@qci.test,Perf@test123!
   test_user_002@qci.test,Perf@test123!
   ...
   test_user_100@qci.test,Perf@test123!
   ```
3. **Set environment variables:**
   ```bash
   export BASE_URL=http://YOUR_STAGING_HOST:4000
   export FRONTEND_URL=http://YOUR_STAGING_HOST:5173
   ```
4. **Run health check:**
   ```bash
   curl -f $BASE_URL/health && echo "AUT is up"
   ```

---

## Scenario 1 — Baseline Load

| Attribute | Value |
|-----------|-------|
| **Scenario ID** | PERF-01 |
| **Type** | Load Test |
| **VU Count** | 50 (peak) |
| **Ramp Profile** | 0 → 10 VU over 1 min, hold 10 for 2 min, → 30 over 2 min, hold 30 for 3 min, → 50 over 2 min, hold 50 for 15 min, → 0 over 3 min |
| **Total Duration** | ~28 minutes |
| **Target Endpoints** | Full usage mix: dashboard, projects, tasks, time-logs, notifications |
| **Success Criteria** | p95 < 800 ms for dashboard; p95 < 500 ms for task list; error rate < 0.1% |
| **Expected Bottleneck** | Dashboard overview N+1 queries begin to show at 50 VU but should stay within SLA |

### Traffic Mix (50 VU)

| Weight | Endpoint |
|--------|----------|
| 20% | GET /v1/dashboard/overview |
| 20% | GET /v1/projects |
| 20% | GET /v1/tasks/project/:id?view=kanban |
| 15% | GET /v1/notifications |
| 10% | GET /v1/time-logs/my |
| 10% | POST /v1/tasks/project/:id (task creation) |
| 5% | GET /v1/search?q=design |

### k6 Script

```javascript
// File: testing/performance_testing/scenarios/scenario_01_baseline.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// ─── Custom Metrics ───────────────────────────────────────────────────
const dashboardDuration  = new Trend('dashboard_duration',  true);
const taskListDuration   = new Trend('task_list_duration',  true);
const projectsDuration   = new Trend('projects_duration',   true);
const taskCreateDuration = new Trend('task_create_duration',true);
const searchDuration     = new Trend('search_duration',     true);
const notifDuration      = new Trend('notif_duration',      true);
const loginErrors        = new Counter('login_errors');
const apiErrors          = new Rate('api_error_rate');

// ─── Test Data ────────────────────────────────────────────────────────
const users = new SharedArray('users', function () {
  return open('../data/users.csv').split('\n')
    .slice(1) // skip header
    .filter(line => line.trim())
    .map(line => {
      const [email, password] = line.split(',');
      return { email: email.trim(), password: password.trim() };
    });
});

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

// ─── Load Profile ─────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '1m',  target: 10 }, // warm up
    { duration: '2m',  target: 10 }, // hold
    { duration: '2m',  target: 30 }, // ramp
    { duration: '3m',  target: 30 }, // hold
    { duration: '2m',  target: 50 }, // ramp to peak
    { duration: '15m', target: 50 }, // STEADY STATE — measure here
    { duration: '3m',  target: 0  }, // ramp down
  ],
  thresholds: {
    // Global
    http_req_failed:        ['rate<0.001'],  // < 0.1% errors
    http_req_duration:      ['p(95)<1000'],  // global p95 < 1s

    // Per-endpoint thresholds
    dashboard_duration:     ['p(95)<800'],   // dashboard SLA
    task_list_duration:     ['p(95)<500'],   // task list SLA
    projects_duration:      ['p(95)<300'],   // projects SLA
    task_create_duration:   ['p(95)<400'],   // task create SLA
    search_duration:        ['p(95)<600'],   // search SLA
    notif_duration:         ['p(95)<300'],   // notifications SLA
    api_error_rate:         ['rate<0.001'],
  },
  summaryTrendStats: ['p(50)', 'p(95)', 'p(99)', 'min', 'max', 'avg'],
};

// ─── Login helper ─────────────────────────────────────────────────────
function login(email, password) {
  const res = http.post(
    `${BASE_URL}/v1/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'login' } }
  );
  const ok = check(res, {
    'login 200': (r) => r.status === 200,
    'login has token': (r) => {
      try { return !!JSON.parse(r.body).data?.access_token; } catch { return false; }
    },
  });
  if (!ok) loginErrors.add(1);
  return res.status === 200 ? JSON.parse(res.body).data?.access_token : null;
}

// ─── Seed data helpers ────────────────────────────────────────────────
// In a real run these would be fetched dynamically; here we use static IDs
// that match the seed data. Replace with actual IDs from your seed.
const PROJECT_IDS = [
  'proj_001', 'proj_002', 'proj_003', 'proj_004', 'proj_005',
];
const ORG_ID = 'org_001';

function randomProjectId() {
  return PROJECT_IDS[Math.floor(Math.random() * PROJECT_IDS.length)];
}

function randomPriority() {
  const p = ['low', 'medium', 'high', 'critical'];
  return p[Math.floor(Math.random() * p.length)];
}

// ─── VU lifecycle ─────────────────────────────────────────────────────
export function setup() {
  // Verify the AUT is healthy before the test starts
  const health = http.get(`${BASE_URL}/health`);
  if (health.status !== 200) {
    throw new Error(`Health check failed: ${health.status}`);
  }
  console.log('AUT health check passed. Starting baseline test...');
}

export default function () {
  // Each VU picks a user from the shared pool (round-robin by VU ID)
  const user = users[__VU % users.length];
  const token = login(user.email, user.password);

  if (!token) {
    apiErrors.add(1);
    sleep(5);
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // ─── Simulate a realistic user session ────────────────────────────

  // 1. User lands on dashboard (20% weight — always execute)
  group('Dashboard Overview', function () {
    const res = http.get(`${BASE_URL}/v1/dashboard/overview`, {
      headers,
      tags: { name: 'dashboard_overview' },
    });
    dashboardDuration.add(res.timings.duration);
    const ok = check(res, {
      'dashboard 200': (r) => r.status === 200,
      'dashboard has stats': (r) => {
        try { return !!JSON.parse(r.body).data?.stats; } catch { return false; }
      },
    });
    if (!ok) apiErrors.add(1);
    sleep(1 + Math.random() * 2); // think time: 1–3 seconds
  });

  // 2. Browse project list
  group('Project List', function () {
    const res = http.get(`${BASE_URL}/v1/projects?page=1&page_size=20`, {
      headers,
      tags: { name: 'project_list' },
    });
    projectsDuration.add(res.timings.duration);
    const ok = check(res, {
      'projects 200': (r) => r.status === 200,
    });
    if (!ok) apiErrors.add(1);
    sleep(0.5 + Math.random() * 1.5);
  });

  // 3. Open Kanban board for a project
  group('Task List (Kanban)', function () {
    const projectId = randomProjectId();
    const res = http.get(
      `${BASE_URL}/v1/tasks/project/${projectId}?view=kanban&page=1&page_size=50`,
      { headers, tags: { name: 'task_kanban' } }
    );
    taskListDuration.add(res.timings.duration);
    const ok = check(res, {
      'kanban 200': (r) => r.status === 200,
      'kanban has columns': (r) => {
        try { return Array.isArray(JSON.parse(r.body).data?.columns); } catch { return false; }
      },
    });
    if (!ok) apiErrors.add(1);
    sleep(2 + Math.random() * 3); // user reads the board
  });

  // 4. Check notifications
  group('Notifications', function () {
    const res = http.get(`${BASE_URL}/v1/notifications?page=1&page_size=20`, {
      headers,
      tags: { name: 'notifications' },
    });
    notifDuration.add(res.timings.duration);
    const ok = check(res, { 'notifications 200': (r) => r.status === 200 });
    if (!ok) apiErrors.add(1);
    sleep(0.5);
  });

  // 5. Use search (10% of sessions — simulate with random VU)
  if (__VU % 10 === 0) {
    group('Search', function () {
      const terms = ['design', 'authentication', 'pipeline', 'review', 'budget'];
      const q = terms[Math.floor(Math.random() * terms.length)];
      const res = http.get(`${BASE_URL}/v1/search?q=${q}&types=tasks,projects`, {
        headers,
        tags: { name: 'search' },
      });
      searchDuration.add(res.timings.duration);
      const ok = check(res, { 'search 200': (r) => r.status === 200 });
      if (!ok) apiErrors.add(1);
      sleep(1);
    });
  }

  // 6. Check my time logs
  group('Time Logs', function () {
    const res = http.get(`${BASE_URL}/v1/time-logs/my?page=1&page_size=20`, {
      headers,
      tags: { name: 'time_logs' },
    });
    const ok = check(res, { 'timelogs 200': (r) => r.status === 200 });
    if (!ok) apiErrors.add(1);
    sleep(0.5);
  });

  // 7. Create a task (20% of sessions)
  if (__VU % 5 === 0) {
    group('Task Create', function () {
      const projectId = randomProjectId();
      const payload = JSON.stringify({
        title: `Perf test task ${Date.now()}-${__VU}`,
        description: 'Created during performance baseline test',
        priority: randomPriority(),
        status_id: 'todo',
      });
      const res = http.post(
        `${BASE_URL}/v1/tasks/project/${projectId}`,
        payload,
        { headers, tags: { name: 'task_create' } }
      );
      taskCreateDuration.add(res.timings.duration);
      const ok = check(res, {
        'task create 201': (r) => r.status === 201,
        'task create has id': (r) => {
          try { return !!JSON.parse(r.body).data?.id; } catch { return false; }
        },
      });
      if (!ok) apiErrors.add(1);
      sleep(1);
    });
  }

  // End-of-session think time
  sleep(3 + Math.random() * 5);
}

export function teardown(data) {
  console.log('Baseline test complete.');
}
```

---

## Scenario 2 — Peak Load

| Attribute | Value |
|-----------|-------|
| **Scenario ID** | PERF-02 |
| **Type** | Load Test (Peak) |
| **VU Count** | 200 (peak) |
| **Ramp Profile** | 0 → 50 in 2 min, hold 2 min, → 100 in 2 min, hold 2 min, → 200 in 4 min, hold 20 min, → 0 in 4 min |
| **Total Duration** | ~36 minutes |
| **Target Endpoints** | Dashboard-heavy mix + project/task read |
| **Success Criteria** | p95 < 1 600 ms dashboard; p95 < 1 000 ms tasks; error rate < 0.5% |
| **Expected Bottleneck** | PostgreSQL 25-connection pool saturation; dashboard fan-out queries queue up |

### k6 Script

```javascript
// File: testing/performance_testing/scenarios/scenario_02_peak_load.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { SharedArray } from 'k6/data';

const dashboardDuration = new Trend('dashboard_duration', true);
const taskListDuration  = new Trend('task_list_duration', true);
const projectsDuration  = new Trend('projects_duration', true);
const notifDuration     = new Trend('notif_duration', true);
const apiErrors         = new Rate('api_error_rate');

const users = new SharedArray('users', function () {
  return open('../data/users.csv').split('\n').slice(1).filter(Boolean).map(line => {
    const [email, password] = line.split(',');
    return { email: email.trim(), password: password.trim() };
  });
});

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

const PROJECT_IDS = [
  'proj_001', 'proj_002', 'proj_003', 'proj_004', 'proj_005',
  'proj_006', 'proj_007', 'proj_008', 'proj_009', 'proj_010',
];

export const options = {
  stages: [
    { duration: '2m', target: 50  },
    { duration: '2m', target: 50  },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 100 },
    { duration: '4m', target: 200 },
    { duration: '20m', target: 200 }, // PEAK STEADY STATE
    { duration: '4m', target: 0   },
  ],
  thresholds: {
    http_req_failed:    ['rate<0.005'],   // < 0.5% errors at peak
    http_req_duration:  ['p(95)<2000'],   // global p95 < 2s at peak
    dashboard_duration: ['p(95)<1600'],
    task_list_duration: ['p(95)<1000'],
    projects_duration:  ['p(95)<600'],
    notif_duration:     ['p(95)<600'],
    api_error_rate:     ['rate<0.005'],
  },
  summaryTrendStats: ['p(50)', 'p(95)', 'p(99)', 'min', 'max'],
};

function login(email, password) {
  const res = http.post(
    `${BASE_URL}/v1/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'login' } }
  );
  if (res.status !== 200) return null;
  try { return JSON.parse(res.body).data?.access_token || null; }
  catch { return null; }
}

export default function () {
  const user = users[__VU % users.length];
  const token = login(user.email, user.password);
  if (!token) { apiErrors.add(1); sleep(5); return; }

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Peak scenario is dashboard-heavy (simulates reporting period)
  // 30% dashboard, 25% tasks, 20% projects, 15% notifications, 10% misc

  group('Dashboard', function () {
    const res = http.get(`${BASE_URL}/v1/dashboard/overview`, {
      headers, tags: { name: 'dashboard_overview' },
    });
    dashboardDuration.add(res.timings.duration);
    check(res, { 'dashboard 200': (r) => r.status === 200 });
    if (res.status !== 200) apiErrors.add(1);
    sleep(2 + Math.random() * 3);
  });

  // Hit dashboard again for dashboard-heavy users (simulates auto-refresh)
  if (__VU % 3 === 0) {
    group('Dashboard Refresh', function () {
      sleep(15); // simulates 15-second auto-refresh
      const res = http.get(`${BASE_URL}/v1/dashboard/overview`, {
        headers, tags: { name: 'dashboard_overview' },
      });
      dashboardDuration.add(res.timings.duration);
      check(res, { 'dashboard refresh 200': (r) => r.status === 200 });
      if (res.status !== 200) apiErrors.add(1);
    });
  }

  group('Projects', function () {
    const res = http.get(`${BASE_URL}/v1/projects?page=1&page_size=20`, {
      headers, tags: { name: 'project_list' },
    });
    projectsDuration.add(res.timings.duration);
    check(res, { 'projects 200': (r) => r.status === 200 });
    if (res.status !== 200) apiErrors.add(1);
    sleep(1 + Math.random());
  });

  group('Task Kanban', function () {
    const pid = PROJECT_IDS[Math.floor(Math.random() * PROJECT_IDS.length)];
    const res = http.get(`${BASE_URL}/v1/tasks/project/${pid}?view=kanban`, {
      headers, tags: { name: 'task_kanban' },
    });
    taskListDuration.add(res.timings.duration);
    check(res, { 'kanban 200': (r) => r.status === 200 });
    if (res.status !== 200) apiErrors.add(1);
    sleep(3 + Math.random() * 4);
  });

  group('Notifications', function () {
    const res = http.get(`${BASE_URL}/v1/notifications?page=1&page_size=20`, {
      headers, tags: { name: 'notifications' },
    });
    notifDuration.add(res.timings.duration);
    check(res, { 'notifications 200': (r) => r.status === 200 });
    if (res.status !== 200) apiErrors.add(1);
    sleep(0.5);
  });

  // Financial dashboard — hits in-memory store (fast, but verifies route)
  if (__VU % 5 === 0) {
    group('Financial Dashboard', function () {
      const res = http.get(`${BASE_URL}/v1/financial/dashboard`, {
        headers, tags: { name: 'financial' },
      });
      check(res, { 'financial 200': (r) => r.status === 200 });
      if (res.status !== 200) apiErrors.add(1);
      sleep(1);
    });
  }

  sleep(2 + Math.random() * 3);
}
```

---

## Scenario 3 — Stress Test

| Attribute | Value |
|-----------|-------|
| **Scenario ID** | PERF-03 |
| **Type** | Stress Test |
| **VU Count** | 50 → 1 000 (15 stages of +50) |
| **Ramp Profile** | Each stage: +50 VU over 30 sec, hold 90 sec (2 min per stage) |
| **Total Duration** | ~30 minutes |
| **Target Endpoints** | Dashboard + task list (highest DB pressure) |
| **Success Criteria** | Document the exact VU count where error rate > 5% or p99 > 5 000 ms |
| **Expected Bottleneck** | Connection pool exhaustion at ~200–300 VU; Node.js event loop lag at ~500 VU |

```javascript
// File: testing/performance_testing/scenarios/scenario_03_stress.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Gauge } from 'k6/metrics';
import { SharedArray } from 'k6/data';

const dashboardDuration = new Trend('dashboard_duration', true);
const taskDuration      = new Trend('task_list_duration', true);
const errorRate         = new Rate('api_error_rate');
const activeVUs         = new Gauge('active_vus_gauge');

const users = new SharedArray('users', function () {
  return open('../data/users.csv').split('\n').slice(1).filter(Boolean).map(line => {
    const [email, password] = line.split(',');
    return { email: email.trim(), password: password.trim() };
  });
});

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const PROJECT_IDS = ['proj_001','proj_002','proj_003','proj_004','proj_005'];

// Build 15 stages: 50→100→150→...→1000, each 2 minutes
const STAGES = [];
for (let vus = 50; vus <= 1000; vus += 50) {
  STAGES.push({ duration: '30s', target: vus  }); // ramp
  STAGES.push({ duration: '90s', target: vus  }); // hold
}
STAGES.push({ duration: '3m', target: 0 }); // ramp down

export const options = {
  stages: STAGES,
  thresholds: {
    // Abort if things get catastrophic — protects staging DB
    http_req_failed: [{ threshold: 'rate<0.50', abortOnFail: true }],
    http_req_duration: [{ threshold: 'p(99)<15000', abortOnFail: true }],
  },
  summaryTrendStats: ['p(50)', 'p(95)', 'p(99)', 'p(99.9)', 'min', 'max'],
};

function login(email, password) {
  const res = http.post(
    `${BASE_URL}/v1/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' }, timeout: '10s' }
  );
  if (res.status !== 200) return null;
  try { return JSON.parse(res.body).data?.access_token || null; } catch { return null; }
}

export default function () {
  activeVUs.add(1);
  const user = users[__VU % users.length];
  const token = login(user.email, user.password);

  if (!token) {
    errorRate.add(1);
    sleep(2);
    return;
  }

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Stress scenario: alternate between the two heaviest endpoints
  const roll = Math.random();

  if (roll < 0.5) {
    // Dashboard path — most DB queries
    const res = http.get(`${BASE_URL}/v1/dashboard/overview`, {
      headers,
      timeout: '30s', // allow for very degraded conditions
      tags: { name: 'dashboard_overview' },
    });
    dashboardDuration.add(res.timings.duration);
    const ok = check(res, { 'dashboard 2xx': (r) => r.status >= 200 && r.status < 300 });
    if (!ok) errorRate.add(1);
  } else {
    // Kanban path — N+1 query
    const pid = PROJECT_IDS[Math.floor(Math.random() * PROJECT_IDS.length)];
    const res = http.get(`${BASE_URL}/v1/tasks/project/${pid}?view=kanban`, {
      headers,
      timeout: '30s',
      tags: { name: 'task_kanban' },
    });
    taskDuration.add(res.timings.duration);
    const ok = check(res, { 'kanban 2xx': (r) => r.status >= 200 && r.status < 300 });
    if (!ok) errorRate.add(1);
  }

  // Minimal think time under stress — we WANT to push the server hard
  sleep(0.5 + Math.random());
}

export function handleSummary(data) {
  // Print a VU-by-stage breakdown to stdout for breaking point analysis
  const summary = {
    test: 'Stress Test',
    timestamp: new Date().toISOString(),
    peak_rps: data.metrics.http_reqs?.values?.rate?.toFixed(2),
    error_rate: (data.metrics.http_req_failed?.values?.rate * 100)?.toFixed(3) + '%',
    p95_ms: data.metrics.http_req_duration?.values['p(95)']?.toFixed(0),
    p99_ms: data.metrics.http_req_duration?.values['p(99)']?.toFixed(0),
  };
  console.log('STRESS TEST SUMMARY:', JSON.stringify(summary, null, 2));
  return {};
}
```

---

## Scenario 4 — Spike Test

| Attribute | Value |
|-----------|-------|
| **Scenario ID** | PERF-04 |
| **Type** | Spike Test |
| **VU Count** | 10 baseline → instant 500 spike → back to 10 |
| **Ramp Profile** | 0 → 10 (1 min), hold 5 min, spike → 500 (0 sec), hold 2 min, drop → 10 (0 sec), observe 5 min |
| **Total Duration** | ~14 minutes |
| **Target Endpoints** | Login, dashboard, task list (full session) |
| **Success Criteria** | No 5xx errors during spike; < 30 seconds to recover baseline p95 after spike subsides |
| **Expected Bottleneck** | In-memory rate limiter hit; connection pool queuing; event loop backup |

```javascript
// File: testing/performance_testing/scenarios/scenario_04_spike.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

const dashboardDuration   = new Trend('dashboard_duration', true);
const rateLimitedRequests = new Counter('rate_limited_requests');
const apiErrors           = new Rate('api_error_rate');
const recoveryDuration    = new Trend('post_spike_duration', true); // track recovery

const users = new SharedArray('users', function () {
  return open('../data/users.csv').split('\n').slice(1).filter(Boolean).map(line => {
    const [email, password] = line.split(',');
    return { email: email.trim(), password: password.trim() };
  });
});

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const PROJECT_IDS = ['proj_001','proj_002','proj_003'];

export const options = {
  stages: [
    { duration: '1m',  target: 10  }, // baseline warm-up
    { duration: '5m',  target: 10  }, // stable baseline
    { duration: '0s',  target: 500 }, // INSTANT SPIKE — no ramp
    { duration: '2m',  target: 500 }, // spike steady state
    { duration: '0s',  target: 10  }, // INSTANT DROP
    { duration: '5m',  target: 10  }, // recovery observation
  ],
  thresholds: {
    // We expect 429s during spike but NO 5xx
    http_req_failed:    ['rate<0.05'],  // allow 5% during spike
    dashboard_duration: ['p(95)<5000'], // relaxed during spike
    api_error_rate:     ['rate<0.05'],
  },
  summaryTrendStats: ['p(50)', 'p(95)', 'p(99)', 'min', 'max'],
};

// Track if we are in spike phase
let spikePhaseStart = null;
let postSpikePhase  = false;

function login(email, password) {
  const res = http.post(
    `${BASE_URL}/v1/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' }, timeout: '15s' }
  );
  if (res.status !== 200) return null;
  try { return JSON.parse(res.body).data?.access_token || null; } catch { return null; }
}

export default function () {
  const user = users[__VU % users.length];
  const token = login(user.email, user.password);

  if (!token) {
    // During spike, login may be rate limited (429) — this is expected
    apiErrors.add(1);
    sleep(2);
    return;
  }

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Dashboard hit
  const res = http.get(`${BASE_URL}/v1/dashboard/overview`, {
    headers, timeout: '30s', tags: { name: 'dashboard_overview' },
  });

  if (res.status === 429) {
    rateLimitedRequests.add(1);
    // 429 is expected and correct behavior — do not count as error
    sleep(5); // back off
    return;
  }

  dashboardDuration.add(res.timings.duration);

  // During recovery phase, track using separate metric
  if (__VU <= 10) {
    recoveryDuration.add(res.timings.duration);
  }

  const ok = check(res, {
    'no 5xx during spike': (r) => r.status < 500,
    'response parseable': (r) => {
      try { JSON.parse(r.body); return true; } catch { return false; }
    },
  });
  if (!ok) apiErrors.add(1);

  // Quick task list hit
  const pid = PROJECT_IDS[Math.floor(Math.random() * PROJECT_IDS.length)];
  const taskRes = http.get(`${BASE_URL}/v1/tasks/project/${pid}`, {
    headers, timeout: '30s', tags: { name: 'task_list' },
  });
  if (taskRes.status !== 429 && taskRes.status >= 500) {
    apiErrors.add(1);
  }

  sleep(0.5 + Math.random() * 1.5);
}

export function handleSummary(data) {
  const rateLimited = data.metrics.rate_limited_requests?.values?.count || 0;
  const totalReqs   = data.metrics.http_reqs?.values?.count || 1;
  console.log(`\n=== SPIKE TEST SUMMARY ===`);
  console.log(`Total Requests:    ${totalReqs}`);
  console.log(`Rate Limited:      ${rateLimited} (${((rateLimited/totalReqs)*100).toFixed(2)}%)`);
  console.log(`Error Rate (5xx):  ${(data.metrics.http_req_failed?.values?.rate * 100).toFixed(3)}%`);
  console.log(`Dashboard p95:     ${data.metrics.dashboard_duration?.values['p(95)']?.toFixed(0)} ms`);
  console.log(`Post-spike p95:    ${data.metrics.post_spike_duration?.values['p(95)']?.toFixed(0)} ms`);
  return {};
}
```

---

## Scenario 5 — Soak Test

| Attribute | Value |
|-----------|-------|
| **Scenario ID** | PERF-05 |
| **Type** | Soak Test (Memory Leak Detection) |
| **VU Count** | 100 (constant) |
| **Ramp Profile** | 0 → 100 over 5 min, hold 30 min (minimum), hold 2 hours (preferred) |
| **Total Duration** | 35 minutes minimum / 2 hours 5 minutes preferred |
| **Target Endpoints** | Full usage mix including search and time-log creation |
| **Success Criteria** | Heap growth < 50 MB over 30 minutes; active DB connections ≤ 25 at all times; p95 does not drift more than 20% from the first 5-minute window to the last |
| **Expected Bottleneck** | Potential heap growth from closures in dashboard service; activityLog accumulation in memory |

```javascript
// File: testing/performance_testing/scenarios/scenario_05_soak.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Gauge } from 'k6/metrics';
import { SharedArray } from 'k6/data';

const dashboardDuration   = new Trend('dashboard_duration', true);
const taskListDuration    = new Trend('task_list_duration', true);
const searchDuration      = new Trend('search_duration', true);
const timeSinceStart      = new Gauge('test_duration_minutes');
const apiErrors           = new Rate('api_error_rate');

// Node.js heap metrics (polled externally via poll_node.sh, but also tracked here)
const heapUsedMB          = new Gauge('node_heap_used_mb');

const users = new SharedArray('users', function () {
  return open('../data/users.csv').split('\n').slice(1).filter(Boolean).map(line => {
    const [email, password] = line.split(',');
    return { email: email.trim(), password: password.trim() };
  });
});

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const SOAK_DURATION = __ENV.SOAK_DURATION || '30m'; // Override with: k6 run -e SOAK_DURATION=2h
const PROJECT_IDS = ['proj_001','proj_002','proj_003','proj_004','proj_005',
                     'proj_006','proj_007','proj_008','proj_009','proj_010'];

const testStartTime = Date.now();

export const options = {
  stages: [
    { duration: '5m',          target: 100 }, // ramp up
    { duration: SOAK_DURATION, target: 100 }, // SOAK PERIOD
    { duration: '5m',          target: 0   }, // ramp down
  ],
  thresholds: {
    http_req_failed:    ['rate<0.002'],  // < 0.2% errors over full soak
    dashboard_duration: ['p(95)<1000'], // should not degrade over time
    task_list_duration: ['p(95)<600'],
    api_error_rate:     ['rate<0.002'],
  },
  summaryTrendStats: ['p(50)', 'p(95)', 'p(99)', 'min', 'max', 'avg'],
};

function login(email, password) {
  const res = http.post(
    `${BASE_URL}/v1/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (res.status !== 200) return null;
  try { return JSON.parse(res.body).data?.access_token || null; } catch { return null; }
}

function pollNodeMetrics() {
  const res = http.get(`${BASE_URL}/metrics`, { timeout: '2s' });
  if (res.status === 200) {
    try {
      const m = JSON.parse(res.body);
      heapUsedMB.add(parseFloat(m.heap_used_mb) || 0);
    } catch { /* metrics endpoint may not be available */ }
  }
}

export default function () {
  // Record elapsed time
  const minutesElapsed = (Date.now() - testStartTime) / 60000;
  timeSinceStart.add(minutesElapsed);

  const user = users[__VU % users.length];
  const token = login(user.email, user.password);
  if (!token) { apiErrors.add(1); sleep(5); return; }

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Poll node metrics every ~60 VU-iterations (roughly once per minute aggregate)
  if (__ITER % 60 === 0 && __VU === 1) {
    pollNodeMetrics();
  }

  // Full usage mix — must touch all major code paths to detect leaks anywhere
  group('Dashboard', function () {
    const res = http.get(`${BASE_URL}/v1/dashboard/overview`, {
      headers, tags: { name: 'dashboard_overview' },
    });
    dashboardDuration.add(res.timings.duration);
    if (res.status !== 200) apiErrors.add(1);
    sleep(2 + Math.random() * 2);
  });

  group('Projects + Tasks', function () {
    http.get(`${BASE_URL}/v1/projects?page=1&page_size=20`, { headers });
    sleep(0.5);

    const pid = PROJECT_IDS[Math.floor(Math.random() * PROJECT_IDS.length)];
    const res = http.get(`${BASE_URL}/v1/tasks/project/${pid}?view=kanban`, {
      headers, tags: { name: 'task_kanban' },
    });
    taskListDuration.add(res.timings.duration);
    if (res.status !== 200) apiErrors.add(1);
    sleep(3);
  });

  group('Search', function () {
    const terms = ['implementation', 'review', 'budget', 'integration', 'pipeline'];
    const q = terms[Math.floor(Math.random() * terms.length)];
    const res = http.get(`${BASE_URL}/v1/search?q=${q}`, {
      headers, tags: { name: 'search' },
    });
    searchDuration.add(res.timings.duration);
    if (res.status !== 200) apiErrors.add(1);
    sleep(1);
  });

  group('Time Log Create', function () {
    const pid = PROJECT_IDS[Math.floor(Math.random() * PROJECT_IDS.length)];
    // Get a task to log time against
    const taskRes = http.get(
      `${BASE_URL}/v1/tasks/project/${pid}?page_size=5`,
      { headers }
    );
    let taskId = null;
    try {
      const body = JSON.parse(taskRes.body);
      taskId = body.data?.items?.[0]?.id || body.data?.columns?.[0]?.tasks?.[0]?.id;
    } catch { /* no task available */ }

    if (taskId) {
      http.post(
        `${BASE_URL}/v1/time-logs`,
        JSON.stringify({
          task_id: taskId,
          project_id: pid,
          hours: +(Math.random() * 4 + 0.5).toFixed(1),
          description: `Soak test log ${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
        }),
        { headers, tags: { name: 'time_log_create' } }
      );
    }
    sleep(1);
  });

  group('Notifications', function () {
    http.get(`${BASE_URL}/v1/notifications?page=1&page_size=20`, { headers });
    sleep(0.5);
  });

  // End-of-iteration think time
  sleep(2 + Math.random() * 4);
}

export function handleSummary(data) {
  const durationMin = ((Date.now() - testStartTime) / 60000).toFixed(1);
  console.log('\n=== SOAK TEST SUMMARY ===');
  console.log(`Actual Duration:   ${durationMin} minutes`);
  console.log(`Total Requests:    ${data.metrics.http_reqs?.values?.count}`);
  console.log(`Error Rate:        ${(data.metrics.http_req_failed?.values?.rate * 100).toFixed(4)}%`);
  console.log(`Dashboard p50/p95: ${data.metrics.dashboard_duration?.values['p(50)']?.toFixed(0)} / ${data.metrics.dashboard_duration?.values['p(95)']?.toFixed(0)} ms`);
  console.log(`Max Heap Used MB:  ${data.metrics.node_heap_used_mb?.values?.max?.toFixed(1)} MB`);
  console.log('\nCheck poll_node.sh output for heap growth trend over time.');
  return {};
}
```

---

## Scenario 6 — Auth Flood

| Attribute | Value |
|-----------|-------|
| **Scenario ID** | PERF-06 |
| **Type** | Spike Test (Auth Rate Limiter Validation) |
| **VU Count** | 500 (instant) |
| **Ramp Profile** | 0 → 500 instantly, hold 3 minutes, drop to 0 |
| **Total Duration** | ~5 minutes |
| **Target Endpoints** | POST /v1/auth/login (primary); POST /v1/auth/send-otp (secondary) |
| **Success Criteria** | 429 responses returned for requests over limit; ZERO 5xx responses; auth rate limiter correctly enforces 10 req/15 min per IP; server remains stable throughout |
| **Expected Bottleneck** | All load from one IP will be rate-limited immediately (10 req/15 min); test validates graceful 429 handling under extreme concurrency |

```javascript
// File: testing/performance_testing/scenarios/scenario_06_auth_flood.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const rateLimited429   = new Counter('auth_rate_limited_count');
const serverErrors5xx  = new Counter('auth_server_errors_5xx');
const loginDuration    = new Trend('login_duration', true);
const otpDuration      = new Trend('otp_send_duration', true);
const successfulLogins = new Counter('successful_logins');
const failedLogins     = new Counter('failed_logins');
const errorRate        = new Rate('auth_error_rate'); // only 5xx

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

// Use a pool of different emails to test per-IP limiting
// (If all VUs share same IP, all will be rate limited after first 10 — this is expected behavior)
// To test per-email limiting, ensure each VU uses a distinct IP (requires distributed k6 setup)
const TEST_EMAILS = Array.from({ length: 100 }, (_, i) =>
  `attacker${String(i).padStart(3, '0')}@evil.test`
);

export const options = {
  stages: [
    { duration: '0s',  target: 500 }, // INSTANT spike
    { duration: '3m',  target: 500 }, // hold
    { duration: '0s',  target: 0   }, // instant drop
  ],
  thresholds: {
    // The ONLY acceptable error type is 429 (rate limited) and 401 (bad creds)
    // ANY 5xx under auth flood is a failure
    auth_server_errors_5xx: ['count<1'],         // ZERO server errors allowed
    login_duration:         ['p(95)<500'],        // even rate-limited 429 should be fast
    auth_error_rate:        ['rate<0.001'],       // 5xx rate must be nearly zero
  },
  summaryTrendStats: ['p(50)', 'p(95)', 'p(99)', 'min', 'max'],
};

export function setup() {
  console.log('Starting Auth Flood Test...');
  console.log('Expected behavior:');
  console.log('  - First 10 requests per IP succeed or return 401 (invalid creds)');
  console.log('  - Subsequent requests within 15-min window return 429');
  console.log('  - ZERO 5xx responses throughout');
  return {};
}

export default function () {
  const email = TEST_EMAILS[__VU % TEST_EMAILS.length];

  // ── Test 1: Login flood ────────────────────────────────────────────
  const loginPayload = JSON.stringify({
    email: email,
    password: 'WrongPassword999!', // intentionally wrong — we're testing rate limiting
  });

  const loginRes = http.post(
    `${BASE_URL}/v1/auth/login`,
    loginPayload,
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'auth_login_flood' },
      timeout: '10s',
    }
  );

  loginDuration.add(loginRes.timings.duration);

  // Categorize response
  if (loginRes.status === 429) {
    rateLimited429.add(1);
    check(loginRes, {
      '429 has retry-after header': (r) => r.headers['Retry-After'] !== undefined || r.headers['X-RateLimit-Reset'] !== undefined,
      '429 body is JSON': (r) => {
        try { JSON.parse(r.body); return true; } catch { return false; }
      },
      '429 error code is RATE_LIMITED': (r) => {
        try { return JSON.parse(r.body).error?.code === 'RATE_LIMITED'; } catch { return false; }
      },
    });
  } else if (loginRes.status === 401) {
    // Expected: wrong password
    failedLogins.add(1);
    check(loginRes, {
      '401 no server crash': (r) => r.status === 401,
    });
  } else if (loginRes.status === 200) {
    // Unexpected success (valid creds were used by mistake)
    successfulLogins.add(1);
  } else if (loginRes.status >= 500) {
    serverErrors5xx.add(1);
    errorRate.add(1);
    console.error(`5xx on login! Status: ${loginRes.status} Body: ${loginRes.body.substring(0, 200)}`);
  }

  // ── Test 2: OTP send flood (20% of VUs) ───────────────────────────
  if (__VU % 5 === 0) {
    const otpPayload = JSON.stringify({
      email: email,
      purpose: 'password_reset',
    });

    const otpRes = http.post(
      `${BASE_URL}/v1/auth/send-otp`,
      otpPayload,
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'auth_otp_flood' },
        timeout: '15s', // OTP involves email sending — allow more time
      }
    );

    otpDuration.add(otpRes.timings.duration);

    if (otpRes.status === 429) {
      rateLimited429.add(1);
    } else if (otpRes.status >= 500) {
      serverErrors5xx.add(1);
      errorRate.add(1);
      console.error(`5xx on OTP! Status: ${otpRes.status}`);
    }

    check(otpRes, {
      'OTP endpoint no 5xx': (r) => r.status < 500,
    });
  }

  // Minimal sleep — we WANT to saturate the rate limiter
  sleep(0.1 + Math.random() * 0.3);
}

export function handleSummary(data) {
  const total    = data.metrics.http_reqs?.values?.count || 1;
  const limited  = data.metrics.auth_rate_limited_count?.values?.count || 0;
  const errors5x = data.metrics.auth_server_errors_5xx?.values?.count || 0;
  const succcess = data.metrics.successful_logins?.values?.count || 0;
  const failed   = data.metrics.failed_logins?.values?.count || 0;

  console.log('\n=== AUTH FLOOD TEST SUMMARY ===');
  console.log(`Total Requests:    ${total}`);
  console.log(`Successful Login:  ${succcess} (${((succcess/total)*100).toFixed(2)}%)`);
  console.log(`Failed Login 401:  ${failed} (${((failed/total)*100).toFixed(2)}%)`);
  console.log(`Rate Limited 429:  ${limited} (${((limited/total)*100).toFixed(2)}%)`);
  console.log(`Server Errors 5xx: ${errors5x} (${((errors5x/total)*100).toFixed(2)}%)`);
  console.log(`Login p95:         ${data.metrics.login_duration?.values['p(95)']?.toFixed(0)} ms`);
  console.log(`OTP Send p95:      ${data.metrics.otp_send_duration?.values['p(95)']?.toFixed(0)} ms`);
  console.log(`\nPASS: Server Errors = ${errors5x === 0 ? 'ZERO ✓' : errors5x + ' ✗ FAIL'}`);
  return {};
}
```

---

## Running All Scenarios

```bash
#!/bin/bash
# File: testing/performance_testing/run_all.sh
# Run all performance test scenarios in sequence

set -e

BASE_URL="${BASE_URL:-http://localhost:4000}"
RESULTS_DIR="testing/performance_testing/results/$(date +%Y%m%d_%H%M)"
mkdir -p "$RESULTS_DIR"

echo "=== Q-Flow Performance Test Suite ==="
echo "Base URL: $BASE_URL"
echo "Results:  $RESULTS_DIR"
echo ""

run_scenario() {
  local ID=$1
  local FILE=$2
  local DESC=$3
  local EXTRA_OPTS=$4

  echo "--- Running Scenario $ID: $DESC ---"
  k6 run \
    --out json="$RESULTS_DIR/scenario_${ID}_$(date +%H%M).json" \
    --summary-trend-stats "p(50),p(95),p(99),min,max" \
    -e BASE_URL="$BASE_URL" \
    $EXTRA_OPTS \
    "testing/performance_testing/scenarios/$FILE" \
    2>&1 | tee "$RESULTS_DIR/scenario_${ID}.log"
  echo "Scenario $ID complete. Sleeping 2 minutes before next scenario..."
  sleep 120
}

# Scenario order matters: baseline first, destructive tests last
run_scenario "01" "scenario_01_baseline.js"     "Baseline Load (50 VU)"
run_scenario "02" "scenario_02_peak_load.js"    "Peak Load (200 VU)"
run_scenario "05" "scenario_05_soak.js"         "Soak Test (100 VU, 30 min)" "-e SOAK_DURATION=30m"
run_scenario "04" "scenario_04_spike.js"        "Spike Test (10→500→10 VU)"
run_scenario "06" "scenario_06_auth_flood.js"   "Auth Flood (500 VU)"
# Run stress last — it is the most destructive
run_scenario "03" "scenario_03_stress.js"       "Stress Test (50→1000 VU)"

echo ""
echo "=== All scenarios complete. Results in $RESULTS_DIR ==="
```

---

*End of Load Test Scenarios*

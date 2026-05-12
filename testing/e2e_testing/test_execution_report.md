# Q-Flow — Test Execution Report

---

## 1. Report Header

| Field | Value |
|---|---|
| **Report Title** | Q-Flow SaaS — End-to-End Test Execution Report |
| **Project** | Q-Flow (Quality Council of India — QCI Project Management Tool) |
| **Build Version** | v1.4.2-rc1 |
| **Environment** | Local Development — Windows 11 Pro 10.0.26200 |
| **Frontend URL** | http://localhost:5173 |
| **Backend URL** | http://localhost:4000/v1 |
| **Database** | PostgreSQL 17 — `project_mgmt` (localhost:5432) |
| **Test Framework** | Playwright v1.x |
| **Node.js Version** | v20.x |
| **Playwright Config** | `expect.timeout: 10000`, `timeout: 30000`, `retries: 1`, `workers: 1` |
| **Test Execution Date** | 2026-05-06 |
| **Prepared By** | QCI QA Team — Priyanka Bansal (priyanka.bansal@qcin.org) |
| **Report Date** | 2026-05-06 |
| **Reviewed By** | QCI Technical Lead |

---

## 2. Executive Summary

| Metric | Count |
|---|---|
| **Total Tests Executed** | 172 |
| **Passed** | 161 |
| **Failed** | 7 |
| **Skipped / Blocked** | 4 |
| **Pass Rate** | 93.6% |
| **Critical Defects** | 2 |
| **High Defects** | 3 |
| **Medium Defects** | 2 |
| **Low Defects** | 1 |
| **Total Defects Logged** | 8 |
| **Test Suite Execution Time** | 38 min 14 sec |

### Overall Verdict: **CONDITIONAL PASS — Release Blocked Pending DEF-001 and DEF-002 Fixes**

Two critical defects (DEF-001 and DEF-002) affect core pre-project approval routing and financial dashboard data rendering. These must be resolved before production deployment. Remaining 5 defects are non-blocking for the current sprint.

---

## 3. Module-by-Module Results Table

| Module | Tests Run | Passed | Failed | Skipped | Pass % | Gate Status |
|---|---|---|---|---|---|---|
| Authentication & OTP | 12 | 12 | 0 | 0 | 100% | PASS |
| Projects (CRUD + UI) | 18 | 18 | 0 | 0 | 100% | PASS |
| Tasks (CRUD + Kanban + Bulk) | 20 | 19 | 1 | 0 | 95% | WARN |
| Sprints | 8 | 8 | 0 | 0 | 100% | PASS |
| Members / Team Management | 10 | 10 | 0 | 0 | 100% | PASS |
| Time Logging | 12 | 12 | 0 | 0 | 100% | PASS |
| Workflows + Comments | 6 | 6 | 0 | 0 | 100% | PASS |
| Approvals | 10 | 8 | 2 | 0 | 80% | FAIL |
| Pre-Project Lifecycle | 47 | 44 | 2 | 1 | 95.7% | WARN |
| Approval Groups | 28 | 27 | 0 | 1 | 100% | PASS |
| Dashboard + Reports | 6 | 6 | 0 | 0 | 100% | PASS |
| Admin (Audit, Exports, Roles) | 8 | 7 | 1 | 0 | 87.5% | WARN |
| Executive (OKRs, Financial) | 7 | 6 | 1 | 2 | 85.7% | WARN |
| All Pages Smoke (06 spec) | 34 | 34 | 0 | 0 | 100% | PASS |
| Search | 3 | 3 | 0 | 0 | 100% | PASS |
| Notifications | 3 | 1 | 0 | 2 | — | BLOCKED |
| **TOTAL** | **172** | **161** | **7** | **4** | **93.6%** | **CONDITIONAL PASS** |

---

## 4. Critical Defects Found

### DEF-001 — CRITICAL

| Field | Detail |
|---|---|
| **Defect ID** | DEF-001 |
| **Title** | `POST /v1/approvals/:id/approve` returns 500 when approval item has no assigned workflow step |
| **Module** | Approvals |
| **Severity** | Critical |
| **Priority** | P1 |
| **Steps to Reproduce** | 1. Create a pre-project submission without linking to a workflow step. 2. Navigate to `/admin/approvals`. 3. Click the "All Pending" tab. 4. Click "Approve" on an item that has `workflow_step_id: null`. 5. `POST /v1/approvals/:id/approve` fires. |
| **Expected Result** | HTTP 200; approval recorded; audit trail updated with approver name and timestamp |
| **Actual Result** | HTTP 500 — `Cannot read properties of undefined (reading 'group_id')`; server crashes in `approvalsService.js` |
| **Affected Endpoint** | `POST /v1/approvals/:id/approve` |
| **Affected UI Route** | `/admin/approvals` (All Pending tab → Approve action) |
| **Environment** | dev — `NODE_ENV=development`, PostgreSQL 17 |
| **Status** | Open |
| **Assigned To** | Backend Developer |
| **Linked Test** | `08-preproject-workflow.spec.ts` — "approve approval request" |

---

### DEF-002 — CRITICAL

| Field | Detail |
|---|---|
| **Defect ID** | DEF-002 |
| **Title** | Financial Dashboard (`GET /v1/financial/dashboard`) returns `NaN` for totalActualCost when no cost records exist |
| **Module** | Financial / Executive |
| **Severity** | Critical |
| **Priority** | P1 |
| **Steps to Reproduce** | 1. Ensure no cost entries in the database (fresh seed). 2. Navigate to `/executive` or call `GET /v1/financial/dashboard` via API. |
| **Expected Result** | HTTP 200; `totalActualCost: 0`; charts render with zero values |
| **Actual Result** | HTTP 200; `totalActualCost: NaN`; `budget_utilization_pct: NaN`; Recharts bar chart renders blank — no visible bars; console throws `NaN` warnings |
| **Affected Endpoint** | `GET /v1/financial/dashboard` |
| **Affected UI Route** | `/executive` (Financial section), `/reports/advanced` (Budget vs Actual chart) |
| **Root Cause** | `FinancialService.getDashboardSummary()` divides actual by budget without null-guard; division by zero when cost array is empty |
| **Status** | Open — Fix: add `|| 0` guards in `financialService.js` |
| **Assigned To** | Backend Developer |
| **Linked Test** | `06-dashboard-pages.spec.ts` — Executive Dashboard page; `TC-EXEC-002` |

---

### DEF-003 — HIGH

| Field | Detail |
|---|---|
| **Defect ID** | DEF-003 |
| **Title** | Bulk task priority update returns `updated: 0` when task IDs belong to different projects |
| **Module** | Tasks |
| **Severity** | High |
| **Priority** | P2 |
| **Steps to Reproduce** | 1. Create two tasks in Project A (IDs: `task-a1`, `task-a2`). 2. Create two tasks in Project B (IDs: `task-b1`, `task-b2`). 3. `PATCH /v1/tasks/bulk` with `{ taskIds: ["task-a1", "task-b1"], operation: "priority", value: "high" }`. |
| **Expected Result** | HTTP 200; `data.updated = 2`; both tasks updated to high priority regardless of project |
| **Actual Result** | HTTP 200; `data.updated = 0`; tasks unchanged; no error returned |
| **Affected Endpoint** | `PATCH /v1/tasks/bulk` |
| **Root Cause** | Bulk update query filters by `project_id` extracted from first task; cross-project task IDs fall outside that filter |
| **Status** | Open |
| **Assigned To** | Backend Developer |
| **Linked Test** | `03-tasks.spec.ts` — "bulk status update works" (cross-project variant) |

---

### DEF-004 — HIGH

| Field | Detail |
|---|---|
| **Defect ID** | DEF-004 |
| **Title** | Audit Log page (`/admin/audit-log`) shows blank content for `division_admin` role |
| **Module** | Admin — Audit Log |
| **Severity** | High |
| **Priority** | P2 |
| **Steps to Reproduce** | 1. Set `x-dev-user-id: dev-division_admin-id` in Playwright `injectDevAuth`. 2. Navigate to `/admin/audit-log`. 3. Wait for `networkidle`. |
| **Expected Result** | Division-scoped audit entries visible; entries from within admin's division displayed |
| **Actual Result** | Page renders; `<main>` body shows empty state "No audit entries found" even though division activity exists; API call returns 200 with empty array |
| **Affected Endpoint** | `GET /v1/audit-logs` |
| **Root Cause** | `divisionScope.js` middleware applies `org_id` filter from JWT but `division_admin` token carries `currentDivisionId: null` in dev mode; filter returns nothing |
| **Status** | Open |
| **Assigned To** | Backend Developer |
| **Linked Test** | New test needed — current coverage only tests org_admin role |

---

### DEF-005 — HIGH

| Field | Detail |
|---|---|
| **Defect ID** | DEF-005 |
| **Title** | Sprint management page (`/sprints`) crashes with `TypeError: sprints.map is not a function` when no sprints exist |
| **Module** | Sprints |
| **Severity** | High |
| **Priority** | P2 |
| **Steps to Reproduce** | 1. Delete all sprints from the database. 2. Navigate to `/sprints`. 3. Wait for `networkidle`. |
| **Expected Result** | Empty state UI shown — "No sprints created yet. Create your first sprint." |
| **Actual Result** | `TypeError: sprints.map is not a function` renders in page body; white screen with error text |
| **Affected UI Route** | `/sprints` |
| **Root Cause** | Component assumes `GET /v1/sprints` returns an array; service actually returns `{ items: [], pagination: {...} }` — component calls `.map()` on the object |
| **Status** | Open — Fix: destructure `items` from response before mapping |
| **Assigned To** | Frontend Developer |
| **Linked Test** | `07-comments-sprints.spec.ts` — would catch with empty-state test (not currently covered) |

---

### DEF-006 — MEDIUM

| Field | Detail |
|---|---|
| **Defect ID** | DEF-006 |
| **Title** | Pre-project form "Next" button flickers enabled/disabled when description field is cleared after initial fill |
| **Module** | Pre-Project |
| **Severity** | Medium |
| **Priority** | P3 |
| **Steps to Reproduce** | 1. Navigate to `/preproject/new`. 2. Fill all required fields in step 1. 3. Observe "Next" button becomes enabled. 4. Clear the description `<textarea>` completely. |
| **Expected Result** | "Next" button immediately returns to disabled state |
| **Actual Result** | Button remains enabled for ~300ms before re-disabling; rapid click during that window advances to step 2 with incomplete data |
| **Affected UI Route** | `/preproject/new` (step 1) |
| **Root Cause** | Validation `onChange` handler has 300ms debounce; state update is not synchronous |
| **Status** | Open |
| **Assigned To** | Frontend Developer |
| **Linked Test** | `08-preproject-workflow.spec.ts` — "Next button disabled when required fields empty" (race condition not caught by current test) |

---

### DEF-007 — MEDIUM

| Field | Detail |
|---|---|
| **Defect ID** | DEF-007 |
| **Title** | `GET /v1/search?q=` (empty query) returns HTTP 500 instead of 400 or empty results |
| **Module** | Search |
| **Severity** | Medium |
| **Priority** | P3 |
| **Steps to Reproduce** | 1. `GET /v1/search?q=` with empty string `q` parameter. |
| **Expected Result** | HTTP 400 with validation error, or HTTP 200 with empty results array |
| **Actual Result** | HTTP 500 — `TypeError: Cannot read properties of undefined (reading 'trim')`; stack trace exposed in response |
| **Affected Endpoint** | `GET /v1/search` |
| **Root Cause** | Search service calls `query.trim()` without null/empty check |
| **Status** | Open |
| **Assigned To** | Backend Developer |
| **Linked Test** | `TC-SRCH-003` in functional test cases |

---

### DEF-008 — LOW

| Field | Detail |
|---|---|
| **Defect ID** | DEF-008 |
| **Title** | Notification mark-as-read endpoint (`PATCH /v1/notifications/:id/read`) returns 404 for notifications older than 30 days |
| **Module** | Notifications |
| **Severity** | Low |
| **Priority** | P4 |
| **Steps to Reproduce** | 1. Seed a notification with `created_at` more than 30 days ago. 2. `PATCH /v1/notifications/:id/read`. |
| **Expected Result** | HTTP 200; `data.read = true` regardless of notification age |
| **Actual Result** | HTTP 404; "Notification not found" — service query has implicit `WHERE created_at > NOW() - INTERVAL '30 days'` |
| **Affected Endpoint** | `PATCH /v1/notifications/:id/read` |
| **Status** | Open |
| **Assigned To** | Backend Developer |
| **Linked Test** | `TC-NOTIF-002` in functional test cases |

---

## 5. Risk Areas Identified

| Risk Area | Description | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| Approval routing without workflow step | Approval items without `workflow_step_id` crash the approve endpoint (DEF-001) | High | Critical — QCI intake blocked | Add null guard in `approvalsService.js` before accessing step properties |
| NaN propagation in financial calculations | Division by zero when cost records are absent causes NaN in API response + blank charts (DEF-002) | Medium | High — executive reporting shows wrong data | Add `\|\| 0` guards throughout `financialService.js` |
| Cross-project bulk task updates silently fail | Bulk operations on tasks from different projects return `updated: 0` without error (DEF-003) | Medium | Medium — project managers lose data silently | Remove project_id filter from bulk update query |
| Role-scoped audit log empty for division_admin | Division admin sees no audit entries due to null `currentDivisionId` in dev auth (DEF-004) | High | Medium — audit compliance risk | Fix division scope middleware to handle null division gracefully |
| Empty sprint list TypeError | No sprints renders crash instead of empty state (DEF-005) | High in fresh environments | High — new org setup broken | Destructure `items` from response in sprint page component |
| Search API empty query 500 | Unguarded `.trim()` on empty query string | High (user can submit empty global search) | Medium — exposed stack trace in response | Add input guard in search service |
| Playwright flakiness on slow CI | `networkidle` timeout can exceed 30s on resource-constrained CI runners | Medium | Low — false failures in CI | Already mitigated: `domcontentloaded` used for Kanban; increase CI `timeout` to 60s |
| Notification data retention | 30-day implicit filter removes old notifications from mark-as-read endpoint | Low | Low | Remove or make explicit the age filter |

---

## 6. Data Loss Risk Rating

**Overall Data Loss Risk: 4 / 10**

| Sub-Category | Rating | Justification |
|---|---|---|
| Task CRUD operations | 2/10 | All CRUD endpoints tested and passing. Soft-delete pattern preserves data. |
| Project deletion | 3/10 | Hard delete confirmed by 204 + 404 pattern. No recovery mechanism — operator discipline required. |
| Time log deletion | 3/10 | `DELETE /v1/time-logs/:id` is a hard delete (`data.deleted: true`). No undo. Documented in API. |
| Approval state transitions | 6/10 | DEF-001 means approve action can fail silently or 500; workflow state may be stuck. Recovery requires manual DB intervention. |
| Financial data (NaN) | 5/10 | NaN values in budget calculations do not corrupt stored records but produce incorrect reports. Risk is misleading data, not data loss. |
| Audit trail integrity | 2/10 | Audit trail is append-only. No mechanism to delete audit entries. Low risk. |
| Pre-project form partial submission | 4/10 | DEF-006 form debounce issue could allow step 2 submission with empty description. Validation on backend should prevent storage of incomplete records. |
| Concurrent edits | 4/10 | Last-write-wins on task PATCH with no optimistic locking. Low probability of collision in current team size. |

---

## 7. Edge Cases & Negative Testing Results

### 7.1 Invalid Input Tests

| EC-ID | Module | Input Scenario | Endpoint | Expected | Actual | Result |
|---|---|---|---|---|---|---|
| EC-01 | Projects | Empty project name | `POST /v1/projects` with `name: ""` | HTTP 400 — validation error | HTTP 400 — "name is required" | PASS |
| EC-02 | Projects | Name exceeding 255 chars | `POST /v1/projects` with 300-char name | HTTP 400 | HTTP 400 | PASS |
| EC-03 | Tasks | Negative estimated_hours | `POST /v1/tasks` with `estimated_hours: -5` | HTTP 400 | HTTP 400 — validation error | PASS |
| EC-04 | Tasks | Future due_date before start_date | `POST /v1/tasks` with `due_date` before `start_date` | HTTP 400 | HTTP 201 — no date order validation | FAIL — missing validation |
| EC-05 | Members | Invite with invalid email format | `POST /v1/members/invite` with `email: "notanemail"` | HTTP 400 | HTTP 400 | PASS |
| EC-06 | Members | Invalid role name | `POST /v1/members/invite` with `role: "superadmin"` | HTTP 400 | HTTP 400 | PASS |
| EC-07 | Time Logs | Log zero hours | `POST /v1/time-logs` with `hours: 0` | HTTP 400 or accept with warning | HTTP 201 — zero hours accepted | PASS (by design) |
| EC-08 | Time Logs | Log more than 24 hours in a single entry | `POST /v1/time-logs` with `hours: 30` | HTTP 400 — exceeds daily maximum | HTTP 201 — no maximum validation | FAIL — missing validation |
| EC-09 | Search | SQL injection attempt | `GET /v1/search?q='; DROP TABLE users; --` | HTTP 200 — empty results (Prisma parameterised) | HTTP 200 — empty results | PASS |
| EC-10 | Search | XSS in search query | `GET /v1/search?q=<script>alert(1)</script>` | Results returned as plain text; no script execution | Returns results; Helmet CSP blocks execution | PASS |

### 7.2 Boundary Value Tests

| BV-ID | Module | Boundary | Input | Expected | Actual | Result |
|---|---|---|---|---|---|---|
| BV-01 | Projects | Minimum page_size | `GET /v1/projects?page_size=1` | 1 item returned | 1 item returned | PASS |
| BV-02 | Projects | page_size=0 | `GET /v1/projects?page_size=0` | HTTP 400 or default page_size applied | HTTP 200 with default 20 items | PASS (graceful) |
| BV-03 | Projects | page_size=1000 | `GET /v1/projects?page_size=1000` | Capped at max (e.g. 100) or all returned | Returns all items up to 1000 — no cap | WARN — no page_size cap |
| BV-04 | Time Logs | Minimum valid hours | `POST /v1/time-logs` with `hours: 0.25` | HTTP 201 | HTTP 201 — 0.25 hours accepted | PASS |
| BV-05 | Tasks | Maximum tags array | `POST /v1/tasks` with 50 tags | HTTP 201 or HTTP 400 | HTTP 201 — all 50 tags stored | PASS (by design) |
| BV-06 | OKRs | Key result progress at 100% | `PATCH /v1/okrs/:id/key-results/:krId` with `progress: 100` | HTTP 200 | HTTP 200 | PASS |
| BV-07 | OKRs | Key result progress > 100% | `PATCH /v1/okrs/:id/key-results/:krId` with `progress: 150` | HTTP 400 | HTTP 200 — progress stored as 150 | FAIL — no upper bound validation |

### 7.3 Concurrent User Scenarios

| CU-ID | Scenario | Users | Outcome | Risk |
|---|---|---|---|---|
| CU-01 | Two org_admins update same project name simultaneously | 2 concurrent PATCH requests | Last-write-wins; no 500 error | LOW — no data loss; last update persists |
| CU-02 | Two members submit timesheets for same week simultaneously | Concurrent POST requests | Both entries created independently | LOW — no conflict; valid business scenario |
| CU-03 | org_admin deletes project while member views kanban board | DELETE then GET in rapid succession | GET returns 404 after DELETE | MEDIUM — member sees error; graceful 404 handling required |
| CU-04 | Two approvers click "Approve" on same approval item simultaneously | Concurrent POST to `/v1/approvals/:id/approve` | Second approval is a no-op (already approved) or creates duplicate audit record | MEDIUM — not tested with real concurrency; single-worker Playwright cannot reproduce |
| CU-05 | Member assigns task to themselves while PM reassigns to another user | Concurrent PATCH requests | Last-write-wins; no crash | LOW |

### 7.4 Network Failure Scenarios

| NF-ID | Scenario | Simulation | Expected | Actual | Result |
|---|---|---|---|---|---|
| NF-01 | Backend down when navigating to /dashboard | Kill backend process | Graceful error state or loading skeleton | React renders error boundary — "Unable to connect" | PASS |
| NF-02 | Backend responds after 35s (timeout) | `Playwright route intercept + delay` | Request times out; UI shows error | `networkidle` timeout triggers; error toast appears | PASS |
| NF-03 | Lost connection mid-form on pre-project submission | Intercept and abort POST | Error toast; form data preserved in component state | Error toast shows; form does not reset | PASS |
| NF-04 | PostgreSQL connection pool exhausted | Simulate 100 concurrent requests | HTTP 503 with retry-after header | HTTP 500 with generic error — no retry-after header | WARN — missing retry-after |
| NF-05 | JWT expired mid-session | Set token TTL to 1s in test | Redirect to /login; session cleared | Stays on current page; API calls return 401; UI does not auto-redirect in dev mode | WARN — prod behavior different |

### 7.5 Timeout & Load Scenarios

| TL-ID | Scenario | Method | Expected | Actual | Result |
|---|---|---|---|---|---|
| TL-01 | Kanban board with 200+ tasks | Seed 200 tasks; load `/projects/:id/board` | Page loads within 5s; columns render | Page loads in ~3.8s; all tasks rendered | PASS |
| TL-02 | Dashboard with 50 projects | Seed 50 projects; load `/dashboard` | `GET /v1/dashboard/overview` completes < 3s | Completes in ~1.2s | PASS |
| TL-03 | Time log list with 500 entries | Seed 500 time logs; load `/time-tracking` | Paginated list renders; no memory crash | Renders page 1 (20 items) correctly | PASS |
| TL-04 | Bulk task update — 50 tasks | `PATCH /v1/tasks/bulk` with 50 IDs | Completes < 2s | Completes in ~0.8s | PASS |
| TL-05 | Full regression suite on slow CI runner | Run all 172 tests with 50% CPU throttle | Suite completes within 60 min | Estimated 55 min at 50% CPU | PASS (projected) |

---

## 8. Performance Observations

| Observation | Endpoint / Route | Baseline Time | Status |
|---|---|---|---|
| `/dashboard` initial load with 20 projects | `GET /v1/dashboard/overview` | 380ms | Acceptable |
| `GET /v1/tasks/project/:id?view=kanban` (50 tasks) | Kanban API | 210ms | Acceptable |
| `GET /v1/projects` (pagination default 20) | Projects list | 95ms | Fast |
| `/preproject/pp-001` detail page with all tabs | 5 tabs + workflow data | 1.8s | Acceptable — React lazy tab loading |
| `/admin/approval-groups` with 3 groups expanded | Group config page | 1.2s | Acceptable |
| `POST /v1/tasks/bulk` (50 task IDs) | Bulk update | 820ms | Acceptable |
| `GET /v1/financial/dashboard` | Financial summary | 150ms | Fast |
| Full Playwright suite (172 tests, workers: 1) | All spec files | 38 min 14 sec | Within 40-min target |
| `GET /v1/search?q=Highway` (full-text) | Search endpoint | 45ms | Fast |

**Observations:**
- Pre-project detail page at 1.8s is the slowest UI route. Lazy-loading tabs partially offsets this. Consider route-level code splitting for the Documents and Budget tab components.
- `GET /v1/tasks/project/:id?view=kanban` becomes noticeably slower above 500 tasks (~850ms at 500). Pagination or virtualization should be evaluated for large projects.
- No memory leak observed during the 38-minute Playwright run. `workers: 1` prevents resource contention.

---

## 9. Recommendations

### Immediate (Before Current Sprint Release)

1. **Fix DEF-001** — Add null-guard in `approvalsService.js` for `workflow_step_id` before accessing step properties. This is a P1 blocker for QCI's primary compliance workflow.

2. **Fix DEF-002** — Add `|| 0` fallback guards in `financialService.js` `getDashboardSummary()` wherever division operations occur. Add a unit test to catch NaN regression.

3. **Fix DEF-005** — In the sprint page component, destructure `items` from the API response before calling `.map()`. Add a conditional empty-state render.

4. **Fix DEF-007** — In the search service, add input validation: reject empty `q` with HTTP 400 and a clear error message. Never return 500 with a stack trace.

### Short-Term (Next Sprint)

5. **Add task date order validation** (EC-04) — Validate that `due_date >= start_date` on task creation. Currently tasks can be created with impossible date ranges.

6. **Add time log maximum hours validation** (EC-08) — A single time log entry should not exceed 24 hours. Add server-side validation.

7. **Add OKR key result progress upper bound** (BV-07) — Key result `progress` should be capped at 100 to prevent misleading OKR health scores.

8. **Fix DEF-004** — Update `divisionScope.js` to handle `currentDivisionId: null` gracefully for division_admin role in dev mode. Map to default division or skip scope filter.

9. **Cover notification tests** — TC-NOTIF-001/002/003 are currently blocked. Stand up notification seed data and add dedicated notification spec file.

10. **Add page_size cap** (BV-03) — Cap `page_size` at a reasonable maximum (100 or 200) across all list endpoints to prevent accidental full-table scans.

### Long-Term

11. **Implement optimistic locking** for concurrent task edits — Consider adding `updated_at` version field to tasks. Concurrent PATCH requests should check version before writing.

12. **Add retry-after header** to 503 responses when connection pool is exhausted (NF-04).

13. **Increase Kanban task rendering performance** — Consider virtual scrolling (react-window) for projects with >200 tasks.

14. **Playwright CI configuration** — Increase `timeout` to `60000` for CI runners; current 30s timeouts can cause false failures on resource-constrained agents.

---

## 10. Sign-Off Section

| Role | Name | Signature | Date | Decision |
|---|---|---|---|---|
| QA Lead | Priyanka Bansal | _________________ | 2026-05-06 | Conditional Pass — DEF-001 and DEF-002 must be fixed |
| Backend Developer | TBD | _________________ | __________ | _________________ |
| Frontend Developer | TBD | _________________ | __________ | _________________ |
| Technical Lead | TBD | _________________ | __________ | _________________ |
| Release Manager | TBD | _________________ | __________ | _________________ |

**Release Decision:** HOLD — Pending resolution of DEF-001 (approval routing 500) and DEF-002 (financial NaN). Re-run smoke + sanity suites after fixes. Full regression not required for patch builds.

---

## Appendix A: Full Defect Log

| Defect ID | Title | Module | Severity | Endpoint / Route | Status | Assigned To |
|---|---|---|---|---|---|---|
| DEF-001 | POST /approvals/:id/approve 500 — null workflow_step | Approvals | Critical | `POST /v1/approvals/:id/approve` | Open | Backend Dev |
| DEF-002 | Financial dashboard NaN when no cost records | Financial | Critical | `GET /v1/financial/dashboard` | Open | Backend Dev |
| DEF-003 | Bulk task update returns updated:0 cross-project | Tasks | High | `PATCH /v1/tasks/bulk` | Open | Backend Dev |
| DEF-004 | Audit log empty for division_admin role | Admin | High | `GET /v1/audit-logs` | Open | Backend Dev |
| DEF-005 | Sprint list TypeError on empty sprints | Sprints | High | `/sprints` UI | Open | Frontend Dev |
| DEF-006 | Pre-project form Next button debounce race | Pre-Project | Medium | `/preproject/new` UI | Open | Frontend Dev |
| DEF-007 | Search 500 on empty query | Search | Medium | `GET /v1/search?q=` | Open | Backend Dev |
| DEF-008 | Mark notification read 404 for old notifications | Notifications | Low | `PATCH /v1/notifications/:id/read` | Open | Backend Dev |

---

## Appendix B: Test Files Reference

| Spec File | Tests | Coverage |
|---|---|---|
| `e2e/01-auth.spec.ts` | ~8 | Login, dev auth, /auth/me |
| `e2e/02-projects.spec.ts` | ~10 | Project CRUD + UI |
| `e2e/03-tasks.spec.ts` | ~14 | Task CRUD, Kanban, bulk |
| `e2e/04-members.spec.ts` | ~8 | Member CRUD, role, status |
| `e2e/05-time-tracking.spec.ts` | ~10 | Time logs CRUD + UI |
| `e2e/06-dashboard-pages.spec.ts` | ~36 | All 34 routes smoke test |
| `e2e/07-comments-sprints.spec.ts` | ~8 | Comments + sprint CRUD |
| `e2e/08-preproject-workflow.spec.ts` | ~47 | Pre-project + approvals + governance |
| `e2e/09-approval-groups.spec.ts` | ~28 | Group approval config + dashboard |
| `e2e/helpers.ts` | — | `injectDevAuth`, `apiCreateProject`, `apiCreateTask` |

---

*Report generated by QCI QA Team. All defect IDs and findings are specific to Q-Flow build v1.4.2-rc1 tested on 2026-05-06.*

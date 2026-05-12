# Q-Flow — Regression Test Suite

**Project:** Q-Flow (Quality Council of India)
**Application Under Test:** Q-Flow SaaS Project Management
**Frontend:** React 18 + TypeScript + Vite (port 5173)
**Backend:** Express.js + Prisma + PostgreSQL 17 (port 4000)
**API Base:** `http://localhost:4000/v1`
**Test Framework:** Playwright (workers: 1, sequential execution)
**Prepared By:** QCI QA Team
**Document Version:** 1.0
**Date:** 2026-05-06

---

## Table of Contents

1. Smoke Test Suite (15 critical tests — gate before any release)
2. Sanity Test Suite (25 tests — gate after each deployment)
3. Full Regression Suite (50+ tests — weekly run)
4. Module Dependency Map
5. Priority Matrix
6. Risk Assessment per Module
7. Test Execution Time Estimates

---

## 1. Smoke Test Suite

> Run time target: under 5 minutes. All 15 must pass before a release is allowed to proceed.
> Any single failure here blocks the deployment.

| ST-ID | Test Name | API / Route | Role | Pass Criterion | Playwright File |
|---|---|---|---|---|---|
| ST-01 | Backend health — GET /projects returns 200 | `GET /v1/projects` | org_admin | HTTP 200; `data.items` is array | `02-projects.spec.ts` |
| ST-02 | Auth — POST /auth/login with valid creds | `POST /v1/auth/login` | guest | HTTP 200; `data.access_token` present | `01-auth.spec.ts` |
| ST-03 | Auth — POST /auth/login with wrong password is 401 | `POST /v1/auth/login` | guest | HTTP 401; `success: false` | `01-auth.spec.ts` |
| ST-04 | Dashboard page loads without crash | `/dashboard` | org_admin | No `TypeError`; not on `/login` | `06-dashboard-pages.spec.ts` |
| ST-05 | Project list page loads | `/projects` | org_admin | No `TypeError`; no `Cannot read` | `06-dashboard-pages.spec.ts` |
| ST-06 | Create project via API | `POST /v1/projects` | org_admin | HTTP 201; `data.id` is UUID; cleanup runs | `02-projects.spec.ts` |
| ST-07 | Kanban board loads for seeded project | `/projects/:id/board` | org_admin | No `TypeError`; no crash | `02-projects.spec.ts` |
| ST-08 | Create task returns 201 | `POST /v1/tasks/project/:id` | org_admin | HTTP 201; `data.title` matches input | `03-tasks.spec.ts` |
| ST-09 | My Tasks page loads | `/my-tasks` | org_admin | No `TypeError` in body | `06-dashboard-pages.spec.ts` |
| ST-10 | Members list returns data | `GET /v1/members` | org_admin | HTTP 200; `data.items.length > 0` | `04-members.spec.ts` |
| ST-11 | Time tracking page loads without JS error | `/time-tracking` | org_admin | No `map is not a function` error | `06-dashboard-pages.spec.ts` |
| ST-12 | Approval Inbox loads with tabs | `/admin/approvals` | org_admin | "My Queue" visible in `<main>`; no crash | `08-preproject-workflow.spec.ts` |
| ST-13 | Pre-project list loads | `/preproject` | org_admin | No `TypeError`; not on `/login` | `08-preproject-workflow.spec.ts` |
| ST-14 | Executive dashboard loads | `/executive` | org_admin | No `TypeError` | `06-dashboard-pages.spec.ts` |
| ST-15 | Workflows list returns array | `GET /v1/workflows` | org_admin | HTTP 200; `data` is array | `07-comments-sprints.spec.ts` |

---

## 2. Sanity Test Suite

> Run time target: 10–15 minutes. Run after every deployment to verify core flows.
> Failures here trigger immediate rollback review.

| SN-ID | Module | Test Description | Route / API | Role | Expected Outcome |
|---|---|---|---|---|---|
| SN-01 | Auth | Dev bypass header auto-authenticates in dev mode | `GET /v1/projects` (no auth header) | — | HTTP 200; not 401 |
| SN-02 | Auth | GET /auth/me returns current user profile | `GET /v1/auth/me` | org_admin | `data.email = admin@example.local` |
| SN-03 | Projects | Create + Read + Delete project round-trip | `POST → GET → DELETE /v1/projects` | org_admin | All three responses succeed; final GET returns 404 |
| SN-04 | Projects | Duplicate key rejected | `POST /v1/projects` (same key twice) | org_admin | Second POST returns 400 |
| SN-05 | Projects | Project with start/due dates persisted | `POST /v1/projects` with dates | org_admin | `data.start_date` and `data.due_date` match input |
| SN-06 | Tasks | Create task with assignee | `POST /v1/tasks/project/:id` | org_admin | `data.assignee.id = dev-member-id` |
| SN-07 | Tasks | Move task changes status_id | `POST /v1/tasks/:id/move` | org_admin | `data.status_id = in-progress` |
| SN-08 | Tasks | Bulk priority update returns updated count | `PATCH /v1/tasks/bulk` | org_admin | `data.updated = 2` |
| SN-09 | Tasks | Kanban board view returns columns array | `GET /v1/tasks/project/:id?view=kanban` | org_admin | `data.columns` is array |
| SN-10 | Tasks | Task detail page loads | `/tasks/:id` | org_admin | No "Error loading task"; no 404 |
| SN-11 | Sprints | Create sprint and add task | `POST /v1/sprints` + `POST /v1/sprints/:id/tasks` | project_manager | HTTP 201 + HTTP < 300 |
| SN-12 | Members | Update member role and restore | `PATCH /v1/members/:id/role` | org_admin | `data.role = project_manager`; restore succeeds |
| SN-13 | Members | Suspend + reactivate member | `PATCH /v1/members/:id/status` | org_admin | `data.status = suspended`; restored to `active` |
| SN-14 | Members | Cannot remove self | `DELETE /v1/members/dev-org_admin-id` | org_admin | HTTP 400; `success: false` |
| SN-15 | Time Logs | Create time log entry | `POST /v1/time-logs` | org_admin | HTTP 201; `data.hours = 2.5` |
| SN-16 | Time Logs | Weekly summary returns totalHours and byDay | `GET /v1/time-logs/summary/weekly` | org_admin | `data.totalHours` number; `data.byDay` array |
| SN-17 | Time Logs | Update and delete time log | `PATCH` + `DELETE /v1/time-logs/:id` | org_admin | PATCH returns updated hours; DELETE `data.deleted = true` |
| SN-18 | Workflows | Default wf_kanban workflow has statuses array | `GET /v1/workflows/wf_kanban` | org_admin | `data.id = wf_kanban`; `data.statuses` array |
| SN-19 | Comments | Add and list comments on a task | `POST + GET /v1/comments/task/:id` | org_admin | POST returns 201; GET returns array |
| SN-20 | Pre-Project | Pre-project list shows filter tabs | `/preproject` | org_admin | Draft, Approved, Converted, Rejected tabs visible |
| SN-21 | Pre-Project | Detail page shows 5 tabs including Audit Trail | `/preproject/pp-001` | org_admin | All 5 tabs visible; Audit Trail shows history |
| SN-22 | Approvals | Approval inbox loads with 4 tabs | `/admin/approvals` | org_admin | My Queue, All Pending, Overdue, Completed tabs in `<main>` |
| SN-23 | Approval Groups | Group configuration page shows seeded groups | `/admin/approval-groups` | org_admin | Core Team, CFO Group, Division Head visible |
| SN-24 | Admin | User management page shows member Sharma | `/admin/users` | org_admin | "Sharma" text visible in body |
| SN-25 | Executive | OKR health scores endpoint returns data | `GET /v1/okrs/health/scores` | executive | HTTP 200; scores data in response |

---

## 3. Full Regression Suite

> Run time target: 30–45 minutes. Run on a weekly schedule (Fridays before release window) and on any major merge to main branch.

### Group A: Authentication (8 tests)

| FR-ID | Test | Route | Expected |
|---|---|---|---|
| FR-A-01 | Login valid credentials | `POST /v1/auth/login` | 200 + JWT |
| FR-A-02 | Login invalid password | `POST /v1/auth/login` | 401 |
| FR-A-03 | GET /auth/me dev header | `GET /v1/auth/me` | 200 + email |
| FR-A-04 | Dev auto-auth in dev mode | `GET /v1/projects` (no header) | 200 |
| FR-A-05 | Authenticated user accesses /dashboard | `/dashboard` | No redirect to /login |
| FR-A-06 | Root / redirects to /dashboard when authed | `/` | URL matches /dashboard |
| FR-A-07 | All 6 dev role headers authenticate | All role headers | 200 for each |
| FR-A-08 | Invite accept creates user | `POST /v1/auth/accept-invite` | 200 + user |

### Group B: Projects (12 tests)

| FR-ID | Test | Route | Expected |
|---|---|---|---|
| FR-B-01 | Create project — auto key | `POST /v1/projects` | 201 + auto key |
| FR-B-02 | Create project — explicit key | `POST /v1/projects` | 201 + explicit key |
| FR-B-03 | List projects — pagination | `GET /v1/projects` | 200 + pagination |
| FR-B-04 | Get project by ID | `GET /v1/projects/:id` | 200 + matching id |
| FR-B-05 | Update project name + color | `PATCH /v1/projects/:id` | 200 + updated fields |
| FR-B-06 | Delete project + verify gone | `DELETE /v1/projects/:id` | 204 then 404 |
| FR-B-07 | Duplicate key rejected | `POST /v1/projects` | 400 |
| FR-B-08 | Project with dates | `POST /v1/projects` | 201 + dates |
| FR-B-09 | UI project list page | `/projects` | No crash |
| FR-B-10 | UI create project modal | `/projects` UI | No error toast |
| FR-B-11 | UI kanban board loads | `/projects/:id/board` | No crash |
| FR-B-12 | Viewer cannot create project | `POST /v1/projects` as viewer | 403 |

### Group C: Tasks (14 tests)

| FR-ID | Test | Route | Expected |
|---|---|---|---|
| FR-C-01 | Create task | `POST /v1/tasks/project/:id` | 201 |
| FR-C-02 | Get task by ID | `GET /v1/tasks/:id` | 200 |
| FR-C-03 | Update title + priority | `PATCH /v1/tasks/:id` | 200 |
| FR-C-04 | Move task to in-progress | `POST /v1/tasks/:id/move` | 200 + status_id |
| FR-C-05 | Assign task to member | `POST /v1/tasks/project/:id` | 201 + assignee |
| FR-C-06 | List tasks for project | `GET /v1/tasks/project/:id` | 200 + items |
| FR-C-07 | Kanban view returns columns | `GET /v1/tasks/project/:id?view=kanban` | 200 + columns |
| FR-C-08 | Bulk priority update | `PATCH /v1/tasks/bulk` | 200 + updated=2 |
| FR-C-09 | Soft delete task | `DELETE /v1/tasks/:id` | 204 then 404 |
| FR-C-10 | Zero estimated_hours allowed | `POST /v1/tasks/project/:id` | 201 |
| FR-C-11 | My tasks paginated | `GET /v1/tasks/my` | 200 + items |
| FR-C-12 | UI Kanban loads | `/projects/:id/board` | No crash |
| FR-C-13 | UI create task modal | `/projects/:id/board` UI | No 500 error |
| FR-C-14 | UI task detail page | `/tasks/:id` | No 404 error |

### Group D: Sprints (6 tests)

| FR-ID | Test | Route | Expected |
|---|---|---|---|
| FR-D-01 | Create sprint | `POST /v1/sprints?project_id=` | 201 |
| FR-D-02 | List sprints | `GET /v1/sprints?project_id=` | 200 + array |
| FR-D-03 | Add task to sprint | `POST /v1/sprints/:id/tasks` | < 300 |
| FR-D-04 | Update sprint end date | `PATCH /v1/sprints/:id` | 200 |
| FR-D-05 | Remove task from sprint | `DELETE /v1/sprints/:id/tasks/:taskId` | 200 or 204 |
| FR-D-06 | Sprint backlog | `GET /v1/sprints/backlog?project_id=` | 200 + items |

### Group E: Members (8 tests)

| FR-ID | Test | Route | Expected |
|---|---|---|---|
| FR-E-01 | List members | `GET /v1/members` | 200 + items |
| FR-E-02 | List with page_size | `GET /v1/members?page_size=2` | items.length <= 2 |
| FR-E-03 | Update member role | `PATCH /v1/members/:id/role` | 200 + new role |
| FR-E-04 | Suspend member | `PATCH /v1/members/:id/status` | 200 + suspended |
| FR-E-05 | Invalid role invite rejected | `POST /v1/members/invite` | 400 |
| FR-E-06 | Cannot remove self | `DELETE /v1/members/dev-org_admin-id` | 400 |
| FR-E-07 | UI team page | `/team` | No crash |
| FR-E-08 | UI admin/users page shows Sharma | `/admin/users` | "Sharma" visible |

### Group F: Time Logs (9 tests)

| FR-ID | Test | Route | Expected |
|---|---|---|---|
| FR-F-01 | List my time logs | `GET /v1/time-logs/my` | 200 + items + pagination |
| FR-F-02 | Date range filter | `GET /v1/time-logs/my?startDate=...&endDate=...` | 200 + filtered items |
| FR-F-03 | Weekly summary | `GET /v1/time-logs/summary/weekly` | 200 + totalHours + byDay |
| FR-F-04 | Create time log | `POST /v1/time-logs` | 201 + hours=2.5 |
| FR-F-05 | Update time log | `PATCH /v1/time-logs/:id` | 200 + updated hours |
| FR-F-06 | Delete time log | `DELETE /v1/time-logs/:id` | 200 + deleted=true |
| FR-F-07 | List timesheets | `GET /v1/time-logs/timesheets` | 200 + array |
| FR-F-08 | UI time tracking page | `/time-tracking` | No JS error |
| FR-F-09 | UI Log tab renders entries | `/time-tracking` | No map error |

### Group G: Workflows + Comments (5 tests)

| FR-ID | Test | Route | Expected |
|---|---|---|---|
| FR-G-01 | List workflows | `GET /v1/workflows` | 200 + array |
| FR-G-02 | Get wf_kanban workflow | `GET /v1/workflows/wf_kanban` | 200 + statuses array |
| FR-G-03 | Add comment to task | `POST /v1/comments/task/:id` | 201 + body text |
| FR-G-04 | List comments for task | `GET /v1/comments/task/:id` | 200 + array |
| FR-G-05 | Create custom workflow | `POST /v1/workflows` | 201 + id |

### Group H: Pre-Project + Governance (20 tests)

| FR-ID | Test | Route | Expected |
|---|---|---|---|
| FR-H-01 | Pre-project list loads | `/preproject` | No crash + filter tabs |
| FR-H-02 | Pipeline filter tabs visible | `/preproject` | All, Draft, Approved, Converted buttons |
| FR-H-03 | Search filters results | `/preproject` UI | Unrelated projects hidden |
| FR-H-04 | New Pre-Project navigates to form | `/preproject` UI click | URL = /preproject/new |
| FR-H-05 | Form step 1 validates required fields | `/preproject/new` | Next disabled without required fields |
| FR-H-06 | Fill step 1 advances to step 2 | `/preproject/new` | Budget field visible after Next |
| FR-H-07 | Back button returns to step 1 | `/preproject/new` | Step 1 indicators visible |
| FR-H-08 | Cancel returns to list | `/preproject/new` UI | URL = /preproject |
| FR-H-09 | Detail page loads | `/preproject/pp-001` | No crash |
| FR-H-10 | Detail shows 5 tabs | `/preproject/pp-001` | All 5 tab buttons visible |
| FR-H-11 | Workflow tab shows approval stepper | `/preproject/pp-001` | Core Review, CFO Review visible |
| FR-H-12 | Audit Trail shows SUBMITTED + APPROVED | `/preproject/pp-001` | Both statuses visible |
| FR-H-13 | Invalid ID shows not found | `/preproject/invalid-xyz` | "not found" text |
| FR-H-14 | Approval Inbox loads 4 tabs | `/admin/approvals` | My Queue + All Pending + Overdue + Completed |
| FR-H-15 | Workflow Monitor KPI cards | `/workflow/monitor` | Pending, Overdue, On-Time Rate visible |
| FR-H-16 | Governance Dashboard KPIs | `/governance` | Total Budget, Budget Alerts, Overdue Milestones |
| FR-H-17 | Project Closure flow | `/governance/closure` | Select project → Enable "Start Closure" → Show checklist |
| FR-H-18 | Workflow Governance SLA Policy tab | `/workflow/governance` | Warn/Escalate inputs visible |
| FR-H-19 | Approval Group config page | `/admin/approval-groups` | Core Team, CFO Group, Division Head visible |
| FR-H-20 | Group Approval Dashboard | `/workflow/group-approvals` | KPI cards + workflow instances visible |

### Group I: Admin + Executive (8 tests)

| FR-ID | Test | Route | Expected |
|---|---|---|---|
| FR-I-01 | Audit log page loads | `/admin/audit-log` | No crash; entries in `<main>` |
| FR-I-02 | Exports page loads | `/admin/exports` | No crash |
| FR-I-03 | Custom roles page loads | `/admin/roles` | No crash |
| FR-I-04 | Divisions page loads | `/admin/divisions` | No crash |
| FR-I-05 | Executive dashboard loads | `/executive` | No crash |
| FR-I-06 | OKR health scores endpoint | `GET /v1/okrs/health/scores` | 200 + scores data |
| FR-I-07 | Financial dashboard endpoint | `GET /v1/financial/dashboard` | 200 + budget summary |
| FR-I-08 | Risk Register page loads | `/risk-register` | No crash |

**Total Full Regression Suite: 98 tests**

---

## 4. Module Dependency Map

The table below shows which upstream module failures cascade to affect downstream modules.

```
Authentication
    └── ALL modules depend on auth (no auth = no tests run)

Projects
    ├── Tasks (tasks require a project_id)
    ├── Sprints (sprints require a project_id)
    ├── Time Logs (time logs reference tasks which reference projects)
    ├── Members (project membership depends on org members existing)
    ├── Kanban Board UI (board is per-project)
    └── Pre-Project → Project Conversion (pre-project converts to a project)

Tasks
    ├── Sprints (sprint tasks reference task IDs)
    ├── Time Logs (time logs reference task keys)
    ├── Comments (comments are on tasks)
    ├── Approvals (approvals can reference tasks)
    └── Notifications (task assignments generate notifications)

Members
    ├── Tasks (assignee_id is a member ID)
    ├── Time Logs (logs are per user)
    ├── Approvals (approvers are members)
    └── Approval Groups (group members are org members)

Workflows
    ├── Approvals (approvals follow workflow steps)
    ├── Pre-Project (pre-project uses approval workflow)
    └── Approval Groups (groups assigned to workflow steps)

Pre-Project
    ├── Approval Inbox (approvals sourced from pre-project submissions)
    ├── Governance Dashboard (governance tracks pre-project budgets)
    └── Project Conversion (approved pre-projects become projects)
```

| Module | Depends On | Downstream Dependents |
|---|---|---|
| Authentication | None | All modules |
| Projects | Authentication, Members | Tasks, Sprints, Time Logs, Kanban UI, Pre-Project Conversion |
| Tasks | Projects, Members | Sprints, Time Logs, Comments, Notifications |
| Sprints | Projects, Tasks | — |
| Members | Authentication | Tasks (assignee), Time Logs (user), Approvals (approver), Approval Groups |
| Time Logs | Tasks, Members | Timesheets, Weekly Summary, Exports |
| Workflows | Authentication | Approvals, Pre-Project, Approval Groups |
| Approvals | Workflows, Members | Approval Inbox UI, Governance, Notifications |
| Pre-Project | Authentication, Workflows | Approval Inbox, Governance Dashboard, Project Conversion |
| Approval Groups | Members, Workflows | Group Approval Dashboard |
| OKRs | Authentication, Projects | Executive Dashboard |
| Financial | Authentication, Projects | Executive Dashboard, Governance |

---

## 5. Priority Matrix

| Module | Priority | Business Justification |
|---|---|---|
| Authentication | HIGH | Gateway to all functionality. Failure blocks 100% of tests and all users. |
| Projects | HIGH | Core entity. All tasks, sprints, reports depend on project existence. |
| Tasks | HIGH | Primary work unit. Kanban, time tracking, sprints all revolve around tasks. |
| Members | HIGH | User management failure breaks assignments, approvals, and notifications. |
| Approvals | HIGH | Critical compliance flow for QCI — pre-project submissions must be approvable. |
| Pre-Project Lifecycle | HIGH | Primary business process for QCI project intake and governance. |
| Time Logging | MEDIUM | Operational reporting dependency; direct revenue/billing impact for QCI. |
| Sprints | MEDIUM | Agile planning feature; lower urgency than core task management. |
| Workflows | MEDIUM | Custom workflow configuration is org-admin level; failures affect approval routing. |
| Approval Groups | MEDIUM | Group-based approvals are new; regression risk is higher than stable modules. |
| Notifications | MEDIUM | User experience impact; data integrity is not at risk. |
| Dashboard / Reports | MEDIUM | Visibility feature; failures are disruptive but not data-destructive. |
| Executive / OKRs | MEDIUM | Strategic reporting; used by leadership; no CRUD risk. |
| Search | LOW | Convenience feature; fallback exists via list views. |
| Exports | LOW | Batch operation; failure has no immediate operational impact. |
| Audit Log | LOW | Read-only visibility; critical for compliance audits but non-blocking day-to-day. |

---

## 6. Risk Assessment per Module

| Module | Failure Risk | Impact if Fails | Regression Likelihood | Mitigation |
|---|---|---|---|---|
| Authentication | LOW (stable) | CRITICAL — entire app inaccessible | Low | Smoke test ST-02/ST-03 gates every release |
| Projects | MEDIUM | HIGH — cascading test failures in 6 modules | Medium | ST-06 in smoke; full CRUD in sanity |
| Tasks | MEDIUM | HIGH — Kanban board unusable | Medium | ST-08 in smoke; 14 regression tests |
| Sprints | LOW | MEDIUM — sprint planning broken | Low | 6 regression tests |
| Members | LOW | HIGH — assignment and approval broken | Low | Sanity SN-12 to SN-14 |
| Time Logs | MEDIUM (past bugs) | MEDIUM — billing/reporting data incorrect | HIGH | `TypeError` bug was previously introduced; 9 regression tests watch for re-emergence |
| Workflows | LOW | HIGH — approval routing broken | Medium | wf_kanban smoke test guards default workflow |
| Approvals | MEDIUM | CRITICAL for QCI compliance | Medium | ST-12 smoke test; 5 functional tests |
| Pre-Project | MEDIUM (new feature) | HIGH — primary QCI intake process | HIGH | 20 regression tests cover full lifecycle |
| Approval Groups | HIGH (newest code) | MEDIUM — group approvals broken | HIGH | 28 spec tests in `09-approval-groups.spec.ts` |
| Notifications | LOW | LOW — UX degradation only | Low | 3 functional tests |
| Search | LOW | LOW — fallback via browse | Low | 3 functional tests |
| Financial | LOW | MEDIUM — executive reporting broken | Low | API endpoint tests |
| OKRs | LOW | LOW — strategic visibility degraded | Low | Health scores endpoint test |
| Audit Log | LOW | LOW — compliance visibility | Low | Admin page smoke test |

---

## 7. Test Execution Time Estimates

> Times are measured with `workers: 1` (sequential), Playwright `expect.timeout: 10000`, `timeout: 30000`, `retries: 1`.
> Hardware baseline: Intel Core i7, 16 GB RAM, PostgreSQL 17 local, Windows 11.

| Suite | Tests | Estimated Time | Run Frequency |
|---|---|---|---|
| Smoke Test Suite | 15 | ~4–5 min | Before every release deployment |
| Sanity Test Suite | 25 | ~8–10 min | After every deployment (staging + production) |
| Full Regression Suite — Auth (Group A) | 8 | ~2 min | Weekly |
| Full Regression Suite — Projects (Group B) | 12 | ~3 min | Weekly |
| Full Regression Suite — Tasks (Group C) | 14 | ~4 min | Weekly |
| Full Regression Suite — Sprints (Group D) | 6 | ~2 min | Weekly |
| Full Regression Suite — Members (Group E) | 8 | ~2 min | Weekly |
| Full Regression Suite — Time Logs (Group F) | 9 | ~2.5 min | Weekly |
| Full Regression Suite — Workflows + Comments (Group G) | 5 | ~1.5 min | Weekly |
| Full Regression Suite — Pre-Project + Governance (Group H) | 20 | ~8 min | Weekly |
| Full Regression Suite — Admin + Executive (Group I) | 8 | ~2.5 min | Weekly |
| **Total Full Regression** | **98** | **~30–40 min** | **Weekly / on main merge** |

### Playwright Command Reference

```bash
# Smoke suite (critical gate)
npx playwright test e2e/01-auth.spec.ts e2e/02-projects.spec.ts e2e/03-tasks.spec.ts --grep "smoke"

# Sanity — run all spec files but first 2 tests each
npx playwright test --grep "@sanity"

# Full regression
npx playwright test

# Single module regression
npx playwright test e2e/08-preproject-workflow.spec.ts
npx playwright test e2e/09-approval-groups.spec.ts

# Generate HTML report
npx playwright test --reporter=html
npx playwright show-report

# Specific test by name
npx playwright test --grep "create project"
```

---

*Maintained by QCI QA Team. Review priority ratings quarterly or after any architecture change.*

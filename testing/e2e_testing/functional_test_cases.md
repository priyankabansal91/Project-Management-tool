# Q-Flow — Functional E2E Test Cases

**Project:** Q-Flow (Quality Council of India — QCI Project Management Tool)
**Application Under Test:** Q-Flow SaaS Project Management
**Frontend:** React 18 + TypeScript + Vite (port 5173)
**Backend:** Express.js + Prisma + PostgreSQL 17 (port 4000)
**API Base:** `http://localhost:4000/v1`
**Test Framework:** Playwright (v1.x)
**Prepared By:** QCI QA Team
**Document Version:** 1.0
**Date:** 2026-05-06

---

## Roles Reference

| Role ID | Role Label | Access Level |
|---|---|---|
| `dev-org_admin-id` | org_admin | Full system access |
| `dev-division_admin-id` | division_admin | Division-scoped admin |
| `dev-project_manager-id` | project_manager | Project creation & management |
| `dev-member-id` | member | Task-level participation |
| `dev-viewer-id` | viewer | Read-only access |
| `dev-executive-id` | executive | Executive dashboards & OKRs |

---

## Legend

- **HP** = Happy Path (expected positive flow)
- **EC** = Edge Case / Negative Test
- **Status:** PASS / FAIL / BLOCKED / NOT RUN

---

## Module 1: Authentication & OTP (TC-AUTH-001 to TC-AUTH-010)

| TC-ID | Module | Scenario | Role | Preconditions | Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-AUTH-001 | Authentication | HP: Login with valid credentials returns JWT | org_admin | Backend running on port 4000; user `admin@example.local` exists in DB | 1. POST `/v1/auth/login` with `{ email, password }` 2. Inspect response body | `email: admin@example.local`, `password: password123` | HTTP 200; `success: true`; `data.access_token` is non-empty JWT string | | NOT RUN |
| TC-AUTH-002 | Authentication | HP: Login via UI redirects to /dashboard | org_admin | Frontend running on port 5173; valid credentials seeded | 1. Navigate to `/login` 2. Fill email + password 3. Click "Sign In" | `email: admin@example.local`, `password: password123` | URL changes to `/dashboard`; no "Cannot read" errors in body | | NOT RUN |
| TC-AUTH-003 | Authentication | EC: Login with wrong password returns 401 | guest | Backend running | 1. POST `/v1/auth/login` with invalid password 2. Check status code | `email: admin@example.local`, `password: wrongpass` | HTTP 401; `success: false`; error message present | | NOT RUN |
| TC-AUTH-004 | Authentication | EC: Login with non-existent email returns 401 | guest | Backend running | 1. POST `/v1/auth/login` with unregistered email | `email: nobody@notexist.com`, `password: anypass` | HTTP 401; `success: false` | | NOT RUN |
| TC-AUTH-005 | Authentication | HP: GET /auth/me returns authenticated user's profile | org_admin | Valid dev header set | 1. GET `/v1/auth/me` with header `x-dev-user-id: dev-org_admin-id` | Header: `x-dev-user-id: dev-org_admin-id` | HTTP 200; `data.email = admin@example.local`; `data.role = org_admin` | | NOT RUN |
| TC-AUTH-006 | Authentication | HP: Dev bypass header authenticates without JWT | org_admin | `NODE_ENV=development`; backend running | 1. GET `/v1/projects` with only `x-dev-user-id` header (no Bearer token) | Header: `x-dev-user-id: dev-org_admin-id` | HTTP 200; project list returned; no 401 | | NOT RUN |
| TC-AUTH-007 | OTP | HP: POST /auth/send-otp sends OTP to email | member | User exists in DB | 1. POST `/v1/auth/send-otp` with `{ email }` | `email: member@example.local` | HTTP 200; `success: true`; OTP sent message | | NOT RUN |
| TC-AUTH-008 | OTP | EC: POST /auth/verify-otp with wrong OTP returns 400 | member | OTP send was initiated | 1. POST `/v1/auth/verify-otp` with wrong OTP code | `email: member@example.local`, `otp: 000000` | HTTP 400; `success: false`; error about invalid OTP | | NOT RUN |
| TC-AUTH-009 | Invite Accept | HP: POST /auth/accept-invite creates new user | org_admin | Invite token generated | 1. POST `/v1/auth/accept-invite` with valid token + new password | `token: <invite-token>`, `password: Secure@123` | HTTP 200; new user account created; JWT returned | | NOT RUN |
| TC-AUTH-010 | Authentication | HP: Unauthenticated route `/dashboard` redirects to login in prod build | guest | Production build running (not dev mode) | 1. Clear localStorage 2. Navigate to `/dashboard` | No auth token in localStorage | Redirected to `/login`; dashboard content not visible | | NOT RUN |

---

## Module 2: Projects (CRUD + Permissions) (TC-PROJ-001 to TC-PROJ-010)

| TC-ID | Module | Scenario | Role | Preconditions | Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-PROJ-001 | Projects | HP: Create project without explicit key (auto-generated) | org_admin | Authenticated | 1. POST `/v1/projects` with name + visibility + color | `{ name: "Q-Flow Infrastructure v2", visibility: "org_wide", color: "#3B82F6" }` | HTTP 201; `data.id` is UUID; `data.key` auto-generated (e.g., `QFI-1`) | | NOT RUN |
| TC-PROJ-002 | Projects | HP: Create project with explicit key | org_admin | Authenticated | 1. POST `/v1/projects` with explicit key | `{ name: "Education Reforms 2026", key: "EDU26", visibility: "private", color: "#10B981" }` | HTTP 201; `data.key = EDU26` | | NOT RUN |
| TC-PROJ-003 | Projects | HP: List projects returns paginated response | org_admin | At least 1 project exists | 1. GET `/v1/projects` | — | HTTP 200; `data.items` is array; `data.pagination` has `total`, `page`, `page_size` | | NOT RUN |
| TC-PROJ-004 | Projects | HP: Get project by ID returns correct project | org_admin | Project `EDU26` exists | 1. GET `/v1/projects/:id` with valid project ID | Valid project UUID | HTTP 200; `data.id` matches requested ID | | NOT RUN |
| TC-PROJ-005 | Projects | HP: Update project name and color | org_admin | Project exists | 1. PATCH `/v1/projects/:id` with new name and color | `{ name: "Education Reforms Updated", color: "#EF4444" }` | HTTP 200; `data.name = Education Reforms Updated`; `data.color = #EF4444` | | NOT RUN |
| TC-PROJ-006 | Projects | HP: Delete project returns 204 and is unreachable after | org_admin | Project exists | 1. DELETE `/v1/projects/:id` 2. GET `/v1/projects/:id` | Project UUID | DELETE returns HTTP 204; subsequent GET returns HTTP 404 | | NOT RUN |
| TC-PROJ-007 | Projects | EC: Create project with duplicate key returns 400 | org_admin | Project with key `DUPK` already exists | 1. POST `/v1/projects` with same key twice | `key: DUPK` used for both requests | Second POST returns HTTP 400; error message about duplicate key | | NOT RUN |
| TC-PROJ-008 | Projects | HP: Create project with start and due dates | org_admin | Authenticated | 1. POST `/v1/projects` with start_date + due_date | `{ start_date: "2026-06-01", due_date: "2026-12-31" }` | HTTP 201; `data.start_date` and `data.due_date` present and correct | | NOT RUN |
| TC-PROJ-009 | Projects | HP: UI — project list page loads and shows cards | org_admin | Frontend + backend running; at least 1 project seeded | 1. Navigate to `/projects` 2. Wait for networkidle | — | Page renders; project cards visible; no `TypeError` or `Cannot read` in body | | NOT RUN |
| TC-PROJ-010 | Projects | EC: viewer role cannot create a project | viewer | Authenticated as viewer | 1. POST `/v1/projects` with valid body + viewer header | `x-dev-user-id: dev-viewer-id` | HTTP 403; `success: false` | | NOT RUN |

---

## Module 3: Tasks (TC-TASK-001 to TC-TASK-010)

| TC-ID | Module | Scenario | Role | Preconditions | Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-TASK-001 | Tasks | HP: Create task in project | org_admin | Test project created | 1. POST `/v1/tasks/project/:projectId` | `{ title: "Design System Audit", priority: "high", tags: ["design", "q2"] }` | HTTP 201; `data.title = Design System Audit`; `data.priority = high`; `data.id` is UUID | | NOT RUN |
| TC-TASK-002 | Tasks | HP: Get task by ID returns full task object | org_admin | Task created | 1. GET `/v1/tasks/:taskId` | Valid task UUID | HTTP 200; `data.id`, `data.title`, `data.priority`, `data.status_id` all present | | NOT RUN |
| TC-TASK-003 | Tasks | HP: Update task title and priority | org_admin | Task created | 1. PATCH `/v1/tasks/:taskId` with title + priority | `{ title: "Design System Audit — Revised", priority: "critical" }` | HTTP 200; `data.title` and `data.priority` match updates | | NOT RUN |
| TC-TASK-004 | Tasks | HP: Move task changes status (Kanban drag simulation) | org_admin | Task in "todo" status | 1. POST `/v1/tasks/:taskId/move` with new status | `{ status_id: "in-progress", status_name: "In Progress", position: 10 }` | HTTP 200; `data.status_id = in-progress` | | NOT RUN |
| TC-TASK-005 | Tasks | HP: Assign task to member | org_admin | Member `dev-member-id` (Ravi Kumar) exists | 1. POST `/v1/tasks/project/:projectId` with `assignee_id` | `{ title: "QA Manual Testing", assignee_id: "dev-member-id", priority: "medium" }` | HTTP 201; `data.assignee.id = dev-member-id`; `data.assignee` not null | | NOT RUN |
| TC-TASK-006 | Tasks | HP: List tasks for project returns paginated items | org_admin | Project with tasks | 1. GET `/v1/tasks/project/:projectId` | Valid project ID | HTTP 200; `data.items` is array; `data.pagination` present | | NOT RUN |
| TC-TASK-007 | Tasks | HP: Kanban view returns columns array | org_admin | Project with tasks | 1. GET `/v1/tasks/project/:projectId?view=kanban&page_size=50` | Kanban view param | HTTP 200; `data.columns` is array with at least 1 column | | NOT RUN |
| TC-TASK-008 | Tasks | HP: Bulk priority update changes all selected tasks | org_admin | At least 2 tasks exist | 1. Create 2 tasks 2. PATCH `/v1/tasks/bulk` with both IDs | `{ taskIds: [id1, id2], operation: "priority", value: "high" }` | HTTP 200; `data.updated = 2` | | NOT RUN |
| TC-TASK-009 | Tasks | HP: Delete task soft-deletes and returns 204 | org_admin | Task exists | 1. DELETE `/v1/tasks/:taskId` 2. GET same task | Valid task UUID | DELETE returns 204; subsequent GET returns 404 | | NOT RUN |
| TC-TASK-010 | Tasks | EC: Create task with zero estimated_hours succeeds | org_admin | Project exists | 1. POST `/v1/tasks/project/:projectId` with `estimated_hours: 0` | `{ title: "Zero Effort Task", estimated_hours: 0 }` | HTTP 201; `data.estimated_hours = 0`; no validation error | | NOT RUN |

---

## Module 4: Sprints (TC-SPRINT-001 to TC-SPRINT-006)

| TC-ID | Module | Scenario | Role | Preconditions | Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-SPRINT-001 | Sprints | HP: Create sprint for project | project_manager | Project exists | 1. POST `/v1/sprints?project_id=:projectId` | `{ name: "Sprint 1 — Infra Baseline", goal: "Set up core infrastructure", start_date: "2026-06-01", end_date: "2026-06-14" }` | HTTP 201; `data.id` present; `data.name` matches | | NOT RUN |
| TC-SPRINT-002 | Sprints | HP: List sprints for project | project_manager | Sprint created | 1. GET `/v1/sprints?project_id=:projectId` | Valid project ID | HTTP 200; response array contains created sprint | | NOT RUN |
| TC-SPRINT-003 | Sprints | HP: Add task to sprint | project_manager | Sprint + task both exist | 1. POST `/v1/sprints/:sprintId/tasks` with task_id | `{ task_id: "<taskUUID>" }` | HTTP 200 or 201; task appears linked to sprint | | NOT RUN |
| TC-SPRINT-004 | Sprints | HP: Update sprint end date | project_manager | Sprint exists | 1. PATCH `/v1/sprints/:sprintId` with new end_date | `{ end_date: "2026-06-21" }` | HTTP 200; `data.end_date` updated | | NOT RUN |
| TC-SPRINT-005 | Sprints | HP: Remove task from sprint | project_manager | Task in sprint | 1. DELETE `/v1/sprints/:sprintId/tasks/:taskId` | Valid sprint + task IDs | HTTP 200 or 204; task no longer associated to sprint | | NOT RUN |
| TC-SPRINT-006 | Sprints | HP: Get sprint backlog returns unassigned tasks | project_manager | Project has tasks not in any sprint | 1. GET `/v1/sprints/backlog?project_id=:projectId` | Valid project ID | HTTP 200; items array of tasks without sprint assignment | | NOT RUN |

---

## Module 5: Members (TC-MBR-001 to TC-MBR-006)

| TC-ID | Module | Scenario | Role | Preconditions | Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-MBR-001 | Members | HP: List all members returns paginated array | org_admin | At least 3 seeded users exist | 1. GET `/v1/members` | — | HTTP 200; `data.items` array with length > 0; `data.pagination` present | | NOT RUN |
| TC-MBR-002 | Members | HP: Invite member by email | org_admin | Valid role provided | 1. POST `/v1/members/invite` with email + role | `{ email: "newhire@qcin.org", role: "member" }` | HTTP 200 or 201; invite token or success message returned | | NOT RUN |
| TC-MBR-003 | Members | HP: Update member role | org_admin | Member `dev-member-id` exists | 1. PATCH `/v1/members/dev-member-id/role` with new role 2. Restore original role | `{ role: "project_manager" }` then `{ role: "member" }` | HTTP 200; `data.role = project_manager` after first update | | NOT RUN |
| TC-MBR-004 | Members | HP: Suspend member account | org_admin | Member `dev-viewer-id` exists and is active | 1. PATCH `/v1/members/dev-viewer-id/status` with `suspended` | `{ status: "suspended" }` | HTTP 200; `data.status = suspended`; restore after test | | NOT RUN |
| TC-MBR-005 | Members | EC: Invite with invalid role returns 400 | org_admin | Authenticated | 1. POST `/v1/members/invite` with invalid role name | `{ email: "test@qcin.org", role: "superadmin" }` | HTTP 400; `success: false`; validation error message | | NOT RUN |
| TC-MBR-006 | Members | EC: Cannot remove self as org_admin | org_admin | Authenticated as org_admin | 1. DELETE `/v1/members/dev-org_admin-id` | — | HTTP 400; `success: false`; message like "Cannot remove yourself" | | NOT RUN |

---

## Module 6: Time Logging (TC-TIME-001 to TC-TIME-006)

| TC-ID | Module | Scenario | Role | Preconditions | Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-TIME-001 | Time Logs | HP: Log time entry for a task | member | Task exists; authenticated | 1. POST `/v1/time-logs` with hours + task reference | `{ taskKey: "INFRA-42", taskTitle: "Server Setup", hours: 3.5, description: "Configured Node.js 20 runtime", loggedDate: "2026-05-05" }` | HTTP 201; `data.hours = 3.5`; `data.id` present | | NOT RUN |
| TC-TIME-002 | Time Logs | HP: Update time log entry | member | Time log exists | 1. PATCH `/v1/time-logs/:logId` | `{ hours: 4.0, description: "Updated — includes config review" }` | HTTP 200; `data.hours = 4.0` | | NOT RUN |
| TC-TIME-003 | Time Logs | HP: Delete time log entry | member | Time log exists | 1. DELETE `/v1/time-logs/:logId` | Valid log ID | HTTP 200; `data.deleted = true` | | NOT RUN |
| TC-TIME-004 | Time Logs | HP: Weekly summary returns totals per day | member | Logs exist for current week | 1. GET `/v1/time-logs/summary/weekly` | — | HTTP 200; `data.totalHours` (number); `data.byDay` (array of 7 entries) | | NOT RUN |
| TC-TIME-005 | Time Logs | HP: GET /time-logs/timesheets returns array | org_admin | Timesheets exist | 1. GET `/v1/time-logs/timesheets` | — | HTTP 200; `data` is array | | NOT RUN |
| TC-TIME-006 | Time Logs | HP: UI — time tracking page loads without JS errors | member | Frontend + backend running | 1. Navigate to `/time-tracking` 2. Wait for networkidle | — | No `TypeError`, `map is not a function`, or `Cannot read` in page body | | NOT RUN |

---

## Module 7: Workflows (TC-WF-001 to TC-WF-004)

| TC-ID | Module | Scenario | Role | Preconditions | Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-WF-001 | Workflows | HP: List workflows returns array | org_admin | At least 1 seeded workflow (wf_kanban) | 1. GET `/v1/workflows` | — | HTTP 200; `data` is array; `wf_kanban` workflow present | | NOT RUN |
| TC-WF-002 | Workflows | HP: Get default kanban workflow by ID | org_admin | `wf_kanban` seeded | 1. GET `/v1/workflows/wf_kanban` | Workflow ID: `wf_kanban` | HTTP 200; `data.id = wf_kanban`; `data.statuses` is array with `todo`, `in-progress`, `done` columns | | NOT RUN |
| TC-WF-003 | Workflows | HP: Create custom workflow with statuses | org_admin | Authenticated | 1. POST `/v1/workflows` with name + statuses | `{ name: "QCI Approval Flow", statuses: [{ name: "Pending Review", color: "#F59E0B" }, { name: "Approved", color: "#10B981" }] }` | HTTP 201; `data.id` present; statuses saved | | NOT RUN |
| TC-WF-004 | Workflows | HP: UI — admin/workflows page loads | org_admin | Frontend running | 1. Navigate to `/admin/workflows` | — | Page renders; workflow list visible; no crash | | NOT RUN |

---

## Module 8: Approvals (TC-APPR-001 to TC-APPR-005)

| TC-ID | Module | Scenario | Role | Preconditions | Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-APPR-001 | Approvals | HP: List pending approvals returns items | division_admin | Pre-project submissions exist | 1. GET `/v1/approvals/pending` | — | HTTP 200; items array with at least "Highway Widening Phase II" and "Bridge Rehabilitation" | | NOT RUN |
| TC-APPR-002 | Approvals | HP: Approval Inbox UI loads with 4 tabs | org_admin | Frontend + backend running | 1. Navigate to `/admin/approvals` 2. Wait for networkidle | — | Tabs "My Queue", "All Pending", "Overdue", "Completed" visible in `<main>`; no `TypeError` | | NOT RUN |
| TC-APPR-003 | Approvals | HP: Approve an approval request | division_admin | Approval item exists in "pending" state | 1. POST `/v1/approvals/:approvalId/approve` with comment | `{ comment: "Budget verified and approved by division finance team" }` | HTTP 200; approval moves to `approved` state; audit trail updated | | NOT RUN |
| TC-APPR-004 | Approvals | HP: Reject an approval request with reason | division_admin | Approval item in pending state | 1. POST `/v1/approvals/:approvalId/reject` with reason | `{ reason: "Budget exceeds division ceiling by 22%" }` | HTTP 200; approval moves to `rejected` state | | NOT RUN |
| TC-APPR-005 | Approvals | HP: Completed tab shows audit log link | org_admin | At least 1 completed approval exists | 1. Navigate to `/admin/approvals` 2. Click "Completed" tab | — | "Audit Log" text visible in `<main>` (not sidebar) | | NOT RUN |

---

## Module 9: Notifications (TC-NOTIF-001 to TC-NOTIF-003)

| TC-ID | Module | Scenario | Role | Preconditions | Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-NOTIF-001 | Notifications | HP: GET /notifications returns unread notifications | member | At least 1 notification exists for user | 1. GET `/v1/notifications` | — | HTTP 200; array of notification objects with `id`, `message`, `read` fields | | NOT RUN |
| TC-NOTIF-002 | Notifications | HP: Mark notification as read | member | Unread notification exists | 1. PATCH `/v1/notifications/:notifId/read` | Valid notification ID | HTTP 200; `data.read = true` | | NOT RUN |
| TC-NOTIF-003 | Notifications | HP: Delete notification | member | Notification exists | 1. DELETE `/v1/notifications/:notifId` | Valid notification ID | HTTP 200 or 204; notification no longer returned in list | | NOT RUN |

---

## Module 10: Search (TC-SRCH-001 to TC-SRCH-003)

| TC-ID | Module | Scenario | Role | Preconditions | Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-SRCH-001 | Search | HP: Full-text search returns matching projects and tasks | org_admin | Projects/tasks with keyword "Highway" exist | 1. GET `/v1/search?q=Highway` | `q=Highway` | HTTP 200; results include `NH-48 Highway Widening Project` or similar | | NOT RUN |
| TC-SRCH-002 | Search | HP: Search with type filter returns only tasks | org_admin | Mixed content exists | 1. GET `/v1/search?q=setup&type=task` | `q=setup`, `type=task` | HTTP 200; only task results returned (no project matches) | | NOT RUN |
| TC-SRCH-003 | Search | EC: Search with empty query returns 400 or empty results | org_admin | Backend running | 1. GET `/v1/search?q=` | `q=` (empty string) | HTTP 400 or HTTP 200 with empty results array | | NOT RUN |

---

## Module 11: Dashboard & Reports (TC-DASH-001 to TC-DASH-004)

| TC-ID | Module | Scenario | Role | Preconditions | Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-DASH-001 | Dashboard | HP: GET /dashboard/overview returns KPI data | org_admin | Projects + tasks seeded | 1. GET `/v1/dashboard/overview` | — | HTTP 200; response includes `totalProjects`, `totalTasks`, `overdueTasks` keys | | NOT RUN |
| TC-DASH-002 | Dashboard | HP: UI dashboard page loads without crash | org_admin | Frontend + backend running | 1. Navigate to `/dashboard` 2. Wait for networkidle | — | Page body is non-empty; no `TypeError`; not redirected to login | | NOT RUN |
| TC-DASH-003 | Reports | HP: Reports page renders charts | org_admin | Time logs + project data exist | 1. Navigate to `/reports` 2. Wait for networkidle | — | Page loads; no `TypeError` in body; Recharts SVGs visible | | NOT RUN |
| TC-DASH-004 | Reports | HP: Advanced Reports page loads | org_admin | Frontend running | 1. Navigate to `/reports/advanced` | — | Page renders without crash; no `is not a function` error | | NOT RUN |

---

## Module 12: Admin (Audit Log, Exports, Roles) (TC-ADMIN-001 to TC-ADMIN-004)

| TC-ID | Module | Scenario | Role | Preconditions | Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-ADMIN-001 | Audit Log | HP: Audit log page loads with entries | org_admin | Actions have been performed (project creates, etc.) | 1. Navigate to `/admin/audit-log` 2. Scope check to `<main>` | — | Audit log entries visible in `<main>`; page does not crash | | NOT RUN |
| TC-ADMIN-002 | Exports | HP: Exports page loads and download triggers | org_admin | Frontend running | 1. Navigate to `/admin/exports` 2. Click "Export" button for a data type | — | Page loads; export button triggers download or success toast | | NOT RUN |
| TC-ADMIN-003 | Custom Roles | HP: Create a custom role | org_admin | Authenticated | 1. POST `/v1/roles` with name + permissions | `{ name: "Field Inspector", permissions: ["read:tasks", "read:projects"] }` | HTTP 201; `data.id` and `data.name` in response | | NOT RUN |
| TC-ADMIN-004 | Divisions | HP: List divisions returns org divisions | org_admin | Divisions seeded (Infrastructure, Education, etc.) | 1. GET `/v1/divisions` | — | HTTP 200; divisions array includes "Infrastructure", "Education" | | NOT RUN |

---

## Module 13: Executive (OKRs, Financial, Portfolio) (TC-EXEC-001 to TC-EXEC-004)

| TC-ID | Module | Scenario | Role | Preconditions | Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-EXEC-001 | OKRs | HP: Create OKR with key results | executive | Authenticated | 1. POST `/v1/okrs` with title + level 2. POST `/v1/okrs/:id/key-results` | `{ title: "Achieve 95% project delivery on-time Q2 2026", level: "org", quarter: "Q2", year: 2026 }` | HTTP 201 for OKR; HTTP 201 for key result; both IDs returned | | NOT RUN |
| TC-EXEC-002 | Financial | HP: Financial dashboard returns summary | executive | Budget data seeded | 1. GET `/v1/financial/dashboard` | — | HTTP 200; response includes budget summary metrics | | NOT RUN |
| TC-EXEC-003 | Financial | HP: Budget vs actual report with quarter filter | org_admin | Budget records exist | 1. GET `/v1/financial/budget-vs-actual?quarter=Q2&year=2026` | `quarter=Q2`, `year=2026` | HTTP 200; comparison data returned | | NOT RUN |
| TC-EXEC-004 | Executive | HP: Executive dashboard UI loads | executive | Frontend + backend running | 1. Navigate to `/executive` 2. Wait for networkidle | — | Page loads; no `TypeError`; KPI cards visible | | NOT RUN |

---

## Module 14: Pre-Project Lifecycle (TC-PP-001 to TC-PP-004)

| TC-ID | Module | Scenario | Role | Preconditions | Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-PP-001 | Pre-Project | HP: Pre-project list loads with status filter tabs | org_admin | Seeded pre-projects exist | 1. Navigate to `/preproject` 2. Wait for networkidle | — | "All", "Draft", "Approved", "Converted", "Rejected" tab buttons visible; no crash | | NOT RUN |
| TC-PP-002 | Pre-Project | HP: Multi-step new pre-project form validates step 1 before proceeding | project_manager | Frontend running | 1. Navigate to `/preproject/new` 2. Leave fields empty 3. Try clicking Next | — | "Next" button is disabled; cannot advance to step 2 without filling TDR No., Title, Client, Division, Description | | NOT RUN |
| TC-PP-003 | Pre-Project | HP: Pre-project detail shows 5 tabs including Audit Trail | org_admin | Pre-project `pp-001` seeded | 1. Navigate to `/preproject/pp-001` 2. Click "Audit Trail" tab | — | Tabs "Overview", "Workflow", "Documents", "Budget", "Audit Trail" visible; Audit Trail shows `SUBMITTED` and `APPROVED` entries | | NOT RUN |
| TC-PP-004 | Pre-Project | EC: Invalid pre-project ID shows not found | org_admin | Frontend running | 1. Navigate to `/preproject/invalid-xyz-999` | — | Page shows "not found" or 404 message; no unhandled crash | | NOT RUN |

---

## Module 15: Edge Cases (TC-EDGE-001 to TC-EDGE-005)

| TC-ID | Module | Scenario | Role | Preconditions | Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-EDGE-001 | Projects | EC: Empty project name returns 400 | org_admin | Authenticated | 1. POST `/v1/projects` with empty string name | `{ name: "", visibility: "private", color: "#3B82F6" }` | HTTP 400; validation error: "name is required" or similar | | NOT RUN |
| TC-EDGE-002 | Tasks | EC: Get task with non-existent UUID returns 404 | org_admin | Authenticated | 1. GET `/v1/tasks/00000000-0000-0000-0000-000000000000` | Non-existent UUID | HTTP 404; `success: false` | | NOT RUN |
| TC-EDGE-003 | Pagination | EC: Request page beyond total pages returns empty items | org_admin | Less than 1000 items exist | 1. GET `/v1/projects?page=999&page_size=10` | `page=999` | HTTP 200; `data.items = []`; `data.pagination.total` still correct | | NOT RUN |
| TC-EDGE-004 | Auth | EC: Expired JWT returns 401 | member | Expired JWT token available | 1. GET `/v1/projects` with `Authorization: Bearer <expired-token>` | Expired JWT | HTTP 401; `success: false` | | NOT RUN |
| TC-EDGE-005 | Concurrent | EC: Two users update same task simultaneously — last write wins | org_admin + member | Same task visible to both users | 1. User A sends PATCH `/v1/tasks/:id` with title update 2. User B simultaneously sends PATCH `/v1/tasks/:id` with different title | Concurrent PATCH requests | Both return 200; final title reflects last write; no server error or data corruption | | NOT RUN |

---

## Summary

| Module | Total TCs | Happy Path | Edge Cases |
|---|---|---|---|
| Authentication & OTP | 10 | 7 | 3 |
| Projects | 10 | 9 | 1 |
| Tasks | 10 | 9 | 1 |
| Sprints | 6 | 6 | 0 |
| Members | 6 | 4 | 2 |
| Time Logging | 6 | 6 | 0 |
| Workflows | 4 | 4 | 0 |
| Approvals | 5 | 5 | 0 |
| Notifications | 3 | 3 | 0 |
| Search | 3 | 2 | 1 |
| Dashboard & Reports | 4 | 4 | 0 |
| Admin | 4 | 4 | 0 |
| Executive | 4 | 4 | 0 |
| Pre-Project | 4 | 3 | 1 |
| Edge Cases (cross-module) | 5 | 0 | 5 |
| **TOTAL** | **84** | **70** | **14** |

---

*Document maintained by QCI QA Team. Update Actual Result and Status after each test run.*

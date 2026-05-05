# Q-Flow — E2E Test Specifications

> All tests use Playwright. Run with `npx playwright test` from project root.
> Dev auth is injected via `x-dev-user-id` header (no real login needed).

---

## Test Files

| File | Coverage | Tests |
|------|----------|-------|
| `01-auth.spec.ts` | Login, register, logout, token persistence | ~8 |
| `02-projects.spec.ts` | Project CRUD, modal, status | ~10 |
| `03-tasks.spec.ts` | Task CRUD, kanban drag, filters | ~12 |
| `04-members.spec.ts` | Invite, create-direct, roles | ~8 |
| `05-time-tracking.spec.ts` | Log time, timer, export | ~6 |
| `06-dashboard-pages.spec.ts` | All pages load without crash | ~36 |
| `07-comments-sprints.spec.ts` | Comments, sprints lifecycle | ~8 |
| `08-preproject-workflow.spec.ts` | Pre-project + governance + approvals | ~40 |
| `09-approval-groups.spec.ts` | Group approval config + dashboard | ~22 |

---

## 01 — Authentication

| # | Test | Assertion |
|---|------|-----------|
| 1 | Login with valid credentials | Redirected to /dashboard |
| 2 | Login with wrong password | Error message shown |
| 3 | Register new account | Success, redirected |
| 4 | Token persists on page reload | Still logged in |
| 5 | Logout clears session | Redirected to /login |
| 6 | Unauthenticated access to /dashboard | Redirected to /login |
| 7 | Dev bypass header authenticates | Returns 200, user set |
| 8 | Invite accept flow | New user created, JWT returned |

---

## 02 — Projects

| # | Test | Assertion |
|---|------|-----------|
| 1 | Project list loads | Cards visible |
| 2 | Create project (modal) | New project appears in list |
| 3 | Duplicate project key rejected | 409 error shown |
| 4 | Edit project name | Updated immediately |
| 5 | Delete project | Removed from list |
| 6 | Open kanban board | Columns visible |
| 7 | Project status badge shows correctly | Badge text matches status |

---

## 03 — Tasks

| # | Test | Assertion |
|---|------|-----------|
| 1 | Task list loads | Tasks visible |
| 2 | Create task | Appears in list |
| 3 | Assign task to member | Avatar updated |
| 4 | Change task status | Column updated in kanban |
| 5 | Set due date | Date shown on card |
| 6 | Filter by assignee | Only assigned tasks shown |
| 7 | Search tasks | Matching tasks shown |
| 8 | Task detail page loads | All fields visible |

---

## 04 — Members

| # | Test | Assertion |
|---|------|-----------|
| 1 | User management page loads | Member list visible |
| 2 | Generate invite link | Link shown, copyable |
| 3 | Create member directly | New member in list |
| 4 | Change member role | Role badge updated |
| 5 | Deactivate member | Status changes |

---

## 05 — Time Tracking

| # | Test | Assertion |
|---|------|-----------|
| 1 | Time log page loads | No crash |
| 2 | Log time entry | Entry appears in list |
| 3 | Timer start/stop | Duration recorded |
| 4 | Export time logs | Download triggered |

---

## 06 — All Pages Load

Tests that every route loads without JS exceptions. Covers 34 routes including:

- Core: dashboard, projects, my-tasks, calendar
- **Pre-Project: `/preproject`, `/preproject/new`, `/preproject/pp-001`** *(new)*
- PM: reports, sprints, time-tracking, team, workflow-monitor
- **Approval & Governance: `/admin/approvals`, `/admin/approval-groups`, `/workflow/group-approvals`, `/workflow/governance`, `/workflow/training`, `/governance`, `/governance/closure`** *(new)*
- Executive: executive, roadmap, risk-register
- Admin: users, workflows, custom-fields, roles, audit-log, exports, forms, divisions, feature-flags, onboarding, settings

---

## 07 — Comments & Sprints

| # | Test | Assertion |
|---|------|-----------|
| 1 | Add comment to task | Comment appears |
| 2 | Delete own comment | Removed |
| 3 | Create sprint | Sprint in list |
| 4 | Add task to sprint | Task shows sprint badge |
| 5 | Complete sprint | Status updated |

---

## 08 — Pre-Project & Workflow *(new in this sprint)*

### Pre-Project List
| # | Test | Assertion |
|---|------|-----------|
| 1 | Page loads without crash | No TypeError |
| 2 | Pipeline filter tabs present | All, Draft, Approved, Converted visible |
| 3 | Search filters results | Unrelated projects hidden |
| 4 | "New Pre-Project" button navigates to form | URL = /preproject/new |
| 5 | Clicking card navigates to detail | URL = /preproject/:id |
| 6 | Status filter shows correct subset | Filtered items match status |

### Pre-Project Form
| # | Test | Assertion |
|---|------|-----------|
| 7 | Form loads step 1 | 4 step indicators visible |
| 8 | Next disabled when required fields empty | Button disabled |
| 9 | Fill step 1 → proceeds to step 2 | Budget field visible |
| 10 | Back button returns to previous step | Step 1 shown |
| 11 | Cancel returns to list | URL = /preproject |

### Pre-Project Detail
| # | Test | Assertion |
|---|------|-----------|
| 12 | Detail page loads without crash | No TypeError |
| 13 | All 5 tabs visible | Overview, Workflow, Documents, Budget, Audit Trail |
| 14 | Workflow tab shows stepper | Core Review, CFO Review visible |
| 15 | Documents tab shows file list | DPR, EIA visible |
| 16 | Budget tab shows breakdown | Civil Works, Labour visible |
| 17 | Audit Trail shows history | SUBMITTED, APPROVED visible |
| 18 | Back button returns to list | URL = /preproject |
| 19 | Invalid ID shows not found | "not found" text |

### Approval Inbox
| # | Test | Assertion |
|---|------|-----------|
| 20 | Inbox loads with 4 tabs | My Queue, All Pending, Overdue, Completed |
| 21 | All Pending tab shows projects | Highway, Bridge visible |
| 22 | Overdue tab loads without crash | No TypeError |
| 23 | SLA progress bar visible | .h-1.5 element present |
| 24 | Completed tab shows audit log link | "Audit Log" text |

### Workflow Monitor
| # | Test | Assertion |
|---|------|-----------|
| 25 | Monitor loads with KPI cards | Pending, Overdue, On-Time Rate |
| 26 | Instance table shows items | Highway Widening visible |
| 27 | Step filter works | No crash after filter click |
| 28 | My Queue button navigates | URL = /admin/approvals |

### Workflow Governance
| # | Test | Assertion |
|---|------|-----------|
| 29 | Governance page loads | Title visible |
| 30 | All 5 tabs present | Overview, SLA Policy, Escalation, Delegates, History |
| 31 | SLA Policy tab editable | Warn/Escalate inputs visible |
| 32 | Escalation Chain shows roles | Division Admin, Org Admin visible |
| 33 | Override History shows records | Table/list visible |
| 34 | Admin Override button for org_admin | Button visible |

### Workflow Training Guide
| # | Test | Assertion |
|---|------|-----------|
| 35 | Training page loads | Title visible |
| 36 | All 4 role cards shown | PM, Division Head, CFO, Org Admin |
| 37 | Switching roles updates content | Don't text updates |
| 38 | FAQ item expands | Answer text visible |

### Governance Dashboard
| # | Test | Assertion |
|---|------|-----------|
| 39 | Dashboard loads with KPIs | 4 stat cards visible |
| 40 | Budget tracker shows project cards | Bridge, Water Supply visible |
| 41 | Milestone Approvals tab | No crash |
| 42 | Division filter narrows results | Education filter shows school |
| 43 | Budget breakdown expands | Civil Works visible |

### Project Closure
| # | Test | Assertion |
|---|------|-----------|
| 44 | Closure page loads | Project list visible |
| 45 | Next disabled until project selected | Button disabled |
| 46 | Select project enables Next | Button enabled |
| 47 | Progresses to checklist | Technical, Financial, Administrative shown |

---

## 09 — Approval Groups & Group Dashboard *(new in this sprint)*

### Approval Group Configuration (Org Admin)
| # | Test | Assertion |
|---|------|-----------|
| 1 | Page loads without crash | No TypeError |
| 2 | Pre-seeded groups visible | Core Team, CFO Group, Division Head |
| 3 | Approval type badges shown | ANY, ALL, QUORUM |
| 4 | Expand group reveals members | Division Head, Senior Engineer visible |
| 5 | "New Group" opens modal | Modal with name input |
| 6 | Type selector visible in modal | ANY / ALL / QUORUM buttons |
| 7 | QUORUM reveals count input | Quorum Count field appears |
| 8 | Save disabled with empty name | Button disabled |
| 9 | Fill name enables Save, creates group | New group in list |
| 10 | "Add Member" opens member modal | Modal title visible |

### Workflow Steps Tab
| # | Test | Assertion |
|---|------|-----------|
| 11 | Steps tab loads without crash | No TypeError |
| 12 | Pipeline shows step names | Core Team Review, CFO Final Approval |
| 13 | Table shows group assignment | Core Team / CFO Group |
| 14 | Status columns visible | PENDING_CFO_APPROVAL, ACTIVE |
| 15 | "Add Step" opens step modal | New Workflow Step title |
| 16 | Save disabled without name+group | Button disabled |
| 17 | Escalation section visible | Escalate after, Escalate to Group |

### Group Approval Dashboard
| # | Test | Assertion |
|---|------|-----------|
| 18 | Page loads without crash | No TypeError |
| 19 | KPI cards visible | In Progress, SLA Overdue, Completed |
| 20 | Group summary cards | Core Team, CFO Group, Division Head |
| 21 | Workflow instances listed | Highway Widening, Yamuna Bridge visible |
| 22 | Filter tabs present | All, In Progress, Completed |
| 23 | Completed filter narrows list | Only Rural Water Supply Scheme |
| 24 | Expand card shows step + votes | Rajesh Kumar visible |
| 25 | Quorum bars visible | .h-3 elements present |
| 26 | Approve/Reject buttons shown | For active step |
| 27 | SLA overdue indicator | Overdue badge visible |
| 28 | Config Audit tab shows log | GROUP_CREATED, MEMBER_ADDED |

---

## Test Helpers

`helpers.ts` exports:

```ts
// Inject dev auth cookie + header for a given user role
injectDevAuth(page, userId?: string): Promise<void>
// userId defaults to 'dev-org_admin-id'
// Options: dev-org_admin-id | dev-division_admin-id | dev-project_manager-id
//          dev-member-id | dev-viewer-id | dev-executive-id
```

---

## Running Tests

```bash
# Run all tests
npx playwright test

# Run only the new pre-project tests
npx playwright test 08-preproject-workflow

# Run only the group approval tests
npx playwright test 09-approval-groups

# Run with UI mode
npx playwright test --ui

# Run a single test file
npx playwright test e2e/06-dashboard-pages.spec.ts

# Show report after run
npx playwright show-report
```

---

## Coverage Summary

| Module | Covered | Test Type |
|--------|---------|-----------|
| Authentication | ✅ | E2E + unit |
| Projects CRUD | ✅ | E2E |
| Tasks CRUD | ✅ | E2E |
| Members / Invite | ✅ | E2E |
| Time Tracking | ✅ | E2E |
| All page loads | ✅ | Smoke |
| Comments / Sprints | ✅ | E2E |
| **Pre-Project lifecycle** | ✅ | **E2E (new)** |
| **Approval Inbox** | ✅ | **E2E (new)** |
| **Workflow Monitor** | ✅ | **E2E (new)** |
| **Workflow Governance** | ✅ | **E2E (new)** |
| **Training Guide** | ✅ | **E2E (new)** |
| **Governance Dashboard** | ✅ | **E2E (new)** |
| **Project Closure** | ✅ | **E2E (new)** |
| **Approval Group Config** | ✅ | **E2E (new)** |
| **Group Approval Dashboard** | ✅ | **E2E (new)** |
| **Group Approval API** | ✅ | **Backend (new)** |
| Backend API routes | ⚠️ | Integration (manual) |
| Prisma schema | ⚠️ | Migration test needed |

# CLAUDE.md — Project Management Tool

## Project Overview
Multi-role SaaS project management tool for Quality Council of India (QCI / Q-Flow).
Roles: `org_admin`, `division_admin`, `vertical_head`, `project_manager`, `team_lead`, `member`, `viewer`, `executive`.
Hierarchy: Division → Vertical → Project → Milestone → Task

---

## Dev Servers
| Service   | Port | Start command              |
|-----------|------|----------------------------|
| Frontend  | 5173 | `cd frontend && npm run dev` |
| Backend   | 4000 | `cd backend && npm run dev`  |
| DB (PG)   | 5432 | PostgreSQL 17, db=`project_mgmt`, user=`postgres`, pw=`123456` |

Frontend proxies `/v1/*` → `http://localhost:4000` (vite.config.ts).

---

## Key Commands
```bash
# Backend
cd backend && npm run dev            # nodemon
cd backend && npm run db:migrate     # prisma migrate dev
cd backend && npm run db:seed        # seed data
cd backend && npm run db:studio      # Prisma Studio

# Frontend
cd frontend && npm run dev
cd frontend && npm run build         # tsc -b && vite build

# E2E tests
npx playwright test                  # full suite (172 tests, ~4 min)
npx playwright test e2e/08-preproject-workflow.spec.ts   # single spec
npx playwright test --grep "test name"
```

## Vercel Deploy (production)
Both projects have rootDirectory set in Vercel dashboard, so deploy from repo ROOT.

```bash
# Deploy backend (set root .vercel/project.json to backend project)
cp backend/.vercel/project.json .vercel/project.json
vercel --prod --yes      # run from repo root

# Deploy frontend (set root .vercel/project.json to frontend project)
cp frontend/.vercel/project.json .vercel/project.json
vercel --prod --yes      # run from repo root
```

Production URLs:
- Backend:  https://qflow-backend-priyankabansal91s-projects.vercel.app
- Frontend: https://frontend-priyankabansal91s-projects.vercel.app

---

## Repository Layout
```
frontend/src/
  App.tsx                  ← 80+ React Router v6 routes (ProtectedRoute / PublicRoute)
  types/index.ts           ← shared TS interfaces (User, Project, Task, OrgRole …)
  store/
    authStore.ts           ← Zustand: login/logout, role switching, localStorage persist
    featureFlagsStore.ts
    themeStore.ts
    attendanceStore.ts
    preProjectStore.ts     ← Pre-project Zustand store (seed + addProject/updateProject)
  components/
    layout/                ← AppShell, Header, Sidebar, MobileNav
    shared/                ← TaskModal, GlobalSearch, PermissionGate, WorkflowModal …
    ui/                    ← Radix UI primitives (button, card, badge, input, dialog …)
  pages/
    auth/                  ← Login, Register, ForgotPassword, InviteAccept
    pm/                    ← ProjectList, KanbanBoard, SprintManagement, TimeLogging,
                              Calendar, Reports, ReportsAdvanced, CapacityPlanning, Gantt
    user/                  ← MyTasks, TaskDetail, Notifications
    admin/                 ← UserManagement, Workflows, ApprovalInbox, ApprovalGroups,
                              AuditLog, OrgSettings, Divisions, CustomRoles, Exports …
    executive/             ← ExecutiveDashboard, Financial, OKR, Portfolio, RiskRegister
    workflow/              ← WorkflowMonitoring, WorkflowGovernance, WorkflowTraining,
                              GroupApprovalDashboard
    preproject/            ← PreProjectList, PreProjectDetail, PreProjectForm
    governance/            ← GovernanceDashboard, ProjectClosure

backend/src/
  app.js                   ← Express entry: helmet/CORS/rate-limit, mounts all /v1 routes
  middleware/
    auth.js                ← JWT verify + dev bypass (see Auth section)
    divisionScope.js       ← Division-level access control
    errorHandler.js
  routes/                  ← 30 route files: auth, projects, tasks, comments, dashboard,
                              members, workflows, approvals, forms, divisions, customRoles,
                              externalUsers, versioning, exports, integrations/outlook,
                              okrs, financial, resources, ai, divisionConfig, executive,
                              timeLogs, notifications, search, portfolio, sprints,
                              auditLog, mis, approvalGroups
  services/                ← 30 matching service files (business logic)
  prisma/schema.prisma     ← PostgreSQL schema (User, Org, Project, Task, Workflow …)

e2e/
  helpers.ts               ← injectDevAuth(), BASE_API, DEV_HEADER, apiCreate*
  01-auth.spec.ts          ← Auth flows
  02-projects.spec.ts      ← Project CRUD
  03-tasks.spec.ts         ← Task CRUD
  04-members.spec.ts       ← Member management
  05-time-tracking.spec.ts ← Time logs
  06-dashboard-pages.spec.ts ← Smoke tests for 40+ pages (load + no crash)
  07-comments-sprints.spec.ts
  08-preproject-workflow.spec.ts ← Pre-project + Approval Inbox + Governance (36 tests)
  09-approval-groups.spec.ts     ← Group approval system (28 tests)
  SPECS.md                 ← Test coverage map
```

---

## Auth Pattern

### Dev bypass (NODE_ENV=development only)
`backend/src/middleware/auth.js` accepts `x-dev-user-id` header:
```
dev-org_admin-id        → org_admin
dev-division_admin-id   → division_admin
dev-project_manager-id  → project_manager
dev-member-id           → member
dev-viewer-id           → viewer
dev-executive-id        → executive
```
No header → defaults to `dev-org_admin-id`.

### Frontend dev auth (Playwright / manual testing)
`e2e/helpers.ts → injectDevAuth(page, role?)` injects into `localStorage['pm-auth']`:
```ts
await injectDevAuth(page);               // org_admin (default)
await injectDevAuth(page, 'dev-division_admin-id');
```

### Production
Bearer JWT in `Authorization` header. Payload: `{sub, org_id, role, email}`.
Frontend: `authStore.ts` — `login()`, `logout()`, `switchRole()`, token in localStorage.

---

## Key Code Patterns

### Adding a new page
1. Create `frontend/src/pages/<domain>/MyPage.tsx`
2. Add route in `frontend/src/App.tsx`
3. Add nav item in `frontend/src/components/layout/Sidebar.tsx` (with `roles: [...]` and `section`)
4. Add smoke test in `e2e/06-dashboard-pages.spec.ts` PAGES array

### Adding a new API route
1. Create `backend/src/routes/myResource.js`
2. Create `backend/src/services/myResourceService.js`
3. Mount in `backend/src/app.js`: `app.use('/v1/my-resource', myResourceRoutes)`
4. Use `authenticate` middleware; `authorize('org_admin')` for admin-only endpoints

### Zustand store pattern
```ts
import { create } from 'zustand';
export const useMyStore = create<State>((set) => ({
  items: SEED_DATA,
  addItem: (item) => set((s) => ({ items: [item, ...s.items] })),
  updateItem: (id, patch) => set((s) => ({
    items: s.items.map((i) => i.id === id ? { ...i, ...patch } : i),
  })),
}));
```

### Data fetching (TanStack Query + axios)
```ts
const { data } = useQuery({ queryKey: ['resource', id], queryFn: () => api.get(`/resource/${id}`) });
const mutation = useMutation({ mutationFn: (data) => api.post('/resource', data) });
```

### Role-gated UI
```tsx
<PermissionGate roles={['org_admin', 'division_admin']}>
  <AdminOnlyComponent />
</PermissionGate>
```

---

## Playwright Test Patterns

### Avoid strict-mode violations (sidebar text collisions)
```ts
// BAD — "Financial Dashboard" in sidebar also matches "Financial"
await expect(page.getByText('Financial')).toBeVisible();

// GOOD — scope to <main>
await expect(page.locator('main').getByText('Financial')).toBeVisible();

// BAD — "Audit Log" appears in sidebar nav for org_admin
await expect(page.getByText('Audit Log')).toBeVisible();

// GOOD
await expect(page.locator('main').getByText('Audit Log').first()).toBeVisible();

// For tab buttons with count spans (text node isn't exact)
await page.locator('button').filter({ hasText: /^Overdue/ }).first().click();
```

### Slow-load assertions (CPU-heavy full suite)
```ts
// Add longer timeout on first assertion after navigation
const main = page.locator('main');
await expect(main.getByText('My Queue')).toBeVisible({ timeout: 20000 });
```

### Playwright config
- `expect.timeout: 10000` (10s per assertion)
- `timeout: 30000` (30s per test)
- `retries: 1`
- `workers: 1` (sequential)
- `baseURL: http://localhost:5173`

---

## UI Library
- **Radix UI** primitives (Dialog, Popover, Select, Tabs, Toast, Tooltip, …) via `@/components/ui/`
- **Tailwind CSS** for all styling
- **lucide-react** for icons
- **Recharts** for charts
- **react-hook-form** for forms

---

## Task Delegation Rules

When solving complex tasks:
- Break work into subagents when helpful
- Do not over-split simple tasks

### Model Selection
| Model  | Use for |
|--------|---------|
| Haiku  | Bulk mechanical tasks, simple transformations, large repetitive processing |
| Sonnet | Reasoning, code generation, analysis, synthesis |
| Opus   | Deep reasoning, high-stakes decisions only |

### Delegation Limits
- Max depth = 2 (Parent → Subagent → Sub-subagent)
- If a subagent needs a smarter model → return to parent instead of escalating itself

---

## Tool Usage Preferences

Always prefer cheaper tools first:

1. **WebFetch** — public pages, no login required
2. **Agent Browser** — only when login required or dynamic pages; avoid heavy browsing
3. **PDF Extract** — use for PDFs instead of reading manually

If the same fetch pattern repeats → convert it into a reusable tool/function.

---

## System Settings

- `CLAUDE_CODE_DISABLE_1M_CONTEXT: "1"` — prevents loading unnecessary large context
- `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: "80"` — auto-compacts context at 80% usage

---

## Execution Rules

- Always think before spawning subagents
- Avoid unnecessary recursion
- Prefer clarity over complexity
- Keep outputs structured

# Q-Flow Demo Credentials

All demo accounts use the password: **`password123`**

---

## Core Roles

| Role | Label | Email | Division |
|------|-------|-------|----------|
| `org_admin` | System Admin | `admin@example.local` | All (global access) |
| `division_admin` | Division Admin | `div-admin@example.local` | Engineering |
| `vertical_head` | Vertical Head | `vertical-head@example.local` | Engineering |
| `hod` | CEO/HoD | `hod@example.local` | Engineering |
| `team_lead` | Team Lead | `team-lead@example.local` | Engineering |
| `project_manager` | Project Lead | `pm@example.local` | Engineering |
| `member` | Team Member | `member@example.local` | Engineering |
| `executive` | Leadership | `executive@example.local` | All (read-only) |
| `viewer` | Others | `viewer@example.local` | Assigned projects only |

---

## PPID Division

| Role | Label | Email | Division |
|------|-------|-------|----------|
| `division_admin` | PPID Div Admin | `ppid-divadmin@example.local` | PPID |
| `vertical_head` | PPID Vertical Head | `ppid-vh@example.local` | PPID |
| `project_manager` | PPID Project Lead | `ppid-pl@example.local` | PPID |
| `member` | PPID Team Member | `ppid-tm@example.local` | PPID |
| `hod` | PPID CEO/HoD | `ppid-hod@example.local` | PPID |

---

## Role Hierarchy & Access

```
org_admin (100)        — Full system access, all divisions
  executive (90)       — Cross-division read-only reports
  hod (85)             — Approve/reject, MIS of all projects & verticals
  division_admin (80)  — Full control within their division
    vertical_head (70) — Manage verticals, allocate members
      project_manager (60) — Manage projects & sprints
        team_lead (50) — Lead a team, assign tasks
          member (40)  — Work on tasks
          viewer (10)  — Read-only assigned projects
```

---

## Seed Source

User accounts are defined in `backend/prisma/seed.js`.
Dev bypass headers are defined in `backend/src/middleware/auth.js` (`DEV_USERS` map).
Frontend personas are defined in `frontend/src/store/authStore.ts` (`STAKEHOLDER_PERSONAS`).

---

## Adding a New User / Role

When adding a new demo user, update **all four** of the following:

1. **`backend/prisma/seed.js`** — add to `users[]` and `orgMembers[]` arrays (and `divisionMembers[]` if division-scoped)
2. **`backend/src/middleware/auth.js`** — add entry to `DEV_USERS` map with `{ id, orgId, role, email }`
3. **`frontend/src/store/authStore.ts`** — add entry to `STAKEHOLDER_PERSONAS` array
4. **`CREDENTIALS.md`** (this file) — add row to the appropriate section table

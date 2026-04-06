# 2. Database Design (PostgreSQL)

> Complete database specification with schema, indexing strategy, RLS policies, and sample data.

---

## 2.1 Entity Relationship Diagram (ERD)

```
┌──────────────────┐       ┌──────────────────────┐       ┌────────────────────┐
│  organizations   │       │     org_members       │       │      users         │
│──────────────────│       │──────────────────────│       │────────────────────│
│ id (PK, UUID)    │◄──┐   │ id (PK, UUID)        │   ┌──►│ id (PK, UUID)      │
│ name             │   ├───│ org_id (FK)           │   │   │ email (UNIQUE)     │
│ slug (UNIQUE)    │   │   │ user_id (FK) ─────────┼───┘   │ password_hash      │
│ domain           │   │   │ role (ENUM)           │       │ first_name         │
│ plan (ENUM)      │   │   │ is_owner              │       │ last_name          │
│ max_members      │   │   │ UNIQUE(org_id,user_id)│       │ status (ENUM)      │
│ settings (JSONB) │   │   └──────────────────────┘       │ preferences (JSONB)│
│ metadata (JSONB) │   │                                   └────────────────────┘
│ deleted_at       │   │
└──────────────────┘   │
         │             │
         │             │   ┌──────────────────────┐
         │             │   │  workflow_configs     │
         │             ├───│──────────────────────│
         │             │   │ id (PK, UUID)        │
         │             │   │ org_id (FK)          │
         │             │   │ name                 │
         │             │   │ statuses (JSONB)     │
         │             │   │ transitions (JSONB)  │
         │             │   └──────────┬───────────┘
         │             │              │
         │             │   ┌──────────▼───────────┐       ┌────────────────────┐
         │             │   │     projects         │       │  project_members   │
         │             ├───│─────────────────────│       │────────────────────│
         │             │   │ id (PK, UUID)        │◄──────│ project_id (FK)    │
         │             │   │ org_id (FK)          │       │ user_id (FK)       │
         │             │   │ name                 │       │ role (ENUM)        │
         │             │   │ key (e.g. "CPR")     │       └────────────────────┘
         │             │   │ workflow_config_id(FK)│
         │             │   │ owner_id (FK)        │
         │             │   │ custom_fields (JSONB)│
         │             │   └──────────┬───────────┘
         │             │              │
         │             │   ┌──────────▼───────────┐       ┌────────────────────┐
         │             │   │       tasks          │       │     comments       │
         │             ├───│─────────────────────│       │────────────────────│
         │             │   │ id (PK, UUID)        │◄──────│ task_id (FK)       │
         │             │   │ org_id (FK)          │       │ author_id (FK)     │
         │             │   │ project_id (FK)      │       │ parent_id (FK)     │
         │             │   │ parent_task_id (FK)  │       │ body (Markdown)    │
         │             │   │ seq_number           │       │ mentions (UUID[])  │
         │             │   │ title                │       └────────────────────┘
         │             │   │ status_id (JSONB ref)│
         │             │   │ priority (ENUM)      │       ┌────────────────────┐
         │             │   │ assignee_id (FK)     │       │  activity_logs     │
         │             │   │ position (LexoRank)  │       │────────────────────│
         │             │   │ tags (TEXT[])         │       │ org_id (FK)        │
         │             │   │ custom_fields (JSONB)│       │ actor_id (FK)      │
         │             │   └─────────────────────┘       │ entity_type        │
         │             │                                  │ entity_id          │
         │             │                                  │ action             │
         │             │                                  │ old_value (JSONB)  │
         │             └──────────────────────────────────│ new_value (JSONB)  │
         │                                                └────────────────────┘
         │
         │   ┌──────────────────────────┐  ┌─────────────────┐  ┌──────────────┐
         ├───│ custom_field_definitions │  │    sprints      │  │  time_logs   │
         │   │ org_id (FK)             │  │ project_id (FK) │  │ task_id (FK) │
         │   │ field_key (UNIQUE/org)  │  │ start/end_date  │  │ user_id (FK) │
         │   │ field_type              │  │ status          │  │ hours        │
         │   │ options (JSONB)         │  └─────────────────┘  └──────────────┘
         │   └──────────────────────────┘
         │
         │   ┌──────────────────┐  ┌───────────────────┐  ┌──────────────────┐
         └───│  notifications   │  │   invitations     │  │    ai_logs       │
             │ user_id (FK)     │  │ org_id (FK)       │  │ org_id (FK)      │
             │ type (ENUM)      │  │ email             │  │ feature          │
             │ is_read          │  │ token_hash        │  │ prompt_tokens    │
             └──────────────────┘  └───────────────────┘  └──────────────────┘
```

---

## 2.2 Schema Summary

All SQL files are located in the `/database` directory:

| File | Description |
|------|-------------|
| `schema.sql` | Complete DDL with all tables, enums, triggers, and functions |
| `indexes.sql` | Full indexing strategy with GIN, BRIN, partial, and composite indexes |
| `rls-policies.sql` | Row-Level Security policies for tenant isolation |
| `seed.sql` | Sample data with 2 organizations, 7 users, 3 projects, 7 tasks |

---

## 2.3 Table Inventory

| Table | Purpose | Key Columns | Row-Level Security |
|-------|---------|-------------|-------------------|
| `organizations` | Tenant root entity | slug, plan, settings (JSONB) | Yes |
| `users` | Platform users (cross-org) | email, password_hash, status | No (global) |
| `org_members` | User-org mapping with roles | org_id, user_id, role (ENUM) | Yes |
| `refresh_tokens` | JWT refresh token storage | token_hash, expires_at | No (user-scoped) |
| `workflow_configs` | Configurable statuses per org | statuses (JSONB), transitions (JSONB) | Yes |
| `custom_field_definitions` | Dynamic form fields per org | field_type, options (JSONB) | Yes |
| `projects` | Project containers | key, workflow_config_id, owner_id | Yes |
| `project_members` | Project-level role override | project_id, user_id, role | Yes |
| `task_sequences` | Auto-increment per project | project_id, last_seq | No |
| `tasks` | Work items | seq_number, status_id, position, custom_fields (JSONB) | Yes |
| `task_watchers` | Task notification subscribers | task_id, user_id | Yes |
| `comments` | Threaded task comments | parent_id, body, mentions (UUID[]) | Yes |
| `activity_logs` | Immutable audit trail | entity_type, action, old/new_value (JSONB) | Yes |
| `notifications` | User notifications | type (ENUM), is_read | Yes |
| `sprints` | Scrum sprint containers | project_id, start/end_date, status | Yes |
| `sprint_tasks` | Sprint-task assignment | sprint_id, task_id | Yes |
| `time_logs` | Time tracking entries | task_id, user_id, hours, logged_date | Yes |
| `invitations` | Org invite tokens | email, token_hash, expires_at | Yes |
| `ai_logs` | AI feature usage tracking | feature, prompt/completion_tokens | Yes |

---

## 2.4 Key Design Decisions

### UUID Primary Keys
- Every table uses `UUID v4` as primary key (`uuid_generate_v4()`)
- Prevents enumeration attacks (sequential IDs leak entity count)
- Safe for distributed systems and future sharding
- Tradeoff: 16 bytes vs 4 bytes for INT — acceptable for our scale

### JSONB for Flexibility
- `organizations.settings` — org-level preferences (theme, timezone, date format)
- `workflow_configs.statuses` — ordered array of status objects with colors
- `workflow_configs.transitions` — allowed state machine transitions
- `custom_field_definitions.options` — field-type-specific config (choices, min/max)
- `tasks.custom_fields` — per-task custom field values
- `activity_logs.old_value/new_value` — change snapshots
- All JSONB columns have GIN indexes for key-path queries

### Soft Deletes
- `deleted_at TIMESTAMPTZ` on organizations, users, projects, tasks, comments
- Partial indexes exclude soft-deleted rows: `WHERE deleted_at IS NULL`
- Hard deletes only for GDPR data erasure requests (scheduled job)

### Task Ordering (LexoRank)
- `tasks.position DECIMAL(10,5)` for Kanban column ordering
- New task: position = max(position) + 10.0
- Reorder between tasks A and B: position = (A.position + B.position) / 2
- Rebalance when precision exhausted (rare, batch operation)

---

## 2.5 Indexing Strategy

### Categories Applied

| Category | Strategy | Example |
|----------|----------|---------|
| **FK Indexes** | Every foreign key column | `idx_tasks_project_id` |
| **Composite** | Multi-column for common queries | `idx_tasks_kanban (project_id, status_id, position)` |
| **Partial** | Filter out soft-deleted rows | `WHERE deleted_at IS NULL` |
| **GIN (JSONB)** | Key-path queries on JSON | `idx_tasks_custom_fields` |
| **GIN (Array)** | Array containment queries | `idx_tasks_tags`, `idx_comments_mentions` |
| **GIN (Trigram)** | Autocomplete / fuzzy search | `idx_users_first_name_trgm` |
| **Full-Text** | `to_tsvector` for search | `idx_tasks_fts` |
| **BRIN** | Time-range on append-only | `idx_activity_created_brin` |

### Materialized Views

Two materialized views are refreshed every 5 minutes for dashboard performance:

1. **`mv_project_stats`** — per-project: total/completed/overdue/critical tasks, completion %
2. **`mv_member_workload`** — per-member: open tasks, high-priority, overdue, hours logged

---

## 2.6 Row-Level Security (RLS)

Every table with `org_id` has RLS enabled. The application sets connection-level variables before each request:

```sql
SET LOCAL app.current_org_id = 'org-uuid-here';
SET LOCAL app.current_user_id = 'user-uuid-here';
```

Key policies:
- **Organizations**: Members can read their own org; only `org_admin` can update
- **Projects**: Visibility-aware (private projects require membership)
- **Tasks**: Project members, assignees, reporters, and admins can access
- **Comments**: Org members can read; only author can edit; author + admin can delete
- **Notifications**: User sees only their own
- **Activity Logs**: Read-only for org members; writes via service role only

---

## 2.7 Sample Data Overview

The seed file (`database/seed.sql`) creates:

### Organizations

| Organization | Slug | Plan | Users | Projects |
|-------------|------|------|-------|----------|
| Acme Corporation | `acme-corp` | Professional | 4 | 2 |
| GlobalTech Solutions | `globaltech` | Enterprise | 3 | 1 |

### Users

| Name | Email | Org | Role |
|------|-------|-----|------|
| Alice Chen | alice.admin@acme.com | Acme | org_admin (owner) |
| Bob Martinez | bob.pm@acme.com | Acme | project_manager |
| Carol Johnson | carol.dev@acme.com | Acme | member |
| David Park | david.dev@acme.com | Acme | member |
| Emma Wilson | emma.admin@globaltech.io | GlobalTech | org_admin (owner) |
| Frank Brown | frank.pm@globaltech.io | GlobalTech | project_manager |
| Grace Taylor | grace.dev@globaltech.io | GlobalTech | member |

### Workflow Configs

| Workflow | Org | Statuses |
|----------|-----|----------|
| Default Kanban | Acme | Backlog → To Do → In Progress → In Review → Done / Cancelled |
| Agile Scrum | Acme | Product Backlog → Sprint Backlog → In Sprint → Testing → Accepted |
| GlobalTech DevOps | GlobalTech | New → Grooming → Ready → Active → Code Review → QA → Released |

### Sample Tasks (Acme - CPR Project)

| Key | Title | Status | Priority | Assignee |
|-----|-------|--------|----------|----------|
| CPR-1 | Design new navigation component | In Progress | High | Carol |
| CPR-2 | Implement authentication flow | To Do | Critical | David |
| CPR-3 | Customer dashboard wireframes | Done | Medium | Carol |
| CPR-4 | Set up CI/CD pipeline | In Review | High | David |
| CPR-5 | Add Google OAuth provider | In Progress | High | David |

All demo user passwords: `Password123!`

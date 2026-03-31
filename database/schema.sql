-- ============================================================
-- SaaS Project Management Tool - PostgreSQL Schema
-- Version: 1.0.0
-- Engine: PostgreSQL 15+
-- Features: UUID PKs, JSONB configs, RLS-ready, full audit trail
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- trigram for full-text search

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');
CREATE TYPE org_role AS ENUM ('org_admin', 'project_manager', 'member', 'viewer');
CREATE TYPE org_plan AS ENUM ('free', 'starter', 'professional', 'enterprise');
CREATE TYPE project_status AS ENUM ('active', 'archived', 'completed', 'on_hold');
CREATE TYPE project_visibility AS ENUM ('private', 'org_wide', 'public');
CREATE TYPE task_priority AS ENUM ('critical', 'high', 'medium', 'low', 'none');
CREATE TYPE notification_type AS ENUM (
  'task_assigned', 'task_updated', 'task_commented',
  'project_created', 'project_updated', 'member_added',
  'mention', 'due_date_reminder', 'workflow_changed'
);

-- ============================================================
-- ORGANIZATIONS (Multi-Tenant Root)
-- ============================================================

CREATE TABLE organizations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             VARCHAR(255) NOT NULL,
  slug             VARCHAR(100) NOT NULL UNIQUE,  -- URL-friendly identifier
  domain           VARCHAR(255),                  -- SSO domain (optional)
  logo_url         VARCHAR(500),
  plan             org_plan NOT NULL DEFAULT 'free',
  plan_expires_at  TIMESTAMPTZ,
  max_members      INTEGER NOT NULL DEFAULT 5,
  max_projects     INTEGER NOT NULL DEFAULT 3,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  settings         JSONB NOT NULL DEFAULT '{}',   -- org-level preferences
  metadata         JSONB NOT NULL DEFAULT '{}',   -- billing, feature flags
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ                    -- soft delete
);

COMMENT ON TABLE organizations IS 'Root tenant entity. Every resource belongs to an organization.';
COMMENT ON COLUMN organizations.slug IS 'URL-friendly unique identifier, e.g. acme-corp';
COMMENT ON COLUMN organizations.settings IS 'Org-level UI/UX preferences (theme, timezone, etc.)';
COMMENT ON COLUMN organizations.metadata IS 'Internal metadata: billing ID, feature flags, limits';

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email                VARCHAR(320) NOT NULL UNIQUE,
  email_verified_at    TIMESTAMPTZ,
  password_hash        VARCHAR(255),              -- NULL for SSO-only users
  first_name           VARCHAR(100) NOT NULL,
  last_name            VARCHAR(100) NOT NULL,
  avatar_url           VARCHAR(500),
  timezone             VARCHAR(64) NOT NULL DEFAULT 'UTC',
  locale               VARCHAR(10) NOT NULL DEFAULT 'en',
  status               user_status NOT NULL DEFAULT 'pending_verification',
  last_login_at        TIMESTAMPTZ,
  failed_login_count   SMALLINT NOT NULL DEFAULT 0,
  locked_until         TIMESTAMPTZ,
  preferences          JSONB NOT NULL DEFAULT '{}', -- notification prefs, theme, etc.
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ
);

COMMENT ON TABLE users IS 'Platform users. A user can belong to multiple organizations.';
COMMENT ON COLUMN users.preferences IS 'Per-user settings: {"notifications": {...}, "theme": "dark"}';

-- ============================================================
-- USER-ORGANIZATION MEMBERSHIP (with Role)
-- ============================================================

CREATE TABLE org_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        org_role NOT NULL DEFAULT 'member',
  is_owner    BOOLEAN NOT NULL DEFAULT FALSE,     -- org owner flag
  invited_by  UUID REFERENCES users(id),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

COMMENT ON TABLE org_members IS 'Many-to-many: users <-> organizations with role assignment.';

-- ============================================================
-- REFRESH TOKENS
-- ============================================================

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,       -- SHA-256 of the actual token
  org_id      UUID REFERENCES organizations(id),
  device_info JSONB,                              -- browser, OS, IP
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WORKFLOW CONFIGURATIONS (per org)
-- ============================================================

CREATE TABLE workflow_configs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,          -- e.g. "Default", "Scrum", "Kanban"
  description     TEXT,
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  statuses        JSONB NOT NULL DEFAULT '[]',    -- ordered array of status objects
  transitions     JSONB NOT NULL DEFAULT '[]',    -- allowed status transitions
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN workflow_configs.statuses IS
  '[{"id":"uuid","name":"To Do","color":"#6B7280","is_initial":true,"is_final":false,"order":1}, ...]';
COMMENT ON COLUMN workflow_configs.transitions IS
  '[{"from_status_id":"uuid","to_status_ids":["uuid","uuid"]}, ...]';

-- ============================================================
-- CUSTOM FIELD DEFINITIONS (per org)
-- ============================================================

CREATE TABLE custom_field_definitions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name           VARCHAR(100) NOT NULL,
  field_key      VARCHAR(100) NOT NULL,           -- machine-readable key
  field_type     VARCHAR(50) NOT NULL,            -- text|number|date|select|multi_select|user|url|checkbox
  options        JSONB NOT NULL DEFAULT '{}',     -- for select: {choices: [...], default: ...}
  is_required    BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived    BOOLEAN NOT NULL DEFAULT FALSE,
  applies_to     VARCHAR(50) NOT NULL DEFAULT 'task', -- task|project|both
  display_order  SMALLINT NOT NULL DEFAULT 0,
  created_by     UUID NOT NULL REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, field_key)
);

-- ============================================================
-- PROJECTS
-- ============================================================

CREATE TABLE projects (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  description         TEXT,
  key                 VARCHAR(10) NOT NULL,        -- short key e.g. "ACME", "PROJ"
  status              project_status NOT NULL DEFAULT 'active',
  visibility          project_visibility NOT NULL DEFAULT 'private',
  color               VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
  icon                VARCHAR(50),
  workflow_config_id  UUID REFERENCES workflow_configs(id),
  owner_id            UUID NOT NULL REFERENCES users(id),
  start_date          DATE,
  due_date            DATE,
  custom_fields       JSONB NOT NULL DEFAULT '{}', -- field_key -> value
  settings            JSONB NOT NULL DEFAULT '{}', -- project-level overrides
  created_by          UUID NOT NULL REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  UNIQUE(org_id, key)
);

COMMENT ON COLUMN projects.key IS 'Short uppercase project key for task IDs: PROJ-1, PROJ-2...';

-- ============================================================
-- PROJECT MEMBERS (Project-level role override)
-- ============================================================

CREATE TABLE project_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        org_role NOT NULL DEFAULT 'member', -- can override org role for this project
  added_by    UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- ============================================================
-- TASK SEQUENCES (auto-increment per project for task numbers)
-- ============================================================

CREATE TABLE task_sequences (
  project_id  UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  last_seq    BIGINT NOT NULL DEFAULT 0
);

-- ============================================================
-- TASKS
-- ============================================================

CREATE TABLE tasks (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id      UUID REFERENCES tasks(id) ON DELETE SET NULL, -- subtasks
  seq_number          BIGINT NOT NULL,             -- project-scoped sequence (PROJ-42)
  title               VARCHAR(500) NOT NULL,
  description         TEXT,                        -- Markdown
  status_id           UUID,                        -- references workflow_configs.statuses[].id
  status_name         VARCHAR(100),                -- denormalized for performance
  priority            task_priority NOT NULL DEFAULT 'medium',
  assignee_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  reporter_id         UUID NOT NULL REFERENCES users(id),
  due_date            DATE,
  start_date          DATE,
  estimated_hours     DECIMAL(8,2),
  logged_hours        DECIMAL(8,2) NOT NULL DEFAULT 0,
  position            DECIMAL(10,5) NOT NULL DEFAULT 0, -- Kanban ordering (LexoRank)
  tags                TEXT[] NOT NULL DEFAULT '{}',
  custom_fields       JSONB NOT NULL DEFAULT '{}', -- custom field values
  attachments         JSONB NOT NULL DEFAULT '[]', -- [{id, name, url, size, type, uploaded_by}]
  is_archived         BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at        TIMESTAMPTZ,
  created_by          UUID NOT NULL REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  UNIQUE(project_id, seq_number)
);

COMMENT ON COLUMN tasks.position IS 'LexoRank float for ordering within Kanban columns';
COMMENT ON COLUMN tasks.custom_fields IS '{"cf_field_key": "value", "cf_priority_score": 8}';

-- ============================================================
-- TASK WATCHERS
-- ============================================================

CREATE TABLE task_watchers (
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, user_id)
);

-- ============================================================
-- COMMENTS
-- ============================================================

CREATE TABLE comments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  parent_id     UUID REFERENCES comments(id) ON DELETE CASCADE, -- threaded replies
  author_id     UUID NOT NULL REFERENCES users(id),
  body          TEXT NOT NULL,                    -- Markdown with @mentions
  mentions      UUID[] NOT NULL DEFAULT '{}',     -- mentioned user IDs
  attachments   JSONB NOT NULL DEFAULT '[]',
  is_edited     BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

-- ============================================================
-- ACTIVITY LOGS (Immutable Audit Trail)
-- ============================================================

CREATE TABLE activity_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type  VARCHAR(50) NOT NULL,              -- task|project|comment|member|config
  entity_id    UUID NOT NULL,
  action       VARCHAR(100) NOT NULL,             -- created|updated|deleted|status_changed|assigned
  old_value    JSONB,                             -- previous state snapshot
  new_value    JSONB,                             -- new state snapshot
  diff         JSONB,                             -- field-level diff
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() -- no updated_at: logs are immutable
);

COMMENT ON TABLE activity_logs IS 'Immutable audit trail. Never UPDATE or DELETE rows.';

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       VARCHAR(255) NOT NULL,
  body        TEXT,
  entity_type VARCHAR(50),
  entity_id   UUID,
  actor_id    UUID REFERENCES users(id),
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SPRINTS (for Scrum workflow)
-- ============================================================

CREATE TABLE sprints (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  goal         TEXT,
  status       VARCHAR(20) NOT NULL DEFAULT 'planned', -- planned|active|completed
  start_date   DATE,
  end_date     DATE,
  created_by   UUID NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SPRINT-TASK ASSIGNMENT
-- ============================================================

CREATE TABLE sprint_tasks (
  sprint_id   UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (sprint_id, task_id)
);

-- ============================================================
-- TIME LOGS
-- ============================================================

CREATE TABLE time_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hours       DECIMAL(8,2) NOT NULL,
  description TEXT,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVITE TOKENS
-- ============================================================

CREATE TABLE invitations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email        VARCHAR(320) NOT NULL,
  role         org_role NOT NULL DEFAULT 'member',
  token_hash   VARCHAR(255) NOT NULL UNIQUE,
  invited_by   UUID NOT NULL REFERENCES users(id),
  accepted_at  TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AI GENERATION LOGS
-- ============================================================

CREATE TABLE ai_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  feature         VARCHAR(100) NOT NULL,  -- task_generate|summary|report|decompose
  prompt_tokens   INTEGER,
  completion_tokens INTEGER,
  model           VARCHAR(100),
  entity_type     VARCHAR(50),
  entity_id       UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'organizations', 'users', 'org_members', 'workflow_configs',
    'custom_field_definitions', 'projects', 'tasks', 'comments', 'sprints'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t, t
    );
  END LOOP;
END $$;

-- ============================================================
-- TASK SEQUENCE FUNCTION (atomic, per-project)
-- ============================================================

CREATE OR REPLACE FUNCTION next_task_seq(p_project_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_seq BIGINT;
BEGIN
  INSERT INTO task_sequences(project_id, last_seq)
  VALUES (p_project_id, 1)
  ON CONFLICT (project_id) DO UPDATE
    SET last_seq = task_sequences.last_seq + 1
  RETURNING last_seq INTO v_seq;
  RETURN v_seq;
END;
$$ LANGUAGE plpgsql;

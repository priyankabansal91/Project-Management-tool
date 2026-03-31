-- ============================================================
-- SaaS Project Management Tool - Indexing Strategy
-- ============================================================
-- Strategy:
--   1. Every FK column gets an index (join performance)
--   2. Frequently filtered columns get composite indexes
--   3. Full-text search uses GIN/trigram indexes
--   4. JSONB fields with frequent key access get GIN indexes
--   5. Partial indexes for soft-delete patterns
-- ============================================================

-- ------------------------------------------------------------
-- ORGANIZATIONS
-- ------------------------------------------------------------
CREATE INDEX idx_organizations_slug       ON organizations(slug);
CREATE INDEX idx_organizations_plan       ON organizations(plan) WHERE is_active = TRUE;
CREATE INDEX idx_organizations_domain     ON organizations(domain) WHERE domain IS NOT NULL;
-- Soft delete
CREATE INDEX idx_organizations_active     ON organizations(id) WHERE deleted_at IS NULL;

-- ------------------------------------------------------------
-- USERS
-- ------------------------------------------------------------
CREATE INDEX idx_users_email              ON users(email);
CREATE INDEX idx_users_status             ON users(status);
-- Full-text search on name
CREATE INDEX idx_users_name_fts           ON users USING GIN(
  to_tsvector('english', first_name || ' ' || last_name || ' ' || email)
);
-- Trigram for autocomplete
CREATE INDEX idx_users_first_name_trgm    ON users USING GIN(first_name gin_trgm_ops);
CREATE INDEX idx_users_last_name_trgm     ON users USING GIN(last_name gin_trgm_ops);
-- Soft delete
CREATE INDEX idx_users_active             ON users(id) WHERE deleted_at IS NULL;

-- ------------------------------------------------------------
-- ORG_MEMBERS
-- ------------------------------------------------------------
CREATE INDEX idx_org_members_org_id       ON org_members(org_id);
CREATE INDEX idx_org_members_user_id      ON org_members(user_id);
CREATE INDEX idx_org_members_role         ON org_members(org_id, role);

-- ------------------------------------------------------------
-- REFRESH_TOKENS
-- ------------------------------------------------------------
CREATE INDEX idx_refresh_tokens_user_id   ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash      ON refresh_tokens(token_hash);
-- Cleanup expired tokens
CREATE INDEX idx_refresh_tokens_expires   ON refresh_tokens(expires_at) WHERE revoked_at IS NULL;

-- ------------------------------------------------------------
-- WORKFLOW_CONFIGS
-- ------------------------------------------------------------
CREATE INDEX idx_workflow_configs_org_id  ON workflow_configs(org_id);

-- ------------------------------------------------------------
-- CUSTOM_FIELD_DEFINITIONS
-- ------------------------------------------------------------
CREATE INDEX idx_cfd_org_id              ON custom_field_definitions(org_id);

-- ------------------------------------------------------------
-- PROJECTS
-- ------------------------------------------------------------
CREATE INDEX idx_projects_org_id          ON projects(org_id);
CREATE INDEX idx_projects_owner_id        ON projects(owner_id);
CREATE INDEX idx_projects_status          ON projects(org_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_workflow        ON projects(workflow_config_id);
-- Full-text search
CREATE INDEX idx_projects_name_fts        ON projects USING GIN(
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
);
CREATE INDEX idx_projects_name_trgm       ON projects USING GIN(name gin_trgm_ops);
-- Soft delete
CREATE INDEX idx_projects_active          ON projects(id) WHERE deleted_at IS NULL;

-- ------------------------------------------------------------
-- PROJECT_MEMBERS
-- ------------------------------------------------------------
CREATE INDEX idx_project_members_proj     ON project_members(project_id);
CREATE INDEX idx_project_members_user     ON project_members(user_id);

-- ------------------------------------------------------------
-- TASKS  (most heavily queried table)
-- ------------------------------------------------------------
-- Core access patterns
CREATE INDEX idx_tasks_org_id             ON tasks(org_id);
CREATE INDEX idx_tasks_project_id         ON tasks(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assignee_id        ON tasks(assignee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_reporter_id        ON tasks(reporter_id);
CREATE INDEX idx_tasks_parent             ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;
-- Kanban board: list by project + status, ordered by position
CREATE INDEX idx_tasks_kanban             ON tasks(project_id, status_id, position)
  WHERE deleted_at IS NULL AND is_archived = FALSE;
-- My tasks view
CREATE INDEX idx_tasks_my_tasks           ON tasks(assignee_id, org_id, due_date)
  WHERE deleted_at IS NULL AND completed_at IS NULL;
-- Due date filtering
CREATE INDEX idx_tasks_due_date           ON tasks(due_date) WHERE due_date IS NOT NULL AND deleted_at IS NULL;
-- Priority
CREATE INDEX idx_tasks_priority           ON tasks(project_id, priority) WHERE deleted_at IS NULL;
-- Full-text search on title + description
CREATE INDEX idx_tasks_fts                ON tasks USING GIN(
  to_tsvector('english', title || ' ' || COALESCE(description, ''))
);
CREATE INDEX idx_tasks_title_trgm         ON tasks USING GIN(title gin_trgm_ops);
-- Tags array search
CREATE INDEX idx_tasks_tags               ON tasks USING GIN(tags);
-- JSONB custom fields
CREATE INDEX idx_tasks_custom_fields      ON tasks USING GIN(custom_fields);

-- ------------------------------------------------------------
-- COMMENTS
-- ------------------------------------------------------------
CREATE INDEX idx_comments_task_id         ON comments(task_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_author_id       ON comments(author_id);
CREATE INDEX idx_comments_parent_id       ON comments(parent_id) WHERE parent_id IS NOT NULL;
-- Mentions array search
CREATE INDEX idx_comments_mentions        ON comments USING GIN(mentions);

-- ------------------------------------------------------------
-- ACTIVITY_LOGS
-- ------------------------------------------------------------
CREATE INDEX idx_activity_entity          ON activity_logs(org_id, entity_type, entity_id);
CREATE INDEX idx_activity_actor           ON activity_logs(actor_id, created_at DESC);
CREATE INDEX idx_activity_org_time        ON activity_logs(org_id, created_at DESC);
-- BRIN index for time-range queries on append-only table
CREATE INDEX idx_activity_created_brin    ON activity_logs USING BRIN(created_at);

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------
CREATE INDEX idx_notifications_user       ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_org        ON notifications(org_id);
-- Unread notifications (partial index)
CREATE INDEX idx_notifications_unread     ON notifications(user_id, created_at DESC)
  WHERE is_read = FALSE;

-- ------------------------------------------------------------
-- SPRINTS
-- ------------------------------------------------------------
CREATE INDEX idx_sprints_project          ON sprints(project_id);
CREATE INDEX idx_sprints_status           ON sprints(project_id, status);

-- ------------------------------------------------------------
-- TIME_LOGS
-- ------------------------------------------------------------
CREATE INDEX idx_time_logs_task           ON time_logs(task_id);
CREATE INDEX idx_time_logs_user           ON time_logs(user_id, logged_date DESC);
CREATE INDEX idx_time_logs_org_date       ON time_logs(org_id, logged_date DESC);

-- ------------------------------------------------------------
-- INVITATIONS
-- ------------------------------------------------------------
CREATE INDEX idx_invitations_org          ON invitations(org_id);
CREATE INDEX idx_invitations_email        ON invitations(email);
-- Active invitations
CREATE INDEX idx_invitations_active       ON invitations(token_hash)
  WHERE accepted_at IS NULL AND expires_at > NOW();

-- ------------------------------------------------------------
-- MATERIALIZED VIEW: Project Task Summary (refresh every 5 min)
-- ------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_project_stats AS
SELECT
  p.id                                          AS project_id,
  p.org_id,
  COUNT(t.id)                                   AS total_tasks,
  COUNT(t.id) FILTER (WHERE t.completed_at IS NOT NULL) AS completed_tasks,
  COUNT(t.id) FILTER (WHERE t.due_date < CURRENT_DATE AND t.completed_at IS NULL) AS overdue_tasks,
  COUNT(t.id) FILTER (WHERE t.priority = 'critical') AS critical_tasks,
  ROUND(
    COUNT(t.id) FILTER (WHERE t.completed_at IS NOT NULL)::NUMERIC /
    NULLIF(COUNT(t.id), 0) * 100, 2
  )                                             AS completion_pct,
  COUNT(DISTINCT t.assignee_id)                 AS active_members,
  MAX(t.updated_at)                             AS last_activity_at
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id AND t.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.org_id;

CREATE UNIQUE INDEX idx_mv_project_stats ON mv_project_stats(project_id);
CREATE INDEX idx_mv_project_stats_org    ON mv_project_stats(org_id);

-- Refresh command (run via cron job or pg_cron):
-- SELECT cron.schedule('refresh-project-stats', '*/5 * * * *',
--   'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_project_stats');

-- ------------------------------------------------------------
-- MATERIALIZED VIEW: Member Workload
-- ------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_member_workload AS
SELECT
  om.org_id,
  om.user_id,
  u.first_name,
  u.last_name,
  COUNT(t.id) FILTER (WHERE t.completed_at IS NULL) AS open_tasks,
  COUNT(t.id) FILTER (WHERE t.priority IN ('critical','high') AND t.completed_at IS NULL) AS high_priority_tasks,
  COUNT(t.id) FILTER (WHERE t.due_date < CURRENT_DATE AND t.completed_at IS NULL) AS overdue_tasks,
  COALESCE(SUM(t.estimated_hours) FILTER (WHERE t.completed_at IS NULL), 0) AS estimated_hours_open,
  COALESCE(SUM(tl.hours), 0) AS logged_hours_month
FROM org_members om
JOIN users u ON u.id = om.user_id
LEFT JOIN tasks t ON t.assignee_id = om.user_id AND t.org_id = om.org_id AND t.deleted_at IS NULL
LEFT JOIN time_logs tl ON tl.user_id = om.user_id AND tl.org_id = om.org_id
  AND tl.logged_date >= date_trunc('month', CURRENT_DATE)
GROUP BY om.org_id, om.user_id, u.first_name, u.last_name;

CREATE UNIQUE INDEX idx_mv_member_workload ON mv_member_workload(org_id, user_id);

-- ============================================================
-- SaaS Project Management Tool - Row-Level Security Policies
-- ============================================================
-- Strategy: Every table carrying org_id has an RLS policy.
-- The current org is set per-connection via SET LOCAL app.current_org_id.
-- The current user is set per-connection via SET LOCAL app.current_user_id.
-- This is enforced at the application layer before every query.
-- ============================================================

-- Helper functions

CREATE OR REPLACE FUNCTION current_org_id() RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_org_id', TRUE)::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_user_id', TRUE)::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_org_role() RETURNS org_role AS $$
BEGIN
  RETURN (
    SELECT role FROM org_members
    WHERE org_id = current_org_id()
    AND user_id = current_user_id()
  );
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------
-- Enable RLS on all tenant-scoped tables
-- ------------------------------------------------------------

ALTER TABLE organizations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members            ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_configs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects               ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_watchers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints                ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs                ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- ORGANIZATIONS: member can read their own org
-- ------------------------------------------------------------

CREATE POLICY pol_org_select ON organizations
  FOR SELECT USING (
    id = current_org_id()
    OR EXISTS (
      SELECT 1 FROM org_members
      WHERE org_id = organizations.id AND user_id = current_user_id()
    )
  );

CREATE POLICY pol_org_update ON organizations
  FOR UPDATE USING (
    id = current_org_id()
    AND current_user_org_role() = 'org_admin'
  );

-- ------------------------------------------------------------
-- ORG_MEMBERS: members can see their org's roster
-- ------------------------------------------------------------

CREATE POLICY pol_org_members_select ON org_members
  FOR SELECT USING (org_id = current_org_id());

CREATE POLICY pol_org_members_insert ON org_members
  FOR INSERT WITH CHECK (
    org_id = current_org_id()
    AND current_user_org_role() = 'org_admin'
  );

CREATE POLICY pol_org_members_update ON org_members
  FOR UPDATE USING (
    org_id = current_org_id()
    AND current_user_org_role() = 'org_admin'
  );

CREATE POLICY pol_org_members_delete ON org_members
  FOR DELETE USING (
    org_id = current_org_id()
    AND current_user_org_role() = 'org_admin'
    AND user_id != current_user_id() -- cannot remove self
  );

-- ------------------------------------------------------------
-- WORKFLOW CONFIGS: org_admin manages, others read
-- ------------------------------------------------------------

CREATE POLICY pol_workflow_select ON workflow_configs
  FOR SELECT USING (org_id = current_org_id());

CREATE POLICY pol_workflow_modify ON workflow_configs
  FOR ALL USING (
    org_id = current_org_id()
    AND current_user_org_role() IN ('org_admin', 'project_manager')
  );

-- ------------------------------------------------------------
-- PROJECTS: visibility-aware access
-- ------------------------------------------------------------

CREATE POLICY pol_projects_select ON projects
  FOR SELECT USING (
    org_id = current_org_id()
    AND deleted_at IS NULL
    AND (
      visibility = 'org_wide'
      OR owner_id = current_user_id()
      OR EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = projects.id AND pm.user_id = current_user_id()
      )
      OR current_user_org_role() IN ('org_admin', 'project_manager')
    )
  );

CREATE POLICY pol_projects_insert ON projects
  FOR INSERT WITH CHECK (
    org_id = current_org_id()
    AND current_user_org_role() IN ('org_admin', 'project_manager')
  );

CREATE POLICY pol_projects_update ON projects
  FOR UPDATE USING (
    org_id = current_org_id()
    AND (
      owner_id = current_user_id()
      OR current_user_org_role() IN ('org_admin', 'project_manager')
    )
  );

CREATE POLICY pol_projects_delete ON projects
  FOR DELETE USING (
    org_id = current_org_id()
    AND current_user_org_role() = 'org_admin'
  );

-- ------------------------------------------------------------
-- TASKS: project-member-scoped access
-- ------------------------------------------------------------

CREATE POLICY pol_tasks_select ON tasks
  FOR SELECT USING (
    org_id = current_org_id()
    AND deleted_at IS NULL
    AND (
      assignee_id = current_user_id()
      OR reporter_id = current_user_id()
      OR current_user_org_role() IN ('org_admin', 'project_manager')
      OR EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = tasks.project_id AND pm.user_id = current_user_id()
      )
      OR EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = tasks.project_id AND p.visibility = 'org_wide'
      )
    )
  );

CREATE POLICY pol_tasks_insert ON tasks
  FOR INSERT WITH CHECK (
    org_id = current_org_id()
  );

CREATE POLICY pol_tasks_update ON tasks
  FOR UPDATE USING (
    org_id = current_org_id()
    AND deleted_at IS NULL
  );

CREATE POLICY pol_tasks_delete ON tasks
  FOR DELETE USING (
    org_id = current_org_id()
    AND current_user_org_role() IN ('org_admin', 'project_manager')
  );

-- ------------------------------------------------------------
-- COMMENTS: task-visible users can read/write
-- ------------------------------------------------------------

CREATE POLICY pol_comments_select ON comments
  FOR SELECT USING (org_id = current_org_id() AND deleted_at IS NULL);

CREATE POLICY pol_comments_insert ON comments
  FOR INSERT WITH CHECK (org_id = current_org_id());

CREATE POLICY pol_comments_update ON comments
  FOR UPDATE USING (
    org_id = current_org_id()
    AND author_id = current_user_id()
  );

CREATE POLICY pol_comments_delete ON comments
  FOR DELETE USING (
    org_id = current_org_id()
    AND (
      author_id = current_user_id()
      OR current_user_org_role() IN ('org_admin', 'project_manager')
    )
  );

-- ------------------------------------------------------------
-- ACTIVITY LOGS: read-only for members, no direct writes
-- ------------------------------------------------------------

CREATE POLICY pol_activity_select ON activity_logs
  FOR SELECT USING (org_id = current_org_id());

-- No INSERT/UPDATE/DELETE policies — application uses service role for writes

-- ------------------------------------------------------------
-- NOTIFICATIONS: user sees only their own
-- ------------------------------------------------------------

CREATE POLICY pol_notifications_select ON notifications
  FOR SELECT USING (
    org_id = current_org_id()
    AND user_id = current_user_id()
  );

CREATE POLICY pol_notifications_update ON notifications
  FOR UPDATE USING (
    org_id = current_org_id()
    AND user_id = current_user_id()
  );

-- Other tables follow same org_id = current_org_id() pattern
CREATE POLICY pol_sprints_all     ON sprints     FOR ALL USING (org_id = current_org_id());
CREATE POLICY pol_timelogs_all    ON time_logs   FOR ALL USING (org_id = current_org_id());
CREATE POLICY pol_invitations_all ON invitations FOR ALL USING (org_id = current_org_id());
CREATE POLICY pol_ai_logs_all     ON ai_logs     FOR ALL USING (org_id = current_org_id());
CREATE POLICY pol_cfd_all         ON custom_field_definitions FOR ALL USING (org_id = current_org_id());

CREATE POLICY pol_project_members_all ON project_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_members.project_id AND p.org_id = current_org_id()
    )
  );

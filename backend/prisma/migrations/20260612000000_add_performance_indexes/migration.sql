-- Add performance indexes for high-frequency filter fields

-- Task model indexes
CREATE INDEX IF NOT EXISTS "tasks_projectId_idx" ON "tasks"("project_id");
CREATE INDEX IF NOT EXISTS "tasks_milestoneId_idx" ON "tasks"("milestone_id");
CREATE INDEX IF NOT EXISTS "tasks_assigneeId_idx" ON "tasks"("assignee_id");
CREATE INDEX IF NOT EXISTS "tasks_sprintId_idx" ON "tasks"("sprint_id");

-- Comment model indexes
CREATE INDEX IF NOT EXISTS "comments_taskId_idx" ON "comments"("task_id");
CREATE INDEX IF NOT EXISTS "comments_authorId_idx" ON "comments"("author_id");

-- Milestone model indexes
CREATE INDEX IF NOT EXISTS "milestones_projectId_idx" ON "milestones"("project_id");
CREATE INDEX IF NOT EXISTS "milestones_status_idx" ON "milestones"("status");

-- Notification model indexes
CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("user_id");
CREATE INDEX IF NOT EXISTS "notifications_orgId_idx" ON "notifications"("org_id");

-- ActivityLog model indexes
CREATE INDEX IF NOT EXISTS "activity_logs_orgId_idx" ON "activity_logs"("org_id");
CREATE INDEX IF NOT EXISTS "activity_logs_actorId_idx" ON "activity_logs"("actor_id");
CREATE INDEX IF NOT EXISTS "activity_logs_entityId_idx" ON "activity_logs"("entity_id");

-- TimeLog model indexes
CREATE INDEX IF NOT EXISTS "time_logs_taskId_idx" ON "time_logs"("task_id");
CREATE INDEX IF NOT EXISTS "time_logs_userId_idx" ON "time_logs"("user_id");

-- Approval model indexes
CREATE INDEX IF NOT EXISTS "approvals_orgId_idx" ON "approvals"("org_id");
CREATE INDEX IF NOT EXISTS "approvals_status_idx" ON "approvals"("status");
CREATE INDEX IF NOT EXISTS "approvals_relatedProjectId_idx" ON "approvals"("related_project_id");

-- ApprovalStep model indexes
CREATE INDEX IF NOT EXISTS "approval_steps_approvalId_idx" ON "approval_steps"("approval_id");

-- Project model indexes
CREATE INDEX IF NOT EXISTS "projects_orgId_idx" ON "projects"("org_id");
CREATE INDEX IF NOT EXISTS "projects_divisionId_idx" ON "projects"("division_id");
CREATE INDEX IF NOT EXISTS "projects_verticalId_idx" ON "projects"("vertical_id");
CREATE INDEX IF NOT EXISTS "projects_status_idx" ON "projects"("status");
CREATE INDEX IF NOT EXISTS "projects_phase_idx" ON "projects"("phase");

-- Sprint model indexes
CREATE INDEX IF NOT EXISTS "sprints_projectId_idx" ON "sprints"("project_id");

-- EntityVersion model indexes
CREATE INDEX IF NOT EXISTS "entity_versions_entityId_entityType_idx" ON "entity_versions"("entity_id", "entity_type");

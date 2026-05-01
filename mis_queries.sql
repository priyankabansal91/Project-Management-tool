-- =============================================================================
-- MIS (Management Information System) SQL Queries
-- Project Management Tool — PostgreSQL 17
-- Schema: project_mgmt  |  User: postgres  |  Password: 123456
-- =============================================================================
--
-- HOW TO RUN THESE QUERIES
-- ────────────────────────
-- Option 1 — psql CLI:
--   psql -h localhost -U postgres -d project_mgmt -f mis_queries.sql
--   (or paste individual queries interactively after connecting)
--
-- Option 2 — psql connection string:
--   psql "postgresql://postgres:123456@localhost:5432/project_mgmt" -f mis_queries.sql
--
-- Option 3 — Any PostgreSQL client (DBeaver, pgAdmin, TablePlus, DataGrip):
--   Connect with: Host=localhost  Port=5432  DB=project_mgmt  User=postgres  Pass=123456
--   Open this file and execute individual sections or all at once.
--
-- NOTE: Replace :org_id with a literal UUID string when running ad-hoc queries,
--       e.g. WHERE org_id = 'your-org-uuid-here'
--       All queries are scoped by org_id to support multi-tenant isolation.
-- =============================================================================


-- =============================================================================
-- SECTION 1: USER & MEMBER REPORTS
-- =============================================================================

-- 1.1 All active users in org with role, division, and last login
-- Returns every active org member joined with their primary division (if any) and last login timestamp.
SELECT
    u.id                                              AS user_id,
    u.email,
    u.first_name || ' ' || u.last_name               AS full_name,
    u.status                                          AS user_status,
    om.role                                           AS org_role,
    om.is_owner,
    om.joined_at,
    u.last_login_at,
    COALESCE(d.name, 'No Division')                   AS primary_division,
    dm.role                                           AS division_role
FROM org_members om
JOIN users u         ON u.id = om.user_id
LEFT JOIN division_members dm ON dm.user_id = u.id
LEFT JOIN divisions d  ON d.id = dm.division_id AND d.deleted_at IS NULL
WHERE om.org_id        = :org_id
  AND u.status         = 'active'
  AND u.deleted_at     IS NULL
ORDER BY u.last_login_at DESC NULLS LAST;


-- 1.2 User count by status (active / inactive / suspended / pending_verification)
-- Useful for a quick membership health overview.
SELECT
    u.status,
    COUNT(*) AS user_count
FROM org_members om
JOIN users u ON u.id = om.user_id
WHERE om.org_id    = :org_id
  AND u.deleted_at IS NULL
GROUP BY u.status
ORDER BY user_count DESC;


-- 1.3 Users added per month (trend — last 12 months)
-- Shows member-join trend. Useful for growth dashboards.
SELECT
    DATE_TRUNC('month', om.joined_at) AS month,
    COUNT(*)                          AS new_users
FROM org_members om
JOIN users u ON u.id = om.user_id
WHERE om.org_id      = :org_id
  AND om.joined_at   >= NOW() - INTERVAL '12 months'
  AND u.deleted_at   IS NULL
GROUP BY 1
ORDER BY 1;


-- 1.4 Users who have never logged in (last_login_at IS NULL)
-- Helps identify users who accepted invite but never accessed the system.
SELECT
    u.id,
    u.email,
    u.first_name || ' ' || u.last_name AS full_name,
    om.role,
    om.joined_at
FROM org_members om
JOIN users u ON u.id = om.user_id
WHERE om.org_id        = :org_id
  AND u.last_login_at  IS NULL
  AND u.deleted_at     IS NULL
ORDER BY om.joined_at DESC;


-- 1.5 Suspended users with the date they were last updated (proxy for suspension date)
-- The schema stores user status; updatedAt acts as the suspension timestamp.
SELECT
    u.id,
    u.email,
    u.first_name || ' ' || u.last_name AS full_name,
    om.role,
    u.updated_at                        AS suspended_at,
    u.failed_login_count,
    u.locked_until
FROM org_members om
JOIN users u ON u.id = om.user_id
WHERE om.org_id    = :org_id
  AND u.status     = 'suspended'
  AND u.deleted_at IS NULL
ORDER BY u.updated_at DESC;


-- =============================================================================
-- SECTION 2: DIVISION REPORTS
-- =============================================================================

-- 2.1 All divisions with member count, project count, and budget
-- Top-level division metrics for leadership dashboards.
SELECT
    d.id,
    d.name,
    d.code,
    d.is_active,
    d.budget,
    d.head_count,
    COUNT(DISTINCT dm.user_id)  AS actual_member_count,
    COUNT(DISTINCT p.id)        AS project_count,
    COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) AS active_project_count
FROM divisions d
LEFT JOIN division_members dm ON dm.division_id = d.id
LEFT JOIN projects p          ON p.division_id  = d.id AND p.deleted_at IS NULL
WHERE d.org_id     = :org_id
  AND d.deleted_at IS NULL
GROUP BY d.id, d.name, d.code, d.is_active, d.budget, d.head_count
ORDER BY d.display_order, d.name;


-- 2.2 Division hierarchy (recursive CTE — all ancestors + depth)
-- Builds the full org chart tree. Depth 0 = root divisions.
WITH RECURSIVE division_tree AS (
    -- Base case: root divisions (no parent)
    SELECT
        d.id,
        d.name,
        d.parent_id,
        d.code,
        d.is_active,
        0                   AS depth,
        d.name::TEXT        AS path
    FROM divisions d
    WHERE d.org_id     = :org_id
      AND d.parent_id  IS NULL
      AND d.deleted_at IS NULL

    UNION ALL

    -- Recursive case: children
    SELECT
        d.id,
        d.name,
        d.parent_id,
        d.code,
        d.is_active,
        dt.depth + 1,
        (dt.path || ' > ' || d.name)::TEXT
    FROM divisions d
    JOIN division_tree dt ON dt.id = d.parent_id
    WHERE d.deleted_at IS NULL
)
SELECT
    id,
    REPEAT('  ', depth) || name AS indented_name,
    code,
    is_active,
    depth,
    path
FROM division_tree
ORDER BY path;


-- 2.3 All members per division with their role
-- Detailed roster per division for HR / admin review.
SELECT
    d.name  AS division_name,
    d.code  AS division_code,
    u.email,
    u.first_name || ' ' || u.last_name AS full_name,
    u.status                           AS user_status,
    dm.role                            AS division_role,
    dm.created_at                      AS member_since
FROM division_members dm
JOIN divisions d ON d.id = dm.division_id
JOIN users u     ON u.id = dm.user_id
WHERE d.org_id     = :org_id
  AND d.deleted_at IS NULL
  AND u.deleted_at IS NULL
ORDER BY d.name, dm.role, u.last_name;


-- 2.4 Divisions with no active projects
-- Helps identify unused or stalled divisions.
SELECT
    d.id,
    d.name,
    d.code,
    d.is_active,
    d.created_at
FROM divisions d
WHERE d.org_id     = :org_id
  AND d.deleted_at IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM projects p
      WHERE p.division_id = d.id
        AND p.status      = 'active'
        AND p.deleted_at  IS NULL
  )
ORDER BY d.name;


-- 2.5 Cross-division members (users belonging to more than one division)
-- Flags users with dual responsibilities across divisions.
SELECT
    u.id,
    u.email,
    u.first_name || ' ' || u.last_name                     AS full_name,
    COUNT(DISTINCT dm.division_id)                          AS division_count,
    STRING_AGG(d.name || ' (' || dm.role || ')', ', '
               ORDER BY d.name)                             AS divisions
FROM division_members dm
JOIN divisions d ON d.id = dm.division_id AND d.deleted_at IS NULL
JOIN users u     ON u.id = dm.user_id     AND u.deleted_at IS NULL
WHERE d.org_id = :org_id
GROUP BY u.id, u.email, u.first_name, u.last_name
HAVING COUNT(DISTINCT dm.division_id) > 1
ORDER BY division_count DESC, u.last_name;


-- =============================================================================
-- SECTION 3: PROJECT & TASK MIS
-- =============================================================================

-- 3.1 Projects by status per division
-- Count of projects in each status, broken down by division.
SELECT
    COALESCE(d.name, 'No Division') AS division,
    p.status,
    COUNT(*)                        AS project_count
FROM projects p
LEFT JOIN divisions d ON d.id = p.division_id
WHERE p.org_id     = :org_id
  AND p.deleted_at IS NULL
GROUP BY d.name, p.status
ORDER BY d.name, p.status;


-- 3.2 Tasks by priority and status per project
-- Full breakdown of task distribution — useful for workload analysis.
SELECT
    pr.key                        AS project_key,
    pr.name                       AS project_name,
    t.priority,
    t.status_name                 AS status,
    COUNT(*)                      AS task_count
FROM tasks t
JOIN projects pr ON pr.id = t.project_id
WHERE t.org_id     = :org_id
  AND t.deleted_at IS NULL
  AND t.is_archived = FALSE
GROUP BY pr.key, pr.name, t.priority, t.status_name
ORDER BY pr.name, t.priority, t.status_name;


-- 3.3 Overdue tasks (due_date in the past, not yet completed)
-- Critical for project health — shows tasks past their deadline.
SELECT
    pr.key                              AS project_key,
    pr.name                             AS project_name,
    t.id                                AS task_id,
    t.seq_number,
    t.title,
    t.priority,
    t.status_name,
    t.due_date,
    NOW()::DATE - t.due_date::DATE      AS days_overdue,
    u.first_name || ' ' || u.last_name  AS assignee,
    u.email                             AS assignee_email
FROM tasks t
JOIN projects pr   ON pr.id = t.project_id
LEFT JOIN users u  ON u.id  = t.assignee_id
WHERE t.org_id      = :org_id
  AND t.deleted_at  IS NULL
  AND t.is_archived = FALSE
  AND t.due_date    < NOW()
  AND t.completed_at IS NULL
ORDER BY days_overdue DESC, t.priority;


-- 3.4 Task completion rate per project (%)
-- Shows how close each project is to done.
SELECT
    pr.id,
    pr.key,
    pr.name,
    pr.status          AS project_status,
    COUNT(t.id)        AS total_tasks,
    COUNT(t.completed_at) AS completed_tasks,
    ROUND(
        100.0 * COUNT(t.completed_at) / NULLIF(COUNT(t.id), 0), 1
    )                  AS completion_pct
FROM projects pr
LEFT JOIN tasks t ON t.project_id = pr.id
    AND t.deleted_at  IS NULL
    AND t.is_archived = FALSE
WHERE pr.org_id     = :org_id
  AND pr.deleted_at IS NULL
GROUP BY pr.id, pr.key, pr.name, pr.status
ORDER BY completion_pct DESC NULLS LAST;


-- 3.5 Average task resolution time (completed_at - created_at) per project
-- Measures team velocity in days.
SELECT
    pr.key,
    pr.name,
    COUNT(t.id)                            AS completed_tasks,
    ROUND(AVG(
        EXTRACT(EPOCH FROM (t.completed_at - t.created_at)) / 86400.0
    )::NUMERIC, 1)                         AS avg_resolution_days,
    ROUND(MIN(
        EXTRACT(EPOCH FROM (t.completed_at - t.created_at)) / 86400.0
    )::NUMERIC, 1)                         AS min_days,
    ROUND(MAX(
        EXTRACT(EPOCH FROM (t.completed_at - t.created_at)) / 86400.0
    )::NUMERIC, 1)                         AS max_days
FROM tasks t
JOIN projects pr ON pr.id = t.project_id
WHERE t.org_id       = :org_id
  AND t.deleted_at   IS NULL
  AND t.completed_at IS NOT NULL
GROUP BY pr.key, pr.name
ORDER BY avg_resolution_days;


-- 3.6 Open tasks per assignee (workload distribution)
-- Identifies overloaded team members.
SELECT
    u.id,
    u.email,
    u.first_name || ' ' || u.last_name AS full_name,
    COUNT(t.id)                         AS open_tasks,
    COUNT(CASE WHEN t.priority IN ('critical','high') THEN 1 END) AS high_priority_tasks,
    COUNT(CASE WHEN t.due_date < NOW() THEN 1 END)                AS overdue_tasks
FROM tasks t
JOIN users u ON u.id = t.assignee_id
WHERE t.org_id       = :org_id
  AND t.deleted_at   IS NULL
  AND t.is_archived  = FALSE
  AND t.completed_at IS NULL
GROUP BY u.id, u.email, u.first_name, u.last_name
ORDER BY open_tasks DESC;


-- =============================================================================
-- SECTION 4: TIME TRACKING MIS
-- Note: time_logs table is backed by the DB (see schema). Queries below
-- work directly against the time_logs table in PostgreSQL.
-- =============================================================================

-- 4.1 Hours logged per user per month (last 6 months)
-- Monthly time breakdown by user — useful for billing and productivity reports.
SELECT
    u.first_name || ' ' || u.last_name    AS full_name,
    u.email,
    DATE_TRUNC('month', tl.logged_date)   AS month,
    SUM(tl.hours)                          AS total_hours
FROM time_logs tl
JOIN users u ON u.id = tl.user_id
WHERE tl.org_id      = :org_id
  AND tl.logged_date >= NOW() - INTERVAL '6 months'
GROUP BY u.first_name, u.last_name, u.email, DATE_TRUNC('month', tl.logged_date)
ORDER BY month DESC, total_hours DESC;


-- 4.2 Hours logged per project per division (all time)
-- Aggregate time investment by project and division.
SELECT
    COALESCE(d.name, 'No Division')       AS division,
    pr.key                                AS project_key,
    pr.name                               AS project_name,
    pr.status                             AS project_status,
    SUM(tl.hours)                         AS total_hours_logged,
    COUNT(DISTINCT tl.user_id)            AS contributors
FROM time_logs tl
JOIN tasks t    ON t.id  = tl.task_id
JOIN projects pr ON pr.id = t.project_id
LEFT JOIN divisions d ON d.id = pr.division_id
WHERE tl.org_id = :org_id
GROUP BY d.name, pr.key, pr.name, pr.status
ORDER BY total_hours_logged DESC;


-- 4.3 Projects with zero time logged (no effort recorded)
-- Highlights projects that may be stalled or tracked elsewhere.
SELECT
    pr.id,
    pr.key,
    pr.name,
    pr.status,
    pr.created_at
FROM projects pr
WHERE pr.org_id     = :org_id
  AND pr.deleted_at IS NULL
  AND NOT EXISTS (
      SELECT 1
      FROM time_logs tl
      JOIN tasks t ON t.id = tl.task_id
      WHERE t.project_id = pr.id
        AND tl.org_id    = :org_id
  )
ORDER BY pr.created_at DESC;


-- 4.4 Top 10 users by total hours logged (all time)
-- Recognises the most productive contributors.
SELECT
    u.first_name || ' ' || u.last_name AS full_name,
    u.email,
    SUM(tl.hours)                       AS total_hours
FROM time_logs tl
JOIN users u ON u.id = tl.user_id
WHERE tl.org_id = :org_id
GROUP BY u.first_name, u.last_name, u.email
ORDER BY total_hours DESC
LIMIT 10;


-- =============================================================================
-- SECTION 5: APPROVAL MIS
-- =============================================================================

-- 5.1 Pending approvals count by status
-- Quick snapshot of the approval pipeline health.
SELECT
    status,
    COUNT(*) AS count
FROM approvals
WHERE org_id = :org_id
GROUP BY status
ORDER BY count DESC;


-- 5.2 Average approval turnaround time (from created_at to last update for closed approvals)
-- Measures how quickly the org processes approval requests.
SELECT
    ROUND(AVG(
        EXTRACT(EPOCH FROM (a.updated_at - a.created_at)) / 3600.0
    )::NUMERIC, 1) AS avg_hours_to_close,
    MIN(EXTRACT(EPOCH FROM (a.updated_at - a.created_at)) / 3600.0)::INT AS min_hours,
    MAX(EXTRACT(EPOCH FROM (a.updated_at - a.created_at)) / 3600.0)::INT AS max_hours,
    COUNT(*) AS closed_count
FROM approvals a
WHERE a.org_id  = :org_id
  AND a.status IN ('approved', 'rejected');


-- 5.3 Approvals grouped by approver with action breakdown
-- Shows who is processing approvals and what decisions they make.
SELECT
    u.first_name || ' ' || u.last_name AS approver,
    u.email,
    ar.action,
    COUNT(*)                            AS decision_count
FROM approval_records ar
JOIN users u ON u.id = ar.approved_by
JOIN approvals a ON a.id = ar.approval_id AND a.org_id = :org_id
GROUP BY u.first_name, u.last_name, u.email, ar.action
ORDER BY decision_count DESC;


-- 5.4 Rejected approvals with reason and requester
-- Audit trail for failed approvals — useful for compliance.
SELECT
    a.id,
    a.title,
    a.status,
    a.created_at                          AS requested_at,
    req.first_name || ' ' || req.last_name AS requested_by,
    req.email                             AS requester_email,
    arr.step_id,
    u.first_name || ' ' || u.last_name    AS rejected_by,
    arr.reason,
    arr.created_at                        AS rejected_at
FROM approvals a
JOIN users req         ON req.id = a.requested_by
JOIN approval_records arr ON arr.approval_id = a.id AND arr.action = 'rejected'
JOIN users u           ON u.id = arr.approved_by
WHERE a.org_id = :org_id
ORDER BY arr.created_at DESC;


-- =============================================================================
-- SECTION 6: AUDIT & ACTIVITY REPORTS
-- =============================================================================

-- 6.1 All actions in the last 30 days grouped by entity type and action
-- High-level activity summary for the org.
SELECT
    al.entity_type,
    al.action,
    COUNT(*)       AS event_count,
    MIN(al.created_at) AS first_seen,
    MAX(al.created_at) AS last_seen
FROM activity_logs al
WHERE al.org_id      = :org_id
  AND al.created_at >= NOW() - INTERVAL '30 days'
GROUP BY al.entity_type, al.action
ORDER BY event_count DESC;


-- 6.2 Most active users by action count (last 30 days)
-- Identifies power users and potential anomalies.
SELECT
    u.first_name || ' ' || u.last_name AS full_name,
    u.email,
    COUNT(al.id)                        AS action_count,
    COUNT(DISTINCT al.entity_type)      AS entity_types_touched,
    MAX(al.created_at)                  AS last_action_at
FROM activity_logs al
JOIN users u ON u.id = al.actor_id
WHERE al.org_id      = :org_id
  AND al.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.first_name, u.last_name, u.email
ORDER BY action_count DESC
LIMIT 20;


-- 6.3 Recent configuration changes (action = 'config_changed')
-- Critical for security and change management audits.
SELECT
    al.id,
    al.created_at,
    COALESCE(u.first_name || ' ' || u.last_name, 'System') AS actor,
    u.email                                                  AS actor_email,
    al.entity_type,
    al.entity_id,
    al.old_value,
    al.new_value,
    al.diff,
    al.ip_address
FROM activity_logs al
LEFT JOIN users u ON u.id = al.actor_id
WHERE al.org_id  = :org_id
  AND al.action  = 'config_changed'
ORDER BY al.created_at DESC
LIMIT 200;


-- 6.4 Failed login attempts
-- NOTE: The current schema stores failed_login_count on the users table rather
-- than individual login attempt events in activity_logs. Use the query below
-- to identify accounts with elevated failure counts. For per-attempt event
-- logging, add a 'login_failed' action to the activity_logs write path.
SELECT
    u.id,
    u.email,
    u.first_name || ' ' || u.last_name AS full_name,
    u.failed_login_count,
    u.locked_until,
    u.last_login_at,
    u.status
FROM users u
JOIN org_members om ON om.user_id = u.id AND om.org_id = :org_id
WHERE u.failed_login_count > 0
  AND u.deleted_at IS NULL
ORDER BY u.failed_login_count DESC;


-- 6.5 Role change audit trail
-- Tracks all role_changed and member_added events with before/after values.
SELECT
    al.id,
    al.created_at,
    COALESCE(actor.first_name || ' ' || actor.last_name, 'System') AS actor,
    actor.email                                                       AS actor_email,
    al.entity_type,
    al.entity_id,
    al.action,
    al.old_value,
    al.new_value,
    al.ip_address
FROM activity_logs al
LEFT JOIN users actor ON actor.id = al.actor_id
WHERE al.org_id = :org_id
  AND al.action IN ('role_changed', 'member_added', 'member_removed', 'permission_changed')
ORDER BY al.created_at DESC;


-- =============================================================================
-- SECTION 7: PERFORMANCE & HEALTH KPIs
-- =============================================================================

-- 7.1 Sprint velocity — tasks completed per sprint (last 10 sprints)
-- Core agile metric: how much work each sprint delivered.
SELECT
    pr.key                                              AS project_key,
    pr.name                                             AS project_name,
    s.id                                                AS sprint_id,
    s.name                                              AS sprint_name,
    s.status                                            AS sprint_status,
    s.start_date,
    s.end_date,
    COUNT(t.id)                                         AS total_tasks_in_sprint,
    COUNT(t.completed_at)                               AS completed_tasks,
    ROUND(100.0 * COUNT(t.completed_at) / NULLIF(COUNT(t.id), 0), 1) AS velocity_pct,
    ROUND(SUM(COALESCE(t.estimated_hours, 0))::NUMERIC, 1) AS estimated_hours,
    ROUND(SUM(t.logged_hours)::NUMERIC, 1)              AS actual_hours
FROM sprints s
JOIN projects pr ON pr.id = s.project_id
LEFT JOIN tasks t ON t.sprint_id = s.id
    AND t.deleted_at  IS NULL
    AND t.is_archived = FALSE
WHERE s.org_id = :org_id
GROUP BY pr.key, pr.name, s.id, s.name, s.status, s.start_date, s.end_date
ORDER BY s.end_date DESC NULLS LAST
LIMIT 10;


-- 7.2 Project health score — on_time vs overdue task ratio
-- A quick RAG (Red/Amber/Green) health indicator per project.
-- Green ≥ 80%, Amber 50–79%, Red < 50%.
SELECT
    pr.id,
    pr.key,
    pr.name,
    pr.status,
    COALESCE(d.name, 'No Division')                             AS division,
    COUNT(t.id)                                                  AS total_tasks,
    COUNT(t.completed_at)                                        AS completed,
    COUNT(CASE WHEN t.due_date < NOW() AND t.completed_at IS NULL THEN 1 END) AS overdue,
    COUNT(CASE WHEN t.due_date >= NOW() OR t.due_date IS NULL THEN 1 END)
        - COUNT(t.completed_at)                                  AS in_progress_on_time,
    ROUND(
        100.0 * COUNT(t.completed_at) / NULLIF(COUNT(t.id), 0), 1
    )                                                            AS completion_pct,
    CASE
        WHEN ROUND(100.0 * COUNT(t.completed_at) / NULLIF(COUNT(t.id), 0), 1) >= 80 THEN 'GREEN'
        WHEN ROUND(100.0 * COUNT(t.completed_at) / NULLIF(COUNT(t.id), 0), 1) >= 50 THEN 'AMBER'
        ELSE 'RED'
    END                                                          AS health
FROM projects pr
LEFT JOIN divisions d ON d.id = pr.division_id
LEFT JOIN tasks t ON t.project_id = pr.id
    AND t.deleted_at  IS NULL
    AND t.is_archived = FALSE
WHERE pr.org_id     = :org_id
  AND pr.deleted_at IS NULL
  AND pr.status     = 'active'
GROUP BY pr.id, pr.key, pr.name, pr.status, d.name
ORDER BY health, completion_pct;


-- 7.3 Member activity score (tasks created + comments posted + hours logged)
-- Composite engagement metric per org member for the last 30 days.
SELECT
    u.id,
    u.email,
    u.first_name || ' ' || u.last_name                           AS full_name,
    om.role,
    COALESCE(tc.tasks_created, 0)                                 AS tasks_created,
    COALESCE(cc.comments_posted, 0)                               AS comments_posted,
    COALESCE(tl.hours_logged, 0)                                  AS hours_logged,
    -- Weighted composite score: tasks*3 + comments*1 + hours*2
    (COALESCE(tc.tasks_created, 0) * 3
     + COALESCE(cc.comments_posted, 0)
     + COALESCE(tl.hours_logged, 0) * 2)                         AS activity_score
FROM org_members om
JOIN users u ON u.id = om.user_id AND u.deleted_at IS NULL
-- Tasks created in last 30 days
LEFT JOIN (
    SELECT created_by AS user_id, COUNT(*) AS tasks_created
    FROM tasks
    WHERE org_id     = :org_id
      AND created_at >= NOW() - INTERVAL '30 days'
      AND deleted_at IS NULL
    GROUP BY created_by
) tc ON tc.user_id = u.id
-- Comments in last 30 days
LEFT JOIN (
    SELECT author_id AS user_id, COUNT(*) AS comments_posted
    FROM comments
    WHERE org_id     = :org_id
      AND created_at >= NOW() - INTERVAL '30 days'
      AND deleted_at IS NULL
    GROUP BY author_id
) cc ON cc.user_id = u.id
-- Hours logged in last 30 days
LEFT JOIN (
    SELECT user_id, ROUND(SUM(hours)::NUMERIC, 1) AS hours_logged
    FROM time_logs
    WHERE org_id      = :org_id
      AND logged_date >= NOW() - INTERVAL '30 days'
    GROUP BY user_id
) tl ON tl.user_id = u.id
WHERE om.org_id = :org_id
ORDER BY activity_score DESC;

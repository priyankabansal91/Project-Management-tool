-- ============================================================
-- Sample Data: 2 Organizations, Users, Projects, Tasks
-- ============================================================
-- NOTE: Run schema.sql + indexes.sql first.
-- Passwords are bcrypt of 'Password123!' for all demo users.
-- ============================================================

BEGIN;

-- ============================================================
-- ORGANIZATIONS
-- ============================================================

INSERT INTO organizations (id, name, slug, domain, plan, max_members, max_projects, is_active, settings)
VALUES
(
  'a1b2c3d4-0001-0000-0000-000000000001',
  'Acme Corporation',
  'acme-corp',
  'acme.com',
  'professional',
  50,
  20,
  TRUE,
  '{
    "theme": "light",
    "timezone": "America/New_York",
    "date_format": "MM/DD/YYYY",
    "week_starts": "monday",
    "allow_guest_access": false,
    "require_task_estimates": true
  }'
),
(
  'a1b2c3d4-0002-0000-0000-000000000002',
  'GlobalTech Solutions',
  'globaltech',
  'globaltech.io',
  'enterprise',
  200,
  100,
  TRUE,
  '{
    "theme": "dark",
    "timezone": "Europe/London",
    "date_format": "DD/MM/YYYY",
    "week_starts": "sunday",
    "allow_guest_access": true,
    "require_task_estimates": false
  }'
);

-- ============================================================
-- USERS
-- ============================================================

INSERT INTO users (id, email, email_verified_at, password_hash, first_name, last_name, status, timezone)
VALUES
-- Acme users
(
  'u0000001-0000-0000-0000-000000000001',
  'alice.admin@acme.com',
  NOW(),
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9LJOe0nHhS',
  'Alice', 'Chen', 'active', 'America/New_York'
),
(
  'u0000001-0000-0000-0000-000000000002',
  'bob.pm@acme.com',
  NOW(),
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9LJOe0nHhS',
  'Bob', 'Martinez', 'active', 'America/Chicago'
),
(
  'u0000001-0000-0000-0000-000000000003',
  'carol.dev@acme.com',
  NOW(),
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9LJOe0nHhS',
  'Carol', 'Johnson', 'active', 'America/Los_Angeles'
),
(
  'u0000001-0000-0000-0000-000000000004',
  'david.dev@acme.com',
  NOW(),
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9LJOe0nHhS',
  'David', 'Park', 'active', 'America/New_York'
),
-- GlobalTech users
(
  'u0000002-0000-0000-0000-000000000001',
  'emma.admin@globaltech.io',
  NOW(),
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9LJOe0nHhS',
  'Emma', 'Wilson', 'active', 'Europe/London'
),
(
  'u0000002-0000-0000-0000-000000000002',
  'frank.pm@globaltech.io',
  NOW(),
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9LJOe0nHhS',
  'Frank', 'Brown', 'active', 'Europe/Berlin'
),
(
  'u0000002-0000-0000-0000-000000000003',
  'grace.dev@globaltech.io',
  NOW(),
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9LJOe0nHhS',
  'Grace', 'Taylor', 'active', 'Asia/Singapore'
);

-- ============================================================
-- ORG MEMBERS
-- ============================================================

INSERT INTO org_members (org_id, user_id, role, is_owner)
VALUES
-- Acme
('a1b2c3d4-0001-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000001', 'org_admin', TRUE),
('a1b2c3d4-0001-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000002', 'project_manager', FALSE),
('a1b2c3d4-0001-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000003', 'member', FALSE),
('a1b2c3d4-0001-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000004', 'member', FALSE),
-- GlobalTech
('a1b2c3d4-0002-0000-0000-000000000002', 'u0000002-0000-0000-0000-000000000001', 'org_admin', TRUE),
('a1b2c3d4-0002-0000-0000-000000000002', 'u0000002-0000-0000-0000-000000000002', 'project_manager', FALSE),
('a1b2c3d4-0002-0000-0000-000000000002', 'u0000002-0000-0000-0000-000000000003', 'member', FALSE);

-- ============================================================
-- WORKFLOW CONFIGS
-- ============================================================

INSERT INTO workflow_configs (id, org_id, name, is_default, statuses, transitions, created_by)
VALUES
(
  'wf000001-0000-0000-0000-000000000001',
  'a1b2c3d4-0001-0000-0000-000000000001',
  'Default Kanban',
  TRUE,
  '[
    {"id":"s1","name":"Backlog","color":"#6B7280","is_initial":true,"is_final":false,"order":1},
    {"id":"s2","name":"To Do","color":"#3B82F6","is_initial":false,"is_final":false,"order":2},
    {"id":"s3","name":"In Progress","color":"#F59E0B","is_initial":false,"is_final":false,"order":3},
    {"id":"s4","name":"In Review","color":"#8B5CF6","is_initial":false,"is_final":false,"order":4},
    {"id":"s5","name":"Done","color":"#10B981","is_initial":false,"is_final":true,"order":5},
    {"id":"s6","name":"Cancelled","color":"#EF4444","is_initial":false,"is_final":true,"order":6}
  ]',
  '[
    {"from":"s1","to":["s2","s6"]},
    {"from":"s2","to":["s3","s6"]},
    {"from":"s3","to":["s2","s4","s6"]},
    {"from":"s4","to":["s3","s5","s6"]},
    {"from":"s5","to":["s3"]},
    {"from":"s6","to":["s2"]}
  ]',
  'u0000001-0000-0000-0000-000000000001'
),
(
  'wf000001-0000-0000-0000-000000000002',
  'a1b2c3d4-0001-0000-0000-000000000001',
  'Agile Scrum',
  FALSE,
  '[
    {"id":"a1","name":"Product Backlog","color":"#6B7280","is_initial":true,"is_final":false,"order":1},
    {"id":"a2","name":"Sprint Backlog","color":"#3B82F6","is_initial":false,"is_final":false,"order":2},
    {"id":"a3","name":"In Sprint","color":"#F59E0B","is_initial":false,"is_final":false,"order":3},
    {"id":"a4","name":"Testing","color":"#8B5CF6","is_initial":false,"is_final":false,"order":4},
    {"id":"a5","name":"Accepted","color":"#10B981","is_initial":false,"is_final":true,"order":5}
  ]',
  '[
    {"from":"a1","to":["a2"]},
    {"from":"a2","to":["a3","a1"]},
    {"from":"a3","to":["a4","a2"]},
    {"from":"a4","to":["a5","a3"]},
    {"from":"a5","to":["a3"]}
  ]',
  'u0000001-0000-0000-0000-000000000001'
),
(
  'wf000002-0000-0000-0000-000000000001',
  'a1b2c3d4-0002-0000-0000-000000000002',
  'GlobalTech DevOps',
  TRUE,
  '[
    {"id":"g1","name":"New","color":"#6B7280","is_initial":true,"is_final":false,"order":1},
    {"id":"g2","name":"Grooming","color":"#06B6D4","is_initial":false,"is_final":false,"order":2},
    {"id":"g3","name":"Ready","color":"#3B82F6","is_initial":false,"is_final":false,"order":3},
    {"id":"g4","name":"Active","color":"#F59E0B","is_initial":false,"is_final":false,"order":4},
    {"id":"g5","name":"Code Review","color":"#8B5CF6","is_initial":false,"is_final":false,"order":5},
    {"id":"g6","name":"QA","color":"#EC4899","is_initial":false,"is_final":false,"order":6},
    {"id":"g7","name":"Released","color":"#10B981","is_initial":false,"is_final":true,"order":7}
  ]',
  '[
    {"from":"g1","to":["g2","g3"]},
    {"from":"g2","to":["g3","g1"]},
    {"from":"g3","to":["g4"]},
    {"from":"g4","to":["g3","g5"]},
    {"from":"g5","to":["g4","g6"]},
    {"from":"g6","to":["g5","g7"]},
    {"from":"g7","to":["g4"]}
  ]',
  'u0000002-0000-0000-0000-000000000001'
);

-- ============================================================
-- CUSTOM FIELD DEFINITIONS (Acme)
-- ============================================================

INSERT INTO custom_field_definitions (org_id, name, field_key, field_type, options, is_required, applies_to, display_order, created_by)
VALUES
(
  'a1b2c3d4-0001-0000-0000-000000000001',
  'Story Points', 'story_points', 'number',
  '{"min": 0, "max": 100, "default": null}',
  FALSE, 'task', 1, 'u0000001-0000-0000-0000-000000000001'
),
(
  'a1b2c3d4-0001-0000-0000-000000000001',
  'Epic', 'epic', 'select',
  '{"choices": ["Authentication", "Dashboard", "Reporting", "API", "Mobile"], "default": null}',
  FALSE, 'task', 2, 'u0000001-0000-0000-0000-000000000001'
),
(
  'a1b2c3d4-0001-0000-0000-000000000001',
  'Risk Level', 'risk_level', 'select',
  '{"choices": ["Low", "Medium", "High", "Critical"], "default": "Low"}',
  TRUE, 'project', 3, 'u0000001-0000-0000-0000-000000000001'
);

-- ============================================================
-- PROJECTS
-- ============================================================

INSERT INTO projects (id, org_id, name, description, key, status, visibility, color, owner_id, workflow_config_id, start_date, due_date, created_by)
VALUES
(
  'proj0001-0000-0000-0000-000000000001',
  'a1b2c3d4-0001-0000-0000-000000000001',
  'Customer Portal Redesign',
  'Complete redesign of the customer-facing portal with improved UX and performance.',
  'CPR',
  'active',
  'org_wide',
  '#3B82F6',
  'u0000001-0000-0000-0000-000000000002',
  'wf000001-0000-0000-0000-000000000001',
  '2026-01-01',
  '2026-06-30',
  'u0000001-0000-0000-0000-000000000001'
),
(
  'proj0001-0000-0000-0000-000000000002',
  'a1b2c3d4-0001-0000-0000-000000000001',
  'API Gateway Migration',
  'Migrate from legacy REST to GraphQL + tRPC hybrid gateway.',
  'AGM',
  'active',
  'private',
  '#8B5CF6',
  'u0000001-0000-0000-0000-000000000002',
  'wf000001-0000-0000-0000-000000000002',
  '2026-02-01',
  '2026-08-31',
  'u0000001-0000-0000-0000-000000000001'
),
(
  'proj0002-0000-0000-0000-000000000001',
  'a1b2c3d4-0002-0000-0000-000000000002',
  'Platform Observability Stack',
  'Implement distributed tracing, metrics dashboards, and alerting across all microservices.',
  'OBS',
  'active',
  'org_wide',
  '#10B981',
  'u0000002-0000-0000-0000-000000000002',
  'wf000002-0000-0000-0000-000000000001',
  '2026-01-15',
  '2026-05-31',
  'u0000002-0000-0000-0000-000000000001'
);

-- Sequence initialization
INSERT INTO task_sequences (project_id, last_seq) VALUES
  ('proj0001-0000-0000-0000-000000000001', 0),
  ('proj0001-0000-0000-0000-000000000002', 0),
  ('proj0002-0000-0000-0000-000000000001', 0);

-- ============================================================
-- PROJECT MEMBERS
-- ============================================================

INSERT INTO project_members (project_id, user_id, role)
VALUES
('proj0001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000001', 'org_admin'),
('proj0001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000002', 'project_manager'),
('proj0001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000003', 'member'),
('proj0001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000004', 'member'),
('proj0001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000002', 'project_manager'),
('proj0001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000003', 'member'),
('proj0002-0000-0000-0000-000000000001', 'u0000002-0000-0000-0000-000000000001', 'org_admin'),
('proj0002-0000-0000-0000-000000000001', 'u0000002-0000-0000-0000-000000000002', 'project_manager'),
('proj0002-0000-0000-0000-000000000001', 'u0000002-0000-0000-0000-000000000003', 'member');

-- ============================================================
-- TASKS (CPR project)
-- ============================================================

INSERT INTO tasks (id, org_id, project_id, seq_number, title, description, status_id, status_name, priority, assignee_id, reporter_id, due_date, estimated_hours, position, tags, created_by)
VALUES
(
  'task0001-0001-0000-0000-000000000001',
  'a1b2c3d4-0001-0000-0000-000000000001',
  'proj0001-0000-0000-0000-000000000001',
  1,
  'Design new navigation component',
  '## Overview\nCreate a responsive navigation component with mobile drawer and desktop mega-menu.\n\n## Acceptance Criteria\n- [ ] Mobile: hamburger drawer opens smoothly\n- [ ] Desktop: mega-menu with hover states\n- [ ] Keyboard navigation accessible\n- [ ] Unit tests pass',
  's3', 'In Progress', 'high',
  'u0000001-0000-0000-0000-000000000003',
  'u0000001-0000-0000-0000-000000000002',
  '2026-02-15', 8.0, 10.0, ARRAY['frontend', 'design'],
  'u0000001-0000-0000-0000-000000000002'
),
(
  'task0001-0001-0000-0000-000000000002',
  'a1b2c3d4-0001-0000-0000-000000000001',
  'proj0001-0000-0000-0000-000000000001',
  2,
  'Implement authentication flow',
  '## Overview\nImplement JWT-based auth with refresh token rotation.\n\n## Tasks\n- Login form with validation\n- Register form\n- Password reset flow\n- SSO integration (Google)',
  's2', 'To Do', 'critical',
  'u0000001-0000-0000-0000-000000000004',
  'u0000001-0000-0000-0000-000000000002',
  '2026-02-20', 16.0, 20.0, ARRAY['backend', 'auth'],
  'u0000001-0000-0000-0000-000000000002'
),
(
  'task0001-0001-0000-0000-000000000003',
  'a1b2c3d4-0001-0000-0000-000000000001',
  'proj0001-0000-0000-0000-000000000001',
  3,
  'Customer dashboard wireframes',
  'Create high-fidelity wireframes for the customer dashboard.',
  's5', 'Done', 'medium',
  'u0000001-0000-0000-0000-000000000003',
  'u0000001-0000-0000-0000-000000000002',
  '2026-01-30', 4.0, 30.0, ARRAY['design', 'ux'],
  'u0000001-0000-0000-0000-000000000002'
),
(
  'task0001-0001-0000-0000-000000000004',
  'a1b2c3d4-0001-0000-0000-000000000001',
  'proj0001-0000-0000-0000-000000000001',
  4,
  'Set up CI/CD pipeline',
  'Configure GitHub Actions for automated testing and deployment.',
  's4', 'In Review', 'high',
  'u0000001-0000-0000-0000-000000000004',
  'u0000001-0000-0000-0000-000000000001',
  '2026-02-10', 6.0, 40.0, ARRAY['devops'],
  'u0000001-0000-0000-0000-000000000001'
),
-- Subtask
(
  'task0001-0001-0000-0000-000000000005',
  'a1b2c3d4-0001-0000-0000-000000000001',
  'proj0001-0000-0000-0000-000000000001',
  5,
  'Add Google OAuth provider',
  'Integrate Google OAuth2 as SSO option on login page.',
  's3', 'In Progress', 'high',
  'u0000001-0000-0000-0000-000000000004',
  'u0000001-0000-0000-0000-000000000002',
  '2026-02-18', 4.0, 21.0, ARRAY['backend', 'auth'],
  'u0000001-0000-0000-0000-000000000002'
),
-- GlobalTech tasks
(
  'task0002-0001-0000-0000-000000000001',
  'a1b2c3d4-0002-0000-0000-000000000002',
  'proj0002-0000-0000-0000-000000000001',
  1,
  'Deploy Prometheus + Grafana stack',
  'Set up Prometheus metrics collection and Grafana dashboards for all services.',
  'g4', 'Active', 'critical',
  'u0000002-0000-0000-0000-000000000003',
  'u0000002-0000-0000-0000-000000000002',
  '2026-02-28', 12.0, 10.0, ARRAY['infra', 'monitoring'],
  'u0000002-0000-0000-0000-000000000002'
),
(
  'task0002-0001-0000-0000-000000000002',
  'a1b2c3d4-0002-0000-0000-000000000002',
  'proj0002-0000-0000-0000-000000000001',
  2,
  'Instrument all API services with OpenTelemetry',
  'Add distributed tracing spans to all 12 microservices.',
  'g3', 'Ready', 'high',
  'u0000002-0000-0000-0000-000000000003',
  'u0000002-0000-0000-0000-000000000002',
  '2026-03-15', 20.0, 20.0, ARRAY['backend', 'observability'],
  'u0000002-0000-0000-0000-000000000002'
);

-- Update seq
UPDATE task_sequences SET last_seq = 5 WHERE project_id = 'proj0001-0000-0000-0000-000000000001';
UPDATE task_sequences SET last_seq = 2 WHERE project_id = 'proj0002-0000-0000-0000-000000000001';

-- ============================================================
-- COMMENTS
-- ============================================================

INSERT INTO comments (org_id, task_id, author_id, body)
VALUES
(
  'a1b2c3d4-0001-0000-0000-000000000001',
  'task0001-0001-0000-0000-000000000001',
  'u0000001-0000-0000-0000-000000000002',
  'Great progress on the nav component! Please make sure to test in Safari as well — there were some animation issues in the previous iteration.'
),
(
  'a1b2c3d4-0001-0000-0000-000000000001',
  'task0001-0001-0000-0000-000000000001',
  'u0000001-0000-0000-0000-000000000003',
  '@bob.pm Confirmed Safari issues are fixed. Added test in Playwright cross-browser suite. Ready for review soon.'
),
(
  'a1b2c3d4-0002-0000-0000-000000000002',
  'task0002-0001-0000-0000-000000000001',
  'u0000002-0000-0000-0000-000000000002',
  'Prometheus stack is 80% deployed. Waiting on firewall rules for port 9090 — raised ticket with infra team.'
);

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================

INSERT INTO activity_logs (org_id, actor_id, entity_type, entity_id, action, new_value)
VALUES
(
  'a1b2c3d4-0001-0000-0000-000000000001',
  'u0000001-0000-0000-0000-000000000001',
  'project', 'proj0001-0000-0000-0000-000000000001',
  'created',
  '{"name": "Customer Portal Redesign", "key": "CPR"}'
),
(
  'a1b2c3d4-0001-0000-0000-000000000001',
  'u0000001-0000-0000-0000-000000000002',
  'task', 'task0001-0001-0000-0000-000000000001',
  'created',
  '{"title": "Design new navigation component", "priority": "high"}'
),
(
  'a1b2c3d4-0001-0000-0000-000000000001',
  'u0000001-0000-0000-0000-000000000003',
  'task', 'task0001-0001-0000-0000-000000000001',
  'status_changed',
  '{"from": "To Do", "to": "In Progress"}'
),
(
  'a1b2c3d4-0001-0000-0000-000000000001',
  'u0000001-0000-0000-0000-000000000003',
  'task', 'task0001-0001-0000-0000-000000000003',
  'status_changed',
  '{"from": "In Review", "to": "Done"}'
),
(
  'a1b2c3d4-0002-0000-0000-000000000002',
  'u0000002-0000-0000-0000-000000000001',
  'project', 'proj0002-0000-0000-0000-000000000001',
  'created',
  '{"name": "Platform Observability Stack", "key": "OBS"}'
);

COMMIT;

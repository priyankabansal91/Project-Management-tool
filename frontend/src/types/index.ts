export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  first_name?: string;
  last_name?: string;
  avatar_url: string | null;
  timezone?: string;
  current_org_id?: string;
  current_role?: OrgRole;
  organizations?: OrgMembership[];
}

export type OrgRole = 'org_admin' | 'division_admin' | 'vertical_head' | 'project_manager' | 'team_lead' | 'member' | 'viewer' | 'executive';

export interface OrgMembership {
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: OrgRole;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  max_members: number;
  max_projects: number;
  settings: Record<string, unknown>;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string | null;
  status: 'active' | 'archived' | 'completed' | 'on_hold';
  visibility: 'private' | 'org_wide' | 'public';
  color: string;
  owner_id: string;
  start_date: string | null;
  due_date: string | null;
  member_count: number;
  task_count: number;
  members: ProjectMember[];
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  name: string;
  avatar_url: string | null;
  role: OrgRole;
}

export interface Task {
  id: string;
  seq_number: number;
  task_key: string;
  title: string;
  description: string | null;
  status_id: string | null;
  status_name: string | null;
  priority: TaskPriority;
  assignee: { id: string; name: string; avatar_url: string | null } | null;
  reporter: { id: string; name: string } | null;
  due_date: string | null;
  start_date: string | null;
  estimated_hours: number | null;
  logged_hours: number;
  tags: string[];
  custom_fields: Record<string, unknown>;
  position: number;
  comment_count: number;
  subtask_count: number;
  is_archived: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  project?: { id: string; name: string; key: string; color: string };
}

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low' | 'none';

export interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  tasks: Task[];
}

export interface Comment {
  id: string;
  author: { id: string; name: string; avatar_url: string | null };
  body: string;
  is_edited: boolean;
  created_at: string;
  replies: Comment[];
}

export interface WorkflowConfig {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  statuses: WorkflowStatus[];
  transitions: WorkflowTransition[];
  created_at: string;
}

export interface WorkflowStatus {
  id: string;
  name: string;
  color: string;
  is_initial: boolean;
  is_final: boolean;
  order: number;
}

export interface WorkflowTransition {
  from: string;
  to: string[];
}

export interface OrgMemberItem {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  role: OrgRole;
  is_owner: boolean;
  status: string;
  joined_at: string;
  last_login_at: string | null;
}

export interface DashboardData {
  stats: {
    total_projects: number;
    active_projects: number;
    total_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
    my_open_tasks: number;
  };
  project_progress: {
    project_id: string;
    name: string;
    key: string;
    color: string;
    total_tasks: number;
    completed_tasks: number;
    completion_pct: number;
  }[];
  recent_activity: {
    actor: string;
    action: string;
    entity_type: string;
    entity_id: string;
    detail: unknown;
    at: string;
  }[];
  team_workload: {
    user_id: string;
    name: string;
    avatar_url: string | null;
    role: string;
    open_tasks: number;
    high_priority: number;
    overdue_tasks: number;
    estimated_hours: number;
  }[];
}

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string; details?: unknown[] };
}

export interface Vertical {
  id: string;
  name: string;
  description: string | null;
  division_id: string;
  head_id: string | null;
  head_name: string | null;
  color: string;
  member_count: number;
  project_count: number;
  status: 'active' | 'inactive';
  created_at: string;
}

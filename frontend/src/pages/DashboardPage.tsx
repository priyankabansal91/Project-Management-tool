import { useNavigate } from 'react-router-dom';
import { FolderKanban, CheckSquare, AlertTriangle, ListTodo, Clock, TrendingUp, Users, Zap, BarChart3, Shield } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { cn, timeAgo, priorityColor } from '@/lib/utils';
import { useDashboard } from '@/api/hooks';

const mockStats = {
  total_projects: 5, active_projects: 3, total_tasks: 47, completed_tasks: 18, overdue_tasks: 3, my_open_tasks: 8,
};

const mockProjectProgress = [
  { project_id: '1', name: 'Customer Portal Redesign', key: 'CPR', color: '#3B82F6', total_tasks: 15, completed_tasks: 7, completion_pct: 46.7 },
  { project_id: '2', name: 'API Gateway Migration',    key: 'AGM', color: '#8B5CF6', total_tasks: 12, completed_tasks: 3, completion_pct: 25.0 },
  { project_id: '3', name: 'Mobile App v2',            key: 'MAV2',color: '#F59E0B', total_tasks: 20, completed_tasks: 8, completion_pct: 40.0 },
];

const mockActivity = [
  { actor: 'Carol Johnson', action: 'status_changed', entity: 'CPR-1', detail: 'In Progress → In Review', at: new Date(Date.now() - 3600000).toISOString() },
  { actor: 'David Park',    action: 'created',        entity: 'AGM-5', detail: 'Created new task',        at: new Date(Date.now() - 7200000).toISOString() },
  { actor: 'Bob Martinez',  action: 'commented',      entity: 'CPR-3', detail: 'Left a comment',          at: new Date(Date.now() - 14400000).toISOString() },
  { actor: 'Alice Chen',    action: 'assigned',        entity: 'MAV2-2',detail: 'Assigned to Carol',      at: new Date(Date.now() - 28800000).toISOString() },
];

const mockTeamWorkload = [
  { user_id: '1', name: 'Carol Johnson', role: 'member',          open_tasks: 6, high_priority: 2, overdue_tasks: 1, estimated_hours: 24 },
  { user_id: '2', name: 'David Park',    role: 'member',          open_tasks: 5, high_priority: 1, overdue_tasks: 0, estimated_hours: 18 },
  { user_id: '3', name: 'Bob Martinez',  role: 'project_manager', open_tasks: 3, high_priority: 1, overdue_tasks: 1, estimated_hours: 12 },
];

const ROLE_LABEL: Record<string, string> = {
  org_admin: 'System Admin', division_admin: 'Division Admin',
  vertical_head: 'Vertical Head', team_lead: 'Team Lead',
  project_manager: 'Project Lead', member: 'Project Team Member',
  executive: 'Leadership', viewer: 'Others',
};

function safeDetail(detail: unknown): string {
  if (detail == null) return '';
  if (typeof detail === 'string') return detail;
  if (typeof detail === 'number' || typeof detail === 'boolean') return String(detail);
  if (typeof detail === 'object') {
    const d = detail as Record<string, unknown>;
    if (d.from !== undefined && d.to !== undefined) return `${d.from} → ${d.to}`;
    if (d.value !== undefined) return String(d.value);
    if (d.name) return `assigned to ${d.name}`;
    if (d.status) return String(d.status);
    if (d.title) return String(d.title);
    return Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(', ');
  }
  return '';
}

// ─── Role-specific section components ────────────────────────────────────────

function OrgAdminSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div className="space-y-4">
      {/* Organization Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Organization Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 p-4 text-center">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">8</p>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">Boards / Divisions Active</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 p-4 text-center">
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">47</p>
              <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">Projects Running</p>
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/30 p-4 text-center">
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">12</p>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mt-1">Pending Approvals</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/divisions')}>
              <Users className="h-4 w-4 mr-2" /> Add Division
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/users')}>
              <Users className="h-4 w-4 mr-2" /> Invite Users
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/audit-log')}>
              <Shield className="h-4 w-4 mr-2" /> View Audit Log
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/feature-flags')}>
              <Zap className="h-4 w-4 mr-2" /> Feature Flags
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DivisionAdminSection() {
  const verticals = [
    { name: 'Development Team', pct: 72, color: '#3B82F6' },
    { name: 'QA Team',          pct: 58, color: '#10B981' },
    { name: 'Finance Team',     pct: 85, color: '#F59E0B' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Board Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {verticals.map((v) => (
            <div key={v.name} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{v.name}</span>
                <span className="text-sm font-bold" style={{ color: v.color }}>{v.pct}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${v.pct}%`, backgroundColor: v.color }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{v.pct}% of tasks completed</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function VerticalHeadSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const topTasks = [
    { id: 'CPR-4', title: 'Finalize design mockups', priority: 'high',   due: 'Today' },
    { id: 'AGM-2', title: 'API endpoint documentation', priority: 'medium', due: 'Tomorrow' },
    { id: 'CPR-7', title: 'Review test cases',         priority: 'low',  due: 'Friday' },
  ];

  const priorityBadgeClass: Record<string, string> = {
    high:   'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-orange-100 text-orange-700 border-orange-200',
    low:    'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Vertical summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> My Vertical Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <p className="font-semibold text-sm">Development Team</p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span><span className="font-bold text-foreground">8</span> Members</span>
              <span><span className="font-bold text-foreground">3</span> Active Projects</span>
            </div>
          </div>

          {/* Capacity gauge */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Capacity Utilized</span>
              <span className="font-bold text-orange-600">75%</span>
            </div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-orange-500 transition-all duration-500" style={{ width: '75%' }} />
            </div>
            <p className="text-xs text-muted-foreground">6 of 8 members near capacity</p>
          </div>
        </CardContent>
      </Card>

      {/* Top tasks this week */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-primary" /> Top Tasks This Week
          </CardTitle>
          <button
            onClick={() => navigate('/my-tasks')}
            className="text-xs text-primary hover:underline font-medium"
          >
            View all →
          </button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topTasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 border hover:bg-muted/40 cursor-pointer transition-colors"
                onClick={() => navigate('/my-tasks')}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="text-xs shrink-0">{t.id}</Badge>
                  <span className="text-sm truncate">{t.title}</span>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', priorityBadgeClass[t.priority])}>
                    {t.priority}
                  </span>
                  <span className="text-xs text-muted-foreground">{t.due}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SprintStatusSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" /> Sprint Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Active sprint */}
          <div
            className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 p-4 cursor-pointer hover:shadow-sm transition-shadow"
            onClick={() => navigate('/projects')}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-blue-700 dark:text-blue-300">Sprint 12</span>
              <Badge className="bg-blue-600 text-white text-[10px]">Active</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="font-bold text-blue-700 dark:text-blue-300">65%</span>
              </div>
              <div className="h-2 rounded-full bg-blue-200 overflow-hidden">
                <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: '65%' }} />
              </div>
            </div>
          </div>

          {/* Next sprint */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 dark:bg-gray-900/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Sprint 13</span>
              <Badge variant="outline" className="text-[10px]">Planning</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Sprint planning in progress. Tasks being assigned.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MemberWeekSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" /> My Week
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold text-red-600">2</p>
            <p className="text-xs text-muted-foreground mt-1">Tasks Due Today</p>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">5</p>
            <p className="text-xs text-muted-foreground mt-1">Tasks Due This Week</p>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">14h</p>
            <p className="text-xs text-muted-foreground mt-1">Hours Logged This Week</p>
          </div>
        </div>

        {/* Upcoming deadline highlight */}
        <div
          className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/30 p-4 cursor-pointer hover:shadow-sm transition-shadow"
          onClick={() => navigate('/my-tasks')}
        >
          <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-orange-800 dark:text-orange-300">Upcoming Deadline</p>
            <p className="text-sm text-orange-700 dark:text-orange-400 mt-0.5">
              <span className="font-semibold">CPR-4 — Finalize design mockups</span> is due today at 5:00 PM
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ExecutiveSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const divisions = [
    { name: 'IT Division',        pct: 78, color: '#3B82F6' },
    { name: 'Finance Division',   pct: 65, color: '#8B5CF6' },
    { name: 'Operations Division',pct: 82, color: '#10B981' },
  ];

  const risks = [
    { id: 'R-01', title: 'API Migration deadline at risk', severity: 'high',   project: 'API Gateway Migration' },
    { id: 'R-02', title: 'Resource bottleneck in QA team', severity: 'medium', project: 'Mobile App v2' },
  ];

  const riskColors: Record<string, string> = {
    high:   'border-red-200 bg-red-50 dark:bg-red-950/30 text-red-700',
    medium: 'border-orange-200 bg-orange-50 dark:bg-orange-950/30 text-orange-700',
  };

  return (
    <div className="space-y-4">
      {/* Portfolio Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Portfolio Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {divisions.map((d) => (
              <div
                key={d.name}
                className="rounded-lg border p-4 space-y-3 cursor-pointer hover:shadow-sm transition-shadow"
                onClick={() => navigate('/executive/portfolio')}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{d.name}</span>
                  <span className="font-bold text-sm" style={{ color: d.color }}>{d.pct}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${d.pct}%`, backgroundColor: d.color }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Overall health score</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Risks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" /> Key Risks
          </CardTitle>
          <button
            onClick={() => navigate('/executive/risk-register')}
            className="text-xs text-primary hover:underline font-medium"
          >
            Risk Register →
          </button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {risks.map((r) => (
              <div
                key={r.id}
                className={cn('flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:opacity-80 transition-opacity', riskColors[r.severity])}
                onClick={() => navigate('/executive/risk-register')}
              >
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="text-xs opacity-75 mt-0.5">{r.project} · {r.id}</p>
                </div>
                <Badge variant="outline" className="ml-auto shrink-0 text-[10px] capitalize">{r.severity}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ViewerSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const assignedProjects = [
    { id: '1', name: 'Customer Portal Redesign', key: 'CPR', role: 'Observer' },
    { id: '3', name: 'Mobile App v2',            key: 'MAV2', role: 'Viewer'  },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FolderKanban className="h-5 w-5 text-primary" /> My Assigned Projects
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {assignedProjects.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => navigate(`/projects/${p.id}/board`)}
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{p.key}</Badge>
                <span className="text-sm font-medium">{p.name}</span>
              </div>
              <Badge variant="secondary" className="text-xs">{p.role}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user, currentRole } = useAuthStore();
  const navigate = useNavigate();
  const firstName = user?.first_name || user?.firstName || 'User';
  const dashboardQuery = useDashboard();

  const stats           = dashboardQuery.data?.stats            || mockStats;
  const projectProgress = dashboardQuery.data?.project_progress || mockProjectProgress;
  const recentActivity  = dashboardQuery.data?.recent_activity  || mockActivity;
  const teamWorkload    = dashboardQuery.data?.team_workload     || mockTeamWorkload;

  // Roles that see team workload table
  const showTeamWorkload =
    currentRole === 'org_admin' ||
    currentRole === 'project_manager' ||
    currentRole === 'team_lead';

  // Executive replaces project progress with portfolio summary — handled via role section below
  const showProjectProgress = currentRole !== 'executive';

  // Viewer sees no team workload
  const showRecentActivity = currentRole !== 'viewer';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {firstName}</h1>
        <p className="text-muted-foreground">
          {ROLE_LABEL[currentRole || ''] ? `${ROLE_LABEL[currentRole!]} — ` : ''}
          Here's what's happening across your projects
        </p>
      </div>

      {/* Stat Cards — all clickable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children animate-fade-in-up">
        <div
          className="cursor-pointer group"
          onClick={() => navigate('/projects')}
          title="Go to Projects"
        >
          <StatCard
            title="Active Projects"
            value={stats.active_projects}
            icon={FolderKanban}
            trend={{ value: 12, label: 'vs last month' }}
            className="stat-tile card-hover group-hover:border-primary/40 transition-colors"
          />
        </div>

        <div
          className="cursor-pointer group"
          onClick={() => navigate('/my-tasks')}
          title="View all tasks"
        >
          <StatCard
            title="Total Tasks"
            value={stats.total_tasks}
            icon={ListTodo}
            subtitle={`${stats.completed_tasks} completed`}
            className="stat-tile card-hover group-hover:border-primary/40 transition-colors"
          />
        </div>

        <div
          className="cursor-pointer group"
          onClick={() => navigate('/my-tasks?tab=open')}
          title="View my open tasks"
        >
          <StatCard
            title="My Open Tasks"
            value={stats.my_open_tasks}
            icon={CheckSquare}
            iconColor="text-blue-600"
            className="stat-tile card-hover group-hover:border-blue-300 transition-colors"
          />
        </div>

        <div
          className="cursor-pointer group"
          onClick={() => navigate('/my-tasks?tab=overdue')}
          title="View overdue tasks"
        >
          <StatCard
            title="Overdue"
            value={stats.overdue_tasks}
            icon={AlertTriangle}
            iconColor="text-red-600"
            className={cn(
              'stat-tile card-hover group-hover:border-red-300 transition-colors',
              stats.overdue_tasks > 0 ? 'border-red-200' : ''
            )}
          />
        </div>
      </div>

      {/* Project Progress + Recent Activity (non-executive roles) */}
      {showProjectProgress && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Progress — rows are clickable */}
          <Card className="lg:col-span-2 card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Project Progress</CardTitle>
              <button
                onClick={() => navigate('/projects')}
                className="text-xs text-primary hover:underline font-medium"
              >
                View all →
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectProgress.map((p) => (
                <div
                  key={p.project_id}
                  className="space-y-2 rounded-lg px-3 py-2 -mx-1 cursor-pointer hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
                  onClick={() => navigate(`/projects/${p.project_id}/board`)}
                  title={`Open ${p.name} board`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="text-sm font-medium">{p.name}</span>
                      <Badge variant="outline" className="text-xs">{p.key}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">{p.completion_pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${p.completion_pct}%`, backgroundColor: p.color }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{p.completed_tasks} of {p.total_tasks} tasks completed</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity — rows navigate to My Tasks */}
          {showRecentActivity && (
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <button
                  onClick={() => navigate('/my-tasks')}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  My Tasks →
                </button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((a, i) => (
                    <div
                      key={i}
                      className="flex gap-3 rounded-lg px-2 py-2 -mx-2 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate('/my-tasks')}
                      title="View task"
                    >
                      <Avatar name={a.actor} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{a.actor}</span>{' '}
                          <span className="text-muted-foreground">{safeDetail((a as any).detail)}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs">{(a as any).entity ?? (a as any).entity_id ?? ''}</Badge>
                          <span className="text-xs text-muted-foreground">{timeAgo(a.at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Team Workload — org_admin, project_manager, team_lead */}
      {showTeamWorkload && (
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Team Workload</CardTitle>
            <button
              onClick={() => navigate('/admin/users')}
              className="text-xs text-primary hover:underline font-medium"
            >
              Manage team →
            </button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Member</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium text-center">Open Tasks</th>
                    <th className="pb-3 font-medium text-center">High Priority</th>
                    <th className="pb-3 font-medium text-center">Overdue</th>
                    <th className="pb-3 font-medium text-right">Est. Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {teamWorkload.map((m) => (
                    <tr
                      key={m.user_id}
                      className="border-b last:border-0 cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => navigate('/my-tasks')}
                      title={`View ${m.name}'s tasks`}
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={m.name} size="sm" />
                          <span className="font-medium">{m.name}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge variant="secondary" className="text-xs">
                          {ROLE_LABEL[m.role] || m.role.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-2xl font-bold text-primary">{m.open_tasks}</span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={cn('text-2xl font-bold', m.high_priority > 0 ? 'text-orange-600' : 'text-primary')}>
                          {m.high_priority}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={cn('text-2xl font-bold', m.overdue_tasks > 0 ? 'text-red-600' : 'text-primary')}>
                          {m.overdue_tasks}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {m.estimated_hours}h
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Role-specific sections ─────────────────────────────────────────── */}

      {currentRole === 'org_admin' && (
        <OrgAdminSection navigate={navigate} />
      )}

      {currentRole === 'division_admin' && (
        <DivisionAdminSection />
      )}

      {currentRole === 'vertical_head' && (
        <VerticalHeadSection navigate={navigate} />
      )}

      {(currentRole === 'project_manager' || currentRole === 'team_lead') && (
        <SprintStatusSection navigate={navigate} />
      )}

      {currentRole === 'member' && (
        <MemberWeekSection navigate={navigate} />
      )}

      {currentRole === 'executive' && (
        <ExecutiveSection navigate={navigate} />
      )}

      {currentRole === 'viewer' && (
        <ViewerSection navigate={navigate} />
      )}
    </div>
  );
}

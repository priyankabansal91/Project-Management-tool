import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useMyTasks, useProjects, useWeeklySummary } from '@/api/hooks';
import { useAttendanceStore } from '@/store/attendanceStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  FolderKanban, CheckSquare, Clock, ChevronRight,
  Mail, Globe, CalendarDays, TrendingUp,
} from 'lucide-react';

const ROLE_LABEL: Record<string, string> = {
  org_admin: 'System Admin',
  division_admin: 'Division Admin',
  vertical_head: 'Vertical Head',
  project_manager: 'Project Lead',
  team_lead: 'Team Lead',
  member: 'Project Team Member',
  viewer: 'Others',
  executive: 'Leadership',
};

const ROLE_STYLE: Record<string, string> = {
  org_admin: 'bg-red-100 text-red-700 border-red-200',
  division_admin: 'bg-orange-100 text-orange-700 border-orange-200',
  project_manager: 'bg-blue-100 text-blue-700 border-blue-200',
  member: 'bg-green-100 text-green-700 border-green-200',
  viewer: 'bg-gray-100 text-gray-700 border-gray-200',
  executive: 'bg-purple-100 text-purple-700 border-purple-200',
};

const STATUS_STYLE: Record<string, string> = {
  'To Do': 'bg-gray-100 text-gray-600',
  'In Progress': 'bg-blue-100 text-blue-600',
  'Done': 'bg-green-100 text-green-600',
  'Blocked': 'bg-red-100 text-red-600',
  'Backlog': 'bg-gray-100 text-gray-500',
  'Review': 'bg-yellow-100 text-yellow-600',
};

const PRIORITY_STYLE: Record<string, string> = {
  critical: 'text-red-500',
  high: 'text-orange-500',
  medium: 'text-yellow-500',
  low: 'text-gray-400',
};

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type TaskTab = 'all' | 'open' | 'done';

export function ProfilePage() {
  const user = useAuthStore(s => s.user);
  const currentRole = useAuthStore(s => s.currentRole);

  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const { data: tasksData, isLoading: tasksLoading } = useMyTasks();
  const { data: weekSummary, isLoading: timeLoading } = useWeeklySummary();
  const getMonthRecords = useAttendanceStore(s => s.getMonthRecords);
  const leaveBalance = useAttendanceStore(s => s.leaveBalance);

  const [taskTab, setTaskTab] = useState<TaskTab>('all');

  const projects: any[] = (projectsData as any)?.items ?? [];
  const allTasks: any[] = (tasksData as any)?.items ?? [];
  const openTasks = allTasks.filter(t => !t.completed_at);
  const doneTasks = allTasks.filter(t => !!t.completed_at);
  const displayTasks = taskTab === 'all' ? allTasks : taskTab === 'open' ? openTasks : doneTasks;

  // Attendance — month is 0-indexed to match getMonth()
  const now = new Date();
  const monthRecords = user ? getMonthRecords(user.id, now.getFullYear(), now.getMonth()) : [];
  const presentCount = monthRecords.filter(r => ['present', 'wfh', 'half_day'].includes(r.status)).length;
  const leaveCount = monthRecords.filter(r => r.status === 'leave').length;
  const absentCount = monthRecords.filter(r => r.status === 'absent').length;
  const balance = (user && leaveBalance[user.id]) ?? { sick: 0, casual: 0, earned: 0 };

  // Time by day
  const dayHours: Record<string, number> = weekSummary?.byDay ?? {};
  const maxDayHours = Math.max(...Object.values(dayHours), 1);

  const fullName = user ? `${user.firstName} ${user.lastName}` : 'User';
  const role = currentRole ?? 'member';

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Profile header ── */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <Avatar name={fullName} size="lg" className="h-20 w-20 shrink-0 text-2xl font-bold" />

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-tight">{fullName}</h1>

              <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span>{user?.email}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge
                  variant="outline"
                  className={cn('text-xs font-medium', ROLE_STYLE[role])}
                >
                  {ROLE_LABEL[role] ?? role}
                </Badge>

                {user?.timezone && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    {user.timezone}
                  </span>
                )}

                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  {now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<FolderKanban className="h-4 w-4 text-blue-500" />}
          label="Projects"
          value={projects.length}
          loading={projectsLoading}
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          icon={<CheckSquare className="h-4 w-4 text-orange-500" />}
          label="Open Tasks"
          value={openTasks.length}
          loading={tasksLoading}
          bg="bg-orange-50 dark:bg-orange-900/20"
        />
        <StatCard
          icon={<CheckSquare className="h-4 w-4 text-green-500" />}
          label="Completed"
          value={doneTasks.length}
          loading={tasksLoading}
          bg="bg-green-50 dark:bg-green-900/20"
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-purple-500" />}
          label="Hours This Week"
          value={weekSummary ? `${weekSummary.totalHours}h` : '—'}
          loading={timeLoading}
          bg="bg-purple-50 dark:bg-purple-900/20"
        />
      </div>

      {/* ── Main content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* My Tasks — left 2/3 */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">My Tasks</CardTitle>
                <Link to="/my-tasks" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Tab pills */}
              <div className="flex gap-1.5 mt-2">
                {(['all', 'open', 'done'] as TaskTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setTaskTab(tab)}
                    className={cn(
                      'px-3 py-1 text-xs rounded-full font-medium transition-colors',
                      taskTab === tab
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {tab === 'all'
                      ? `All (${allTasks.length})`
                      : tab === 'open'
                      ? `Open (${openTasks.length})`
                      : `Done (${doneTasks.length})`}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              {tasksLoading ? (
                <SkeletonList rows={5} />
              ) : displayTasks.length === 0 ? (
                <EmptyState label="No tasks found" />
              ) : (
                <div className="divide-y divide-border/50">
                  {displayTasks.slice(0, 12).map(task => (
                    <Link
                      key={task.id}
                      to={`/tasks/${task.id}`}
                      className="flex items-start gap-3 py-2.5 hover:bg-muted/40 rounded-md px-1.5 -mx-1.5 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] text-muted-foreground font-mono">{task.task_key}</span>
                          {task.priority && task.priority !== 'medium' && (
                            <span className={cn('text-[11px] font-semibold capitalize', PRIORITY_STYLE[task.priority])}>
                              {task.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          {task.project && <span className="truncate max-w-[140px]">{task.project.name}</span>}
                          {task.due_date && (
                            <span className="shrink-0">
                              · Due {new Date(task.due_date).toLocaleDateString('en-GB')}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[11px] shrink-0 mt-0.5',
                          STATUS_STYLE[task.status_name ?? ''] ?? 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {task.status_name ?? 'Backlog'}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column — 1/3 */}
        <div className="space-y-4">

          {/* My Projects */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">My Projects</CardTitle>
                <Link to="/projects" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {projectsLoading ? (
                <SkeletonList rows={4} />
              ) : projects.length === 0 ? (
                <EmptyState label="No projects assigned" />
              ) : (
                <div className="space-y-1">
                  {projects.slice(0, 7).map(p => (
                    <Link
                      key={p.id}
                      to={`/projects/${p.id}/board`}
                      className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: p.color }}
                      />
                      <span className="text-sm truncate flex-1 group-hover:text-primary transition-colors">
                        {p.name}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {p.task_count} tasks
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time This Week */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" />
                  Time This Week
                </CardTitle>
                <Link to="/time-tracking" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Logs <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              {weekSummary && (
                <p className="text-xs text-muted-foreground">
                  {weekSummary.totalHours}h logged · target {weekSummary.targetHours}h
                </p>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              {timeLoading ? (
                <SkeletonList rows={5} />
              ) : !weekSummary ? (
                <EmptyState label="No time logged this week" />
              ) : (
                <>
                  <div className="space-y-1.5">
                    {WEEK_DAYS.map((day, i) => {
                      const d = new Date(weekSummary.weekStart + 'T00:00:00Z');
                      d.setUTCDate(d.getUTCDate() + i);
                      const key = d.toISOString().slice(0, 10);
                      const h = dayHours[key] ?? 0;
                      const pct = maxDayHours > 0 ? (h / maxDayHours) * 100 : 0;
                      return (
                        <div key={day} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-7 shrink-0">{day}</span>
                          <div className="flex-1 h-3.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/60 rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right shrink-0">
                            {h > 0 ? `${h}h` : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {(weekSummary.byProject?.length ?? 0) > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground mb-1">By Project</p>
                      {weekSummary.byProject.slice(0, 3).map(p => (
                        <div key={p.projectKey} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground truncate max-w-[120px]">{p.projectName}</span>
                          <span className="font-medium">{p.hours}h</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Attendance This Month */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  Attendance
                </CardTitle>
                <Link to="/attendance" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Details <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">
                {now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-lg font-bold text-green-600">{presentCount}</p>
                  <p className="text-[11px] text-muted-foreground">Present</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <p className="text-lg font-bold text-yellow-600">{leaveCount}</p>
                  <p className="text-[11px] text-muted-foreground">On Leave</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <p className="text-lg font-bold text-red-600">{absentCount}</p>
                  <p className="text-[11px] text-muted-foreground">Absent</p>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Leave Balance</p>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div>
                    <p className="text-base font-bold">{balance.sick}</p>
                    <p className="text-[11px] text-muted-foreground">Sick</p>
                  </div>
                  <div>
                    <p className="text-base font-bold">{balance.casual}</p>
                    <p className="text-[11px] text-muted-foreground">Casual</p>
                  </div>
                  <div>
                    <p className="text-base font-bold">{balance.earned}</p>
                    <p className="text-[11px] text-muted-foreground">Earned</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, loading, bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  loading?: boolean;
  bg?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2.5 rounded-lg', bg ?? 'bg-muted')}>{icon}</div>
          <div>
            {loading ? (
              <div className="h-6 w-10 bg-muted animate-pulse rounded mb-1" />
            ) : (
              <p className="text-xl font-bold leading-tight">{value}</p>
            )}
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonList({ rows }: { rows: number }) {
  return (
    <div className="space-y-2 py-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 bg-muted animate-pulse rounded" style={{ opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-6 text-center text-sm text-muted-foreground">{label}</div>
  );
}

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users, FolderKanban, CheckSquare, Clock, BarChart2, AlertTriangle,
  RefreshCw, Loader2, TrendingUp, CheckCircle2, XCircle, Calendar,
  Activity, Star, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  useDivisionMIS,
  useDivisionOverviewMIS,
  useMyDivisions,
  useAllDivisionConfigs,
} from '@/api/hooks';
import { useQueryClient } from '@tanstack/react-query';

// ─── Helpers ──────────────────────────────────────────────

function fmtAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m  = Math.floor(ms / 60_000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Sub-components ───────────────────────────────────────

function MetricCard({
  title, icon: Icon, value, sub, accent = 'blue',
  breakdown,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  value: number | string;
  sub?: string;
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  breakdown?: { label: string; value: number; color: string }[];
}) {
  const accentMap = {
    blue:   'text-blue-600',
    green:  'text-emerald-600',
    amber:  'text-amber-600',
    red:    'text-red-600',
    purple: 'text-purple-600',
  };

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={cn('h-4 w-4', accentMap[accent])} />
          <span className="text-sm text-muted-foreground font-medium">{title}</span>
        </div>
        <p className={cn('text-3xl font-bold', accentMap[accent])}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        {breakdown && breakdown.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {breakdown.map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{ backgroundColor: b.color + '20', color: b.color }}
              >
                {b.label}: {b.value}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PriorityBar({
  by_priority,
  total,
}: {
  by_priority: { critical: number; high: number; medium: number; low: number };
  total: number;
}) {
  const bars = [
    { label: 'Critical', value: by_priority.critical, color: '#ef4444' },
    { label: 'High',     value: by_priority.high,     color: '#f97316' },
    { label: 'Medium',   value: by_priority.medium,   color: '#3b82f6' },
    { label: 'Low',      value: by_priority.low,       color: '#94a3b8' },
  ];

  return (
    <div className="space-y-2">
      {bars.map((b) => {
        const pct = total > 0 ? Math.round((b.value / total) * 100) : 0;
        return (
          <div key={b.label} className="flex items-center gap-3">
            <span className="w-14 text-xs text-muted-foreground text-right shrink-0">{b.label}</span>
            <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: b.color }}
              />
            </div>
            <span className="w-8 text-xs font-medium text-right shrink-0">{b.value}</span>
          </div>
        );
      })}
    </div>
  );
}

function CompletionRing({ rate }: { rate: number }) {
  const r   = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ * (rate / 100);

  const color =
    rate >= 75 ? '#10b981' :
    rate >= 50 ? '#3b82f6' :
    rate >= 25 ? '#f59e0b' :
                 '#ef4444';

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#e5e7eb" strokeWidth="7" />
        <circle
          cx="36" cy="36" r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xl font-bold" style={{ color }}>{rate}%</span>
      <span className="text-[10px] text-muted-foreground">Completion</span>
    </div>
  );
}

// ─── Division selector ────────────────────────────────────

function DivisionSelector({
  selected,
  onChange,
  isOrgAdmin,
}: {
  selected: string;
  onChange: (id: string) => void;
  isOrgAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { data: allConfigs } = useAllDivisionConfigs();
  const { data: myDivisions } = useMyDivisions();

  const options = isOrgAdmin
    ? (allConfigs || []).map((d: any) => ({ id: d.divisionId || d.id, name: d.name }))
    : (myDivisions || []).map((d) => ({ id: d.divisionId, name: d.divisionName }));

  const selectedName = options.find((o) => o.id === selected)?.name || 'Select Division';

  if (!isOrgAdmin) return null; // division_admin auto-selects

  return (
    <div className="relative inline-block">
      <Button
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        className="gap-2"
      >
        <FolderKanban className="h-4 w-4" />
        {selectedName}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>
      {open && (
        <div className="absolute z-50 mt-1 min-w-[200px] rounded-md border bg-popover text-popover-foreground shadow-md">
          {options.map((o) => (
            <button
              key={o.id}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left',
                selected === o.id && 'bg-primary/10 text-primary font-medium',
              )}
              onClick={() => { onChange(o.id); setOpen(false); }}
            >
              {o.name}
            </button>
          ))}
          {options.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">No divisions available</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────

export function DivisionMISPage() {
  const { currentRole, user } = useAuthStore();
  const qc = useQueryClient();

  const isOrgAdmin = currentRole === 'org_admin';
  const isDivAdmin = currentRole === 'division_admin';

  // For division_admin: auto-detect their division
  const { data: myDivisions } = useMyDivisions();
  const defaultDivisionId = isDivAdmin && myDivisions && myDivisions.length > 0
    ? myDivisions[0].divisionId
    : '';

  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('');

  // Resolve effective division id
  const effectiveDivisionId = isDivAdmin
    ? (defaultDivisionId || '')
    : selectedDivisionId || 'div_engineering'; // org_admin default to first

  const { data: mis, isLoading, isError, refetch } = useDivisionMIS(effectiveDivisionId);
  const { data: overview } = useDivisionOverviewMIS();

  const taskTotal = mis?.tasks.total ?? 0;
  const taskDone  = mis?.tasks.completed ?? 0;
  const completionRate = taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0;

  function handleRefresh() {
    qc.invalidateQueries({ queryKey: ['divisionMIS', effectiveDivisionId] });
    qc.invalidateQueries({ queryKey: ['divisionOverviewMIS'] });
    refetch();
  }

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ─── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary" />
            Division MIS Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Management Information System — real-time division metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isOrgAdmin && (
            <DivisionSelector
              selected={selectedDivisionId || 'div_engineering'}
              onChange={setSelectedDivisionId}
              isOrgAdmin={isOrgAdmin}
            />
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Org-Admin Overview cards ─── */}
      {isOrgAdmin && overview && overview.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Organisation Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {overview.map((div) => (
              <button
                key={div.id}
                onClick={() => setSelectedDivisionId(div.id)}
                className={cn(
                  'text-left rounded-lg border p-4 transition-colors hover:bg-accent',
                  (selectedDivisionId || 'div_engineering') === div.id
                    ? 'border-primary bg-primary/5'
                    : 'bg-card',
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: div.color }} />
                  <span className="font-semibold text-sm">{div.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Members: <strong className="text-foreground">{div.member_count}</strong></span>
                  <span>Projects: <strong className="text-foreground">{div.project_count}</strong></span>
                  <span>Completion: <strong className="text-foreground">{div.task_completion_rate}%</strong></span>
                  <span>Health: <strong className="text-foreground">{div.health_score}</strong></span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Loading / Error ─── */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <Card className="border-destructive/40">
          <CardContent className="pt-6 flex flex-col items-center gap-2 text-center">
            <XCircle className="h-8 w-8 text-destructive" />
            <p className="font-medium">Failed to load MIS data</p>
            <p className="text-sm text-muted-foreground">Please try refreshing or select another division.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()} className="mt-2">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && mis && (
        <>
          {/* ── Division name banner ─── */}
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{mis.division.name}</h2>
            <Badge variant="secondary">{mis.division.code}</Badge>
          </div>

          {/* ── Metric cards row ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Members"
              icon={Users}
              value={mis.members.total}
              sub={`${mis.members.active} active`}
              accent="blue"
              breakdown={[
                { label: 'Active',    value: mis.members.active,    color: '#10b981' },
                { label: 'Inactive',  value: mis.members.inactive,  color: '#94a3b8' },
                { label: 'Suspended', value: mis.members.suspended, color: '#ef4444' },
              ].filter((b) => b.value > 0)}
            />

            <MetricCard
              title="Projects"
              icon={FolderKanban}
              value={mis.projects.total}
              sub={`${mis.projects.active} active`}
              accent="purple"
              breakdown={[
                { label: 'Active',    value: mis.projects.active,    color: '#3b82f6' },
                { label: 'Completed', value: mis.projects.completed, color: '#10b981' },
                { label: 'On Hold',   value: mis.projects.on_hold,   color: '#f59e0b' },
                { label: 'Overdue',   value: mis.projects.overdue,   color: '#ef4444' },
              ].filter((b) => b.value > 0)}
            />

            <MetricCard
              title="Total Tasks"
              icon={CheckSquare}
              value={mis.tasks.total}
              sub={`${mis.tasks.overdue} overdue`}
              accent={mis.tasks.overdue > 0 ? 'red' : 'green'}
              breakdown={[
                { label: 'Open',        value: mis.tasks.open,        color: '#94a3b8' },
                { label: 'In Progress', value: mis.tasks.in_progress, color: '#3b82f6' },
                { label: 'Done',        value: mis.tasks.completed,   color: '#10b981' },
                { label: 'Due This Wk', value: mis.tasks.due_this_week, color: '#f97316' },
              ].filter((b) => b.value > 0)}
            />

            <MetricCard
              title="Pending Approvals"
              icon={AlertTriangle}
              value={mis.approvals.pending}
              sub={`${mis.approvals.approved_this_month} approved this month`}
              accent={mis.approvals.pending > 5 ? 'amber' : 'green'}
            />
          </div>

          {/* ── Second row: Time + Completion ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Time Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">This week</span>
                  <span className="text-xl font-bold text-blue-600">
                    {mis.time_tracking.hours_this_week}h
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">This month</span>
                  <span className="text-xl font-bold text-blue-600">
                    {mis.time_tracking.hours_this_month}h
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col items-center justify-center py-4">
              <CardHeader className="pb-2 text-center">
                <CardTitle className="text-sm flex items-center gap-2 justify-center">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Task Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CompletionRing rate={completionRate} />
                <p className="text-center text-xs text-muted-foreground mt-1">
                  {taskDone} / {taskTotal} tasks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-500" />
                  Due This Week
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Due this week</span>
                  <Badge variant={mis.tasks.due_this_week > 0 ? 'destructive' : 'secondary'}>
                    {mis.tasks.due_this_week}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Overdue</span>
                  <Badge variant={mis.tasks.overdue > 0 ? 'destructive' : 'secondary'}>
                    {mis.tasks.overdue}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Approved (month)</span>
                  <Badge variant="secondary">{mis.approvals.approved_this_month}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Priority distribution + Top contributors ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-primary" />
                  Task Priority Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {taskTotal === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No tasks found</p>
                ) : (
                  <PriorityBar by_priority={mis.tasks.by_priority} total={taskTotal} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  Top Contributors
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mis.top_contributors.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No contributor data</p>
                ) : (
                  <div className="space-y-0">
                    <div className="grid grid-cols-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide pb-2 border-b">
                      <span>Member</span>
                      <span className="text-right">Tasks Done</span>
                      <span className="text-right">Hours Logged</span>
                    </div>
                    {mis.top_contributors.map((c, i) => (
                      <div
                        key={c.user_id}
                        className={cn(
                          'grid grid-cols-3 py-2 text-sm',
                          i < mis.top_contributors.length - 1 && 'border-b',
                        )}
                      >
                        <span className="font-medium truncate">{c.name}</span>
                        <span className="text-right">
                          <Badge variant="secondary" className="text-emerald-700 bg-emerald-50">
                            {c.tasks_completed}
                          </Badge>
                        </span>
                        <span className="text-right">
                          <Badge variant="secondary" className="text-blue-700 bg-blue-50">
                            {c.hours_logged}h
                          </Badge>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Recent Activity ─── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mis.recent_activity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {mis.recent_activity.map((ev, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{ev.actor}</span>
                          {' '}
                          <span className="text-muted-foreground">{fmtAction(ev.action).toLowerCase()}</span>
                          {' '}
                          <span className="font-medium truncate">{ev.entity.split(':').pop()}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{timeAgo(ev.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

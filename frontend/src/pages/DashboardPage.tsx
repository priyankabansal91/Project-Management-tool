import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban, CheckSquare, AlertTriangle, ListTodo, Clock, TrendingUp,
  TrendingDown, Check, X, Flame, Building2,
  Users, Zap, BarChart3, Shield, Flag, Target, Calendar, ArrowRight,
  RefreshCw, ChevronRight, Bell, CheckCircle2, Circle, AlertCircle,
  Layers, Activity, Wallet, Timer,
} from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { cn, timeAgo, priorityColor } from '@/lib/utils';
import {
  useDashboard, useDashboardV2, useMilestoneBurnDashboard,
  usePendingApprovals, useMyTasks, useWeeklySummary, useProjects,
  useDivisionOverviewMIS, useExecutiveRollup, useApproveStep, useRejectStep,
} from '@/api/hooks';

// ─── Shared helpers ───────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  org_admin: 'System Admin',
  division_admin: 'Division Head',
  vertical_head: 'Vertical Head',
  team_lead: 'Team Lead',
  project_manager: 'Project Lead',
  member: 'Team Member',
  executive: 'Leadership',
  viewer: 'Observer',
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

function ragColor(pct: number): { bg: string; border: string; text: string; label: string } {
  if (pct >= 70) return { bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-300', text: 'text-green-700 dark:text-green-300', label: 'On Track' };
  if (pct >= 40) return { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-300', text: 'text-amber-700 dark:text-amber-300', label: 'At Risk' };
  return { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-300', text: 'text-red-700 dark:text-red-300', label: 'Off Track' };
}

function ProgressBar({ value, colorClass = 'bg-primary' }: { value: number; colorClass?: string }) {
  return (
    <div className="h-2 rounded-full bg-secondary overflow-hidden">
      <div className={cn('h-full rounded-full transition-all duration-500', colorClass)} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

function MiniStatChip({ label, value, color = 'text-foreground' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border p-3">
      <span className={cn('text-xl font-bold', color)}>{value}</span>
      <span className="text-[11px] text-muted-foreground mt-0.5 text-center">{label}</span>
    </div>
  );
}

function fmtCurrency(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

function agingBadge(createdAt?: string): { label: string; cls: string; isEscalated: boolean } {
  if (!createdAt) return { label: 'New', cls: 'bg-gray-100 text-gray-600 border-gray-200', isEscalated: false };
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (days >= 7) return { label: `${days}d — Escalate`, cls: 'bg-red-100 text-red-700 border-red-200', isEscalated: true };
  if (days >= 3) return { label: `${days}d`, cls: 'bg-amber-100 text-amber-700 border-amber-200', isEscalated: false };
  return { label: days === 0 ? 'Today' : `${days}d`, cls: 'bg-green-100 text-green-700 border-green-200', isEscalated: false };
}

// ─── Pending Approvals widget (shared across roles) ───────────────────────────

function PendingApprovalsWidget({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const q = usePendingApprovals({ page_size: 5 });
  const items: any[] = q.data?.items ?? [];
  const total: number = q.data?.total ?? items.length;

  if (!q.isLoading && total === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-500" /> Pending Approvals
          {total > 0 && (
            <span className="ml-1 rounded-full bg-amber-100 text-amber-700 text-xs px-2 py-0.5 font-semibold">{total}</span>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/approvals/inbox')}>
          View all <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {q.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="text-center py-3">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-1" />
            <p className="text-sm text-muted-foreground">All caught up!</p>
          </div>
        ) : (
          items.map((a: any) => (
            <div
              key={a.id}
              className="flex items-start gap-3 rounded-lg border px-3 py-2 hover:bg-muted/40 cursor-pointer transition-colors"
              onClick={() => navigate('/approvals/inbox')}
            >
              <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{a.title || a.description || 'Approval Request'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(a.createdAt || a.created_at)}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ─── OrgAdmin Section ─────────────────────────────────────────────────────────

function OrgAdminSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const execQ = useExecutiveRollup();
  const org = execQ.data?.orgSummary;
  const alerts = execQ.data?.alerts ?? [];

  return (
    <div className="space-y-4">
      {/* Org health summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStatChip label="Divisions Active" value={org?.divisionsCount ?? '—'} color="text-blue-600" />
        <MiniStatChip label="Projects Running" value={org?.activeProjects ?? '—'} color="text-green-600" />
        <MiniStatChip label="Members" value={org?.totalMembers ?? '—'} color="text-purple-600" />
        <MiniStatChip label="Pending Approvals" value="—" color="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Division RAG overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Division Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {execQ.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (execQ.data?.scorecards ?? []).slice(0, 5).map((sc: any) => {
              const pct = sc.completionRate ?? sc.completionPct ?? sc.health_score ?? 0;
              const rag = ragColor(pct);
              return (
                <div key={sc.divisionId || sc.id} className={cn('rounded-lg border p-3 space-y-2', rag.bg, rag.border)}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{sc.divisionName || sc.name}</span>
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', rag.text, rag.border)}>{rag.label}</span>
                  </div>
                  <ProgressBar value={pct} colorClass={pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'} />
                  <p className="text-xs text-muted-foreground">{pct}% completion · {sc.activeProjects ?? sc.projectCount ?? 0} active projects</p>
                </div>
              );
            })}
            {!execQ.isLoading && (execQ.data?.scorecards ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No division data available</p>
            )}
          </CardContent>
        </Card>

        {/* Alerts + Quick Actions */}
        <div className="space-y-4">
          {alerts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" /> Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {alerts.slice(0, 4).map((a, i) => (
                  <div key={i} className={cn(
                    'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm',
                    a.severity === 'high' ? 'border-red-200 bg-red-50 dark:bg-red-950/20 text-red-700' :
                    'border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-700'
                  )}>
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{a.message} <span className="font-medium">({a.division})</span></span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Add Division', icon: Layers, path: '/admin/divisions' },
                  { label: 'Invite Users', icon: Users, path: '/admin/users' },
                  { label: 'Audit Log', icon: Shield, path: '/admin/audit-log' },
                  { label: 'Feature Flags', icon: Zap, path: '/admin/feature-flags' },
                ].map(({ label, icon: Icon, path }) => (
                  <Button key={label} variant="outline" size="sm" className="justify-start gap-2 h-9" onClick={() => navigate(path)}>
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <PendingApprovalsWidget navigate={navigate} />
    </div>
  );
}

// ─── Division Admin sub-components ───────────────────────────────────────────

function VerticalHealthCard({ v, idx, navigate }: { v: any; idx: number; navigate: ReturnType<typeof useNavigate> }) {
  const pct = v.task_completion_rate ?? v.health_score ?? 0;
  const rag = ragColor(pct);
  const budgetSeed = [6500000, 4800000, 8200000, 3600000, 5100000, 7400000];
  const budgetPlanned = v.budget_planned ?? budgetSeed[idx % budgetSeed.length];
  const budgetConsumed = v.budget_consumed ?? Math.round(budgetPlanned * (0.3 + pct / 180));
  const budgetPct = Math.round((budgetConsumed / budgetPlanned) * 100);
  const budgetBar = budgetPct >= 95 ? 'bg-red-500' : budgetPct >= 80 ? 'bg-amber-500' : 'bg-green-500';
  const delayed = v.delayed_milestones ?? Math.max(0, Math.round((100 - pct) / 20));
  const msTotal = v.milestone_count ?? (v.project_count ?? 3) * 3;
  const msDone = v.milestones_completed ?? Math.round(msTotal * pct / 100);
  const burnTrend = v.burn_trend ?? (pct >= 70 ? 6 : pct >= 40 ? -3 : -14);
  const isHighRisk = delayed > 2 || budgetPct > 90;

  return (
    <Card className={cn('border-l-4 transition-all hover:shadow-lg cursor-pointer', rag.border)}
      onClick={() => navigate('/admin/divisions')}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {isHighRisk && <Flame className="h-3.5 w-3.5 text-red-500 shrink-0" />}
            <span className="font-semibold text-sm leading-tight truncate">{v.name}</span>
          </div>
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 border', rag.text, rag.bg, rag.border)}>
            {rag.label}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1"><Wallet className="h-3 w-3" /> Budget</span>
            <span className="font-semibold">{fmtCurrency(budgetConsumed)} <span className="text-muted-foreground font-normal">/ {fmtCurrency(budgetPlanned)}</span></span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', budgetBar)} style={{ width: `${Math.min(100, budgetPct)}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{budgetPct}% consumed</span>
            <span className={cn(budgetPct >= 90 ? 'text-red-600 font-medium' : '')}>{fmtCurrency(budgetPlanned - budgetConsumed)} left</span>
          </div>
        </div>

        <ProgressBar value={pct} colorClass={pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'} />

        <div className="grid grid-cols-3 gap-1 pt-1 border-t text-center">
          <div>
            <p className={cn('text-sm font-bold', rag.text)}>{pct}%</p>
            <p className="text-[9px] text-muted-foreground">Done</p>
          </div>
          <div className="border-x">
            <p className={cn('text-sm font-bold', delayed > 0 ? 'text-red-600' : 'text-green-600')}>{delayed}</p>
            <p className="text-[9px] text-muted-foreground">Delayed</p>
          </div>
          <div>
            <p className="text-sm font-bold text-blue-600">{msDone}/{msTotal}</p>
            <p className="text-[9px] text-muted-foreground">Milestones</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1 border-t">
          <span className="text-muted-foreground">{v.project_count ?? 0}p · {v.member_count ?? 0}m</span>
          <span className={cn('flex items-center gap-0.5 font-semibold', burnTrend >= 0 ? 'text-green-600' : 'text-red-500')}>
            {burnTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {burnTrend > 0 ? '+' : ''}{burnTrend}%/wk
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function MilestoneCalendarStrip({ milestones }: { milestones: any[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {days.map((d, i) => {
        const isToday = i === 0;
        const dayMs = milestones.filter((m: any) => {
          const due = m.dueDate || m.due_date;
          if (!due) return false;
          const dd = new Date(due);
          dd.setHours(0, 0, 0, 0);
          return dd.getTime() === d.getTime();
        });
        const hasOverdue = dayMs.some((m: any) => m.isOverdue);
        return (
          <div key={i} className={cn(
            'flex flex-col items-center gap-0.5 rounded-md px-2 py-1.5 min-w-[38px] shrink-0 transition-colors',
            isToday ? 'bg-primary/10 border border-primary/40' :
            dayMs.length > 0 ? 'bg-muted/60 border border-border' : 'border border-transparent'
          )}>
            <span className={cn('text-[9px] font-medium uppercase', isToday ? 'text-primary' : 'text-muted-foreground')}>
              {d.toLocaleDateString('en', { weekday: 'short' })}
            </span>
            <span className={cn('text-xs font-bold', isToday ? 'text-primary' : 'text-foreground')}>
              {d.getDate()}
            </span>
            <div className="flex gap-0.5 flex-wrap justify-center min-h-[8px]">
              {dayMs.slice(0, 3).map((_, j) => (
                <div key={j} className={cn('h-1.5 w-1.5 rounded-full', hasOverdue ? 'bg-red-500' : 'bg-blue-500')} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EnhancedApprovalsWidget({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const q = usePendingApprovals({ page_size: 8 });
  const approveM = useApproveStep();
  const rejectM  = useRejectStep();
  const items: any[] = q.data?.items ?? [];
  const total: number = q.data?.total ?? items.length;

  const mockItems = [
    { id: 'm1', title: 'Phase 2 Milestone Closure',  approvalType: 'Milestone', createdAt: new Date(Date.now() - 8 * 86400000).toISOString(), priority: 'high',   requestedBy: 'Rahul Sharma' },
    { id: 'm2', title: 'Budget Increase — CPR',      approvalType: 'Budget',    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), priority: 'medium', requestedBy: 'Carol Johnson' },
    { id: 'm3', title: 'New Member Access Request',  approvalType: 'Access',    createdAt: new Date(Date.now() - 86400000).toISOString(),      priority: 'low',    requestedBy: 'Admin' },
  ];

  const displayItems = items.length > 0 ? items : mockItems;
  const displayTotal = total > 0 ? total : mockItems.length;

  const typeColors: Record<string, string> = {
    Milestone: 'bg-purple-100 text-purple-700',
    Budget:    'bg-amber-100 text-amber-700',
    Access:    'bg-blue-100 text-blue-700',
    Workflow:  'bg-green-100 text-green-700',
  };
  const priorityDot: Record<string, string> = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-green-500' };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-500" /> Pending Approvals
          {displayTotal > 0 && (
            <span className="rounded-full bg-amber-100 text-amber-700 text-xs px-2 py-0.5 font-bold">{displayTotal}</span>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/admin/approvals')}>
          View all <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {q.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : displayItems.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-1" />
            <p className="text-sm text-muted-foreground">All caught up!</p>
          </div>
        ) : (
          displayItems.slice(0, 5).map((a: any) => {
            const age = agingBadge(a.createdAt || a.created_at);
            const aType = a.approvalType || a.approval_type || a.type || 'Request';
            const priority = a.priority || 'medium';
            return (
              <div key={a.id} className={cn(
                'rounded-lg border p-3 space-y-2',
                age.isEscalated ? 'border-red-200 bg-red-50/60 dark:bg-red-950/10' : 'border-border hover:bg-muted/20'
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={cn('h-2 w-2 rounded-full shrink-0 mt-0.5', priorityDot[priority] || 'bg-amber-500')} />
                    <p className="text-sm font-medium truncate">{a.title || a.description || 'Approval Request'}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {age.isEscalated && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', age.cls)}>{age.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', typeColors[aType] || 'bg-gray-100 text-gray-600')}>
                    {aType}
                  </span>
                  {a.requestedBy && <span>by {a.requestedBy}</span>}
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <Button size="sm"
                    className="h-7 text-xs flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={approveM.isPending}
                    onClick={(e) => { e.stopPropagation(); approveM.mutate({ approvalId: a.id }); }}>
                    <Check className="h-3 w-3 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline"
                    className="h-7 text-xs flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    disabled={rejectM.isPending}
                    onClick={(e) => { e.stopPropagation(); rejectM.mutate({ approvalId: a.id }); }}>
                    <X className="h-3 w-3 mr-1" /> Reject
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0"
                    onClick={() => navigate('/admin/approvals')}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// ─── Division Admin Section ───────────────────────────────────────────────────

function DivisionAdminSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const misQ = useDivisionOverviewMIS();
  const divisionItems: any[] = misQ.data ?? [];
  const burnQ = useMilestoneBurnDashboard();
  const burnItems: any[] = burnQ.data?.items ?? burnQ.data ?? [];
  void useDashboardV2(); // keep cache warm

  const mockVerticals = [
    { id: 'v1', name: 'Quality Management',  health_score: 78, project_count: 5, member_count: 12, task_completion_rate: 78 },
    { id: 'v2', name: 'Accreditation',        health_score: 54, project_count: 3, member_count: 8,  task_completion_rate: 54 },
    { id: 'v3', name: 'Standards & Testing',  health_score: 35, project_count: 4, member_count: 10, task_completion_rate: 35 },
    { id: 'v4', name: 'Training & Capacity',  health_score: 72, project_count: 2, member_count: 6,  task_completion_rate: 72 },
  ];

  const verticals = divisionItems.length > 0 ? divisionItems : mockVerticals;

  const mockMilestones = [
    { id: 'ms1', title: 'Design Approval Gate',  projectName: 'CPR',  dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),  progress: 85, isOverdue: false, pmName: 'Rahul S.' },
    { id: 'ms2', title: 'API Integration Phase', projectName: 'AGM',  dueDate: new Date(Date.now() - 86400000).toISOString(),      progress: 60, isOverdue: true,  pmName: 'Carol J.' },
    { id: 'ms3', title: 'UAT Sign-off',          projectName: 'CPR',  dueDate: new Date(Date.now() + 8 * 86400000).toISOString(),  progress: 30, isOverdue: false, pmName: 'Rahul S.' },
    { id: 'ms4', title: 'Mobile Build v2.1',     projectName: 'MAV2', dueDate: new Date(Date.now() + 12 * 86400000).toISOString(), progress: 45, isOverdue: false, pmName: 'David P.' },
    { id: 'ms5', title: 'Compliance Review',     projectName: 'QMS',  dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),  progress: 70, isOverdue: false, pmName: 'Priya S.' },
  ];

  const milestones = burnItems.length > 0
    ? burnItems.filter((m: any) => {
        const d = m.dueDate || m.due_date;
        return d && Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) <= 30;
      }).slice(0, 8)
    : mockMilestones;

  const budgetSeed = [6500000, 4800000, 8200000, 3600000, 5100000, 7400000];
  const onTrack  = verticals.filter((v: any) => (v.task_completion_rate ?? v.health_score ?? 0) >= 70).length;
  const atRisk   = verticals.filter((v: any) => { const p = v.task_completion_rate ?? v.health_score ?? 0; return p >= 40 && p < 70; }).length;
  const critical = verticals.filter((v: any) => (v.task_completion_rate ?? v.health_score ?? 0) < 40).length;
  const totalBudget = verticals.reduce((sum: number, _: any, i: number) => sum + budgetSeed[i % budgetSeed.length], 0);

  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <MiniStatChip label="Active Projects" value={verticals.reduce((s: number, v: any) => s + (v.project_count ?? 0), 0)} color="text-blue-600" />
        <MiniStatChip label="On Track"    value={onTrack}  color="text-green-600" />
        <MiniStatChip label="At Risk"     value={atRisk}   color="text-amber-600" />
        <MiniStatChip label="Critical"    value={critical} color={critical > 0 ? 'text-red-600' : 'text-muted-foreground'} />
        <MiniStatChip label="Total Budget" value={fmtCurrency(totalBudget)} color="text-purple-600" />
      </div>

      {/* Vertical health cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Verticals Health
          </h3>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/admin/divisions')}>
            Manage <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {verticals.slice(0, 8).map((v: any, i: number) => (
            <VerticalHealthCard key={v.id} v={v} idx={i} navigate={navigate} />
          ))}
        </div>
      </div>

      {/* Milestones + Approvals row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Flag className="h-4 w-4 text-primary" /> Milestones Due Soon
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/milestones')}>
                All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <MilestoneCalendarStrip milestones={milestones} />
            <div className="space-y-2 pt-1">
              {milestones.slice(0, 5).map((m: any) => {
                const dueDate = m.dueDate || m.due_date;
                const days = dueDate ? Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000) : null;
                const isOverdue = m.isOverdue || (days !== null && days < 0);
                const urgencyClass = isOverdue
                  ? 'border-red-200 bg-red-50/50 dark:bg-red-950/10'
                  : days !== null && days <= 3 ? 'border-amber-200 bg-amber-50/50' : '';
                const daysLabel = days === null ? '' : isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`;
                const burn = m.burnRate ?? m.progress ?? 0;
                return (
                  <div key={m.id}
                    className={cn('rounded-lg border px-3 py-2 cursor-pointer hover:shadow-sm transition-all', urgencyClass)}
                    onClick={() => m.projectId ? navigate(`/projects/${m.projectId}/milestones`) : navigate('/milestones')}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{m.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
                          <span>{m.projectName || 'Project'}</span>
                          {m.pmName && <span>· PM: {m.pmName}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn('text-[11px] font-semibold',
                          isOverdue ? 'text-red-600' : days !== null && days <= 3 ? 'text-amber-600' : 'text-muted-foreground')}>
                          {daysLabel}
                        </p>
                        <p className="text-[11px] font-bold">{burn}%</p>
                      </div>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className={cn('h-full rounded-full',
                        isOverdue ? 'bg-red-500' : burn >= 70 ? 'bg-green-500' : burn >= 40 ? 'bg-blue-500' : 'bg-amber-500')}
                        style={{ width: `${burn}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <EnhancedApprovalsWidget navigate={navigate} />
      </div>
    </div>
  );
}

// ─── Vertical Head sub-components ────────────────────────────────────────────

const VH_MOCK_MILESTONES: Record<string, Array<{ title: string; status: 'completed' | 'in_progress' | 'pending' | 'overdue' }>> = {
  p1: [
    { title: 'Requirements', status: 'completed' },
    { title: 'Design',       status: 'completed' },
    { title: 'Development',  status: 'in_progress' },
    { title: 'Testing',      status: 'pending' },
    { title: 'Go Live',      status: 'pending' },
  ],
  p2: [
    { title: 'Discovery',    status: 'completed' },
    { title: 'Architecture', status: 'overdue' },
    { title: 'Migration',    status: 'pending' },
    { title: 'Validation',   status: 'pending' },
  ],
  p3: [
    { title: 'Wireframes',   status: 'completed' },
    { title: 'UI Design',    status: 'completed' },
    { title: 'Build v2',     status: 'in_progress' },
    { title: 'QA',           status: 'pending' },
    { title: 'Release',      status: 'pending' },
    { title: 'Monitoring',   status: 'pending' },
  ],
};

type MsStatus = 'completed' | 'in_progress' | 'pending' | 'overdue';

function MilestoneTrack({ milestones }: { milestones: Array<{ title: string; status: MsStatus }> }) {
  const dotCls: Record<MsStatus, string> = {
    completed:   'bg-green-500 border-green-500',
    in_progress: 'bg-blue-500 border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900',
    overdue:     'bg-red-500 border-red-500',
    pending:     'bg-background border-border',
  };
  const labelCls: Record<MsStatus, string> = {
    completed:   'text-green-600 dark:text-green-400',
    in_progress: 'text-blue-600 dark:text-blue-400 font-semibold',
    overdue:     'text-red-600 font-semibold',
    pending:     'text-muted-foreground',
  };
  const lineCls = (s: MsStatus) => s === 'completed' ? 'bg-green-300 dark:bg-green-700' : 'bg-border';

  return (
    <div className="space-y-1">
      <div className="flex items-center">
        {milestones.map((ms, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className={cn('h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center', dotCls[ms.status])}>
              {ms.status === 'completed' && <Check className="h-2.5 w-2.5 text-white" />}
              {ms.status === 'overdue'   && <X className="h-2.5 w-2.5 text-white" />}
            </div>
            {i < milestones.length - 1 && (
              <div className={cn('h-0.5 flex-1 transition-colors', lineCls(ms.status))} />
            )}
          </div>
        ))}
      </div>
      <div className="flex items-start">
        {milestones.map((ms, i) => (
          <div key={i} className="flex-1 text-center">
            <p className={cn('text-[9px] leading-tight truncate px-0.5', labelCls[ms.status])}>{ms.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerticalProjectCard({ p, idx, navigate }: { p: any; idx: number; navigate: ReturnType<typeof useNavigate> }) {
  const pct = p.completion_pct ?? 0;
  const rag = ragColor(pct);
  const bSeed = [4500000, 3200000, 5800000, 2900000];
  const budgetPlanned  = p.budget_planned  ?? bSeed[idx % bSeed.length];
  const budgetConsumed = p.budget_consumed ?? Math.round(budgetPlanned * (0.3 + pct / 160));
  const budgetPct = Math.round((budgetConsumed / budgetPlanned) * 100);
  const pMilestones: Array<{ title: string; status: MsStatus }> =
    p.milestones ?? VH_MOCK_MILESTONES[p.id] ?? VH_MOCK_MILESTONES.p1;
  const delayed = pMilestones.filter(m => m.status === 'overdue').length;
  const done    = pMilestones.filter(m => m.status === 'completed').length;

  return (
    <Card className="hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate(`/projects/${p.id}/board`)}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: p.color || '#3B82F6' }} />
            <p className="font-semibold text-sm truncate">{p.name}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {delayed > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-red-600 font-semibold">
                <AlertTriangle className="h-3 w-3" />{delayed} delayed
              </span>
            )}
            <Badge variant="outline" className="text-[10px]">{p.key}</Badge>
          </div>
        </div>

        {/* Milestone track */}
        <MilestoneTrack milestones={pMilestones} />

        {/* Budget row */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1"><Wallet className="h-3 w-3" /> Budget consumed</span>
            <span className={cn('font-semibold',
              budgetPct >= 95 ? 'text-red-600' : budgetPct >= 80 ? 'text-amber-600' : 'text-green-600')}>
              {fmtCurrency(budgetConsumed)} / {fmtCurrency(budgetPlanned)}
            </span>
          </div>
          <div className="h-1 rounded-full bg-secondary overflow-hidden">
            <div className={cn('h-full rounded-full',
              budgetPct >= 95 ? 'bg-red-500' : budgetPct >= 80 ? 'bg-amber-500' : 'bg-green-500')}
              style={{ width: `${Math.min(100, budgetPct)}%` }} />
          </div>
        </div>

        {/* Completion */}
        <div>
          <ProgressBar value={pct} colorClass={pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'} />
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-muted-foreground">{pct}% complete</span>
            <span className={cn('font-semibold', rag.text)}>{rag.label}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5 border-t">
          <span>{done}/{pMilestones.length} milestones done</span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-medium">View board →</span>
        </div>
      </CardContent>
    </Card>
  );
}

function FinancialVariancePanel({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const mockVariances = [
    { id: 'v1', name: 'CPR — Development Phase', variance: 12, burnRate: 68, completionRate: 62, risk: 'medium' as const },
    { id: 'v2', name: 'AGM — API Migration',      variance: 28, burnRate: 82, completionRate: 28, risk: 'high'   as const },
    { id: 'v3', name: 'MAV2 — Mobile Build',      variance: -5, burnRate: 45, completionRate: 45, risk: 'low'    as const },
    { id: 'v4', name: 'QMS — Compliance Review',  variance: 18, burnRate: 74, completionRate: 70, risk: 'medium' as const },
  ];
  const resourceAlerts = [
    { name: 'Rahul Sharma',  utilization: 118, role: 'Backend Dev' },
    { name: 'Carol Johnson', utilization: 105, role: 'Designer' },
  ];
  const riskBg: Record<string, string> = {
    high:   'border-red-200 bg-red-50/50 dark:bg-red-950/10',
    medium: 'border-amber-200 bg-amber-50/50',
    low:    '',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Financial Variance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {mockVariances.map((v) => {
            const drift = v.burnRate - v.completionRate;
            return (
              <div key={v.id} className={cn('rounded-lg border px-3 py-2 space-y-1', riskBg[v.risk])}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium truncate flex-1">{v.name}</p>
                  <span className={cn('text-[10px] font-bold shrink-0',
                    v.variance > 0 ? 'text-red-600' : 'text-green-600')}>
                    {v.variance > 0 ? '+' : ''}{v.variance}%
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                  <span>Burn {v.burnRate}% · Done {v.completionRate}%</span>
                  {drift > 10 && (
                    <span className="text-red-600 font-semibold flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" /> +{drift}% drift
                    </span>
                  )}
                </div>
                {drift > 0 && (
                  <div className="h-1 rounded-full bg-secondary overflow-hidden">
                    <div className={cn('h-full rounded-full', drift > 20 ? 'bg-red-500' : drift > 10 ? 'bg-amber-500' : 'bg-green-500')}
                      style={{ width: `${Math.min(100, (drift / 40) * 100)}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Resource overload */}
        <div className="space-y-1.5 border-t pt-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Resource Overload</p>
          {resourceAlerts.map((r) => (
            <div key={r.name} className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50/50 dark:bg-orange-950/10 px-3 py-1.5">
              <div>
                <p className="text-xs font-medium">{r.name}</p>
                <p className="text-[10px] text-muted-foreground">{r.role}</p>
              </div>
              <span className="text-sm font-bold text-orange-600">{r.utilization}%</span>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => navigate('/projects')}>
          <Activity className="h-3.5 w-3.5 mr-1" /> Full Resource Report
        </Button>
      </CardContent>
    </Card>
  );
}

function VerticalApprovalsWidget({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const q = usePendingApprovals({ page_size: 10 });
  const approveM = useApproveStep();
  const rejectM  = useRejectStep();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const items: any[] = q.data?.items ?? [];
  const total: number = q.data?.total ?? items.length;

  const mockItems = [
    { id: 'a1', title: 'Requirements Phase Complete', approvalType: 'Milestone', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), priority: 'high',   requestedBy: 'Rahul S.',  project: 'CPR' },
    { id: 'a2', title: 'Sprint 12 Scope Change',      approvalType: 'Workflow',  createdAt: new Date(Date.now() - 4 * 86400000).toISOString(), priority: 'medium', requestedBy: 'Carol J.', project: 'AGM' },
    { id: 'a3', title: 'Budget Reallocation +₹2L',    approvalType: 'Budget',    createdAt: new Date(Date.now() - 86400000).toISOString(),      priority: 'high',   requestedBy: 'David P.', project: 'MAV2' },
  ];

  const displayItems = items.length > 0 ? items : mockItems;
  const displayTotal  = total > 0 ? total : mockItems.length;

  function slaStatus(createdAt: string, priority: string) {
    const slaHours: Record<string, number> = { high: 48, medium: 120, low: 168 };
    const elapsed = (Date.now() - new Date(createdAt).getTime()) / 3600000;
    const limit = slaHours[priority] || 120;
    const pct = Math.min(100, (elapsed / limit) * 100);
    const remaining = Math.max(0, Math.round(limit - elapsed));
    if (pct >= 100) return { label: 'SLA Breached', pct, cls: 'text-red-600', barCls: 'bg-red-500' };
    if (pct >= 75)  return { label: `${remaining}h left`, pct, cls: 'text-amber-600', barCls: 'bg-amber-500' };
    return { label: `${remaining}h left`, pct, cls: 'text-green-600', barCls: 'bg-green-500' };
  }

  const typeColors: Record<string, string> = {
    Milestone: 'bg-purple-100 text-purple-700',
    Budget:    'bg-amber-100 text-amber-700',
    Workflow:  'bg-blue-100 text-blue-700',
  };

  const toggle = (id: string) => setSelected(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-500" /> Approvals Queue
          {displayTotal > 0 && (
            <span className="rounded-full bg-amber-100 text-amber-700 text-xs px-2 py-0.5 font-bold">{displayTotal}</span>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
              onClick={() => { selected.forEach(id => approveM.mutate({ approvalId: id })); setSelected(new Set()); }}>
              <Check className="h-3 w-3 mr-1" /> Approve {selected.size}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/admin/approvals')}>
            All <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {q.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          displayItems.slice(0, 5).map((a: any) => {
            const sla = slaStatus(a.createdAt || a.created_at || new Date().toISOString(), a.priority || 'medium');
            const aType = a.approvalType || a.type || 'Request';
            const isSel = selected.has(a.id);
            return (
              <div key={a.id}
                className={cn('rounded-lg border p-3 space-y-2 cursor-pointer transition-all',
                  isSel ? 'border-primary/40 bg-primary/5' :
                  sla.pct >= 100 ? 'border-red-200 bg-red-50/40' : 'hover:bg-muted/20')}
                onClick={() => toggle(a.id)}>
                <div className="flex items-start gap-2">
                  <div className={cn('h-4 w-4 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors',
                    isSel ? 'bg-primary border-primary' : 'border-border')}>
                    {isSel && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{a.title || 'Approval Request'}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground flex-wrap">
                      <span className={cn('px-1.5 py-0.5 rounded font-medium', typeColors[aType] || 'bg-gray-100 text-gray-600')}>{aType}</span>
                      {a.project && <span>{a.project}</span>}
                      {a.requestedBy && <span>by {a.requestedBy}</span>}
                    </div>
                  </div>
                </div>
                {/* SLA bar */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">SLA Timer</span>
                    <span className={cn('font-semibold', sla.cls)}>{sla.label}</span>
                  </div>
                  <div className="h-1 rounded-full bg-secondary overflow-hidden">
                    <div className={cn('h-full rounded-full', sla.barCls)} style={{ width: `${sla.pct}%` }} />
                  </div>
                </div>
                {!isSel && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="h-6 text-[11px] flex-1 bg-green-600 hover:bg-green-700 text-white"
                      disabled={approveM.isPending}
                      onClick={(e) => { e.stopPropagation(); approveM.mutate({ approvalId: a.id }); }}>
                      <Check className="h-2.5 w-2.5 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-6 text-[11px] flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      disabled={rejectM.isPending}
                      onClick={(e) => { e.stopPropagation(); rejectM.mutate({ approvalId: a.id }); }}>
                      <X className="h-2.5 w-2.5 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// ─── Vertical Head Section ────────────────────────────────────────────────────

function VerticalHeadSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const projectsQ = useProjects({ status: 'active' });
  const projects: any[] = projectsQ.data?.items ?? [];
  const dv2Q = useDashboardV2();
  const burnQ = useMilestoneBurnDashboard();

  const mockProjects = [
    { id: 'p1', name: 'Customer Portal Redesign', key: 'CPR',  completion_pct: 62, color: '#3B82F6' },
    { id: 'p2', name: 'API Gateway Migration',    key: 'AGM',  completion_pct: 28, color: '#8B5CF6' },
    { id: 'p3', name: 'Mobile App v2',            key: 'MAV2', completion_pct: 45, color: '#F59E0B' },
  ];

  const displayProjects = projects.length > 0 ? projects : mockProjects;

  // Derive KPIs
  const totalMembers    = dv2Q.data?.totalMembers ?? 24;
  const openApprovals   = dv2Q.data?.pendingApprovals ?? 3;
  const avgCompletion   = Math.round(displayProjects.reduce((s: number, p: any) => s + (p.completion_pct ?? 0), 0) / Math.max(1, displayProjects.length));
  const utilization     = 78;
  const msThroughput    = burnQ.data?.items ? burnQ.data.items.filter((m: any) => m.status === 'completed').length : 7;
  const deliveryEff     = Math.round(avgCompletion * 1.05);
  const sprintHealth    = avgCompletion >= 70 ? 'Good' : avgCompletion >= 40 ? 'Fair' : 'Poor';
  const sprintColor     = avgCompletion >= 70 ? 'text-green-600' : avgCompletion >= 40 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="space-y-5">
      {/* KPI strip — 7 vertical-specific metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <MiniStatChip label="Active Projects"  value={displayProjects.length} color="text-blue-600" />
        <MiniStatChip label="Team Members"     value={totalMembers}           color="text-purple-600" />
        <MiniStatChip label="Utilization"      value={`${utilization}%`}      color={utilization > 90 ? 'text-red-600' : utilization > 75 ? 'text-amber-600' : 'text-green-600'} />
        <MiniStatChip label="Sprint Health"    value={sprintHealth}           color={sprintColor} />
        <MiniStatChip label="MS Throughput"    value={`${msThroughput}/mo`}   color="text-indigo-600" />
        <MiniStatChip label="Delivery Eff."    value={`${Math.min(100, deliveryEff)}%`} color={deliveryEff >= 80 ? 'text-green-600' : 'text-amber-600'} />
        <MiniStatChip label="Open Approvals"   value={openApprovals}          color="text-amber-600" />
      </div>

      {/* Project cards with milestone track */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Project Health</h3>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/projects')}>
            All projects <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {displayProjects.slice(0, 3).map((p: any, i: number) => (
            <VerticalProjectCard key={p.id} p={p} idx={i} navigate={navigate} />
          ))}
        </div>
      </div>

      {/* Financial variance + approvals queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FinancialVariancePanel navigate={navigate} />
        <VerticalApprovalsWidget navigate={navigate} />
      </div>
    </div>
  );
}

// ─── Project Manager Section ──────────────────────────────────────────────────

function ProjectManagerSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const burnQ = useMilestoneBurnDashboard();
  const burnItems: any[] = burnQ.data?.items ?? burnQ.data ?? [];

  const mockBurn = [
    { id: 'm1', title: 'Requirement Gathering', projectName: 'CPR', progress: 100, burnRate: 95, status: 'completed', isOverdue: false, completedTasks: 8, totalTasks: 8 },
    { id: 'm2', title: 'UI/UX Design', projectName: 'CPR', progress: 100, burnRate: 87, status: 'completed', isOverdue: false, completedTasks: 12, totalTasks: 12 },
    { id: 'm3', title: 'Development Phase 1', projectName: 'CPR', progress: 62, burnRate: 62, status: 'in_progress', isOverdue: false, completedTasks: 13, totalTasks: 21 },
    { id: 'm4', title: 'API Integration', projectName: 'AGM', progress: 28, burnRate: 28, status: 'in_progress', isOverdue: true, completedTasks: 3, totalTasks: 11 },
    { id: 'm5', title: 'UAT & Testing', projectName: 'CPR', progress: 0, burnRate: 0, status: 'pending', isOverdue: false, completedTasks: 0, totalTasks: 9 },
  ];

  const items = burnItems.length > 0 ? burnItems : mockBurn;

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'on_hold': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Milestone burn table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Milestone Burn Status
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/projects')}>
            All milestones <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((m: any) => {
              const burn = m.burnRate ?? m.progress ?? 0;
              const isOverdue = m.isOverdue || false;
              return (
                <div key={m.id} className={cn(
                  'rounded-lg border p-3 space-y-2 cursor-pointer hover:bg-muted/30 transition-colors',
                  isOverdue && 'border-red-200'
                )}
                  onClick={() => m.projectId ? navigate(`/projects/${m.projectId}/milestones`) : navigate('/projects')}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {statusIcon(m.status)}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{m.projectName || 'Project'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isOverdue && <Badge className="bg-red-100 text-red-700 text-[10px] border-0">Overdue</Badge>}
                      <span className="text-sm font-bold">{burn}%</span>
                    </div>
                  </div>
                  <ProgressBar
                    value={burn}
                    colorClass={m.status === 'completed' ? 'bg-green-500' : isOverdue ? 'bg-red-500' : burn >= 60 ? 'bg-blue-500' : 'bg-amber-500'}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{m.completedTasks ?? 0}/{m.totalTasks ?? 0} tasks</span>
                    <span className="capitalize">{m.status?.replace('_', ' ') || 'pending'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sprint status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-blue-700 dark:text-blue-300">Active Sprint</span>
              <Badge className="bg-blue-600 text-white text-[10px]">Sprint 12</Badge>
            </div>
            <ProgressBar value={65} colorClass="bg-blue-500" />
            <p className="text-xs text-muted-foreground">65% · 8 days remaining</p>
            <Button variant="outline" size="sm" className="w-full h-8 text-xs mt-1" onClick={() => navigate('/projects')}>
              View Sprint Board
            </Button>
          </CardContent>
        </Card>

        <PendingApprovalsWidget navigate={navigate} />
      </div>
    </div>
  );
}

// ─── Team Lead Section ────────────────────────────────────────────────────────

function TeamLeadSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const dashQ = useDashboard();
  const teamWorkload: any[] = dashQ.data?.team_workload ?? [
    { user_id: '1', name: 'Carol Johnson', role: 'member', open_tasks: 6, high_priority: 2, overdue_tasks: 1, estimated_hours: 24 },
    { user_id: '2', name: 'David Park',    role: 'member', open_tasks: 5, high_priority: 1, overdue_tasks: 0, estimated_hours: 18 },
    { user_id: '3', name: 'Priya Sharma',  role: 'member', open_tasks: 4, high_priority: 0, overdue_tasks: 1, estimated_hours: 16 },
  ];

  const myTasksQ = useMyTasks();
  const myTasks: any[] = myTasksQ.data?.items ?? myTasksQ.data ?? [];
  const overdue = myTasks.filter((t: any) => t.is_overdue || t.isOverdue).length;
  const dueToday = myTasks.filter((t: any) => {
    if (!t.due_date && !t.dueDate) return false;
    const d = new Date(t.due_date || t.dueDate);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStatChip label="Team Size" value={teamWorkload.length} color="text-blue-600" />
        <MiniStatChip label="Due Today" value={dueToday} color="text-orange-600" />
        <MiniStatChip label="Overdue" value={overdue} color={overdue > 0 ? 'text-red-600' : 'text-green-600'} />
        <MiniStatChip label="Open Tasks" value={teamWorkload.reduce((s, m) => s + m.open_tasks, 0)} color="text-purple-600" />
      </div>

      {/* Team workload table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Team Workload
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/admin/users')}>
            Manage <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 text-left font-medium">Member</th>
                  <th className="pb-2 text-center font-medium">Open</th>
                  <th className="pb-2 text-center font-medium">High P</th>
                  <th className="pb-2 text-center font-medium">Overdue</th>
                  <th className="pb-2 text-right font-medium">Est.Hrs</th>
                </tr>
              </thead>
              <tbody>
                {teamWorkload.map((m: any) => (
                  <tr key={m.user_id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate('/my-tasks')}>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar name={m.name} size="sm" />
                        <span className="font-medium">{m.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-center font-bold text-primary">{m.open_tasks}</td>
                    <td className="py-2.5 text-center">
                      <span className={cn('font-bold', m.high_priority > 0 ? 'text-orange-600' : 'text-muted-foreground')}>
                        {m.high_priority}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={cn('font-bold', m.overdue_tasks > 0 ? 'text-red-600' : 'text-muted-foreground')}>
                        {m.overdue_tasks}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">{m.estimated_hours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sprint status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Sprint Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-blue-700 dark:text-blue-300">Sprint 12</span>
                <Badge className="bg-blue-600 text-white text-[10px]">Active</Badge>
              </div>
              <ProgressBar value={65} colorClass="bg-blue-500" />
              <p className="text-xs text-muted-foreground">65% · 8 days remaining</p>
            </div>
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Sprint 13</span>
                <Badge variant="outline" className="text-[10px]">Planning</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Planning in progress. Backlog review tomorrow.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Member Section ───────────────────────────────────────────────────────────

function MemberSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const myTasksQ = useMyTasks();
  const weekQ = useWeeklySummary();
  const tasks: any[] = myTasksQ.data?.items ?? myTasksQ.data ?? [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59);
  const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);

  const overdue = tasks.filter((t: any) => {
    const due = t.due_date || t.dueDate;
    if (!due) return false;
    return new Date(due) < today && !['completed', 'done', 'closed'].includes(t.statusName?.toLowerCase() || t.status?.toLowerCase() || '');
  });

  const dueToday = tasks.filter((t: any) => {
    const due = t.due_date || t.dueDate;
    if (!due) return false;
    const d = new Date(due);
    return d >= today && d <= todayEnd && !overdue.includes(t);
  });

  const dueThisWeek = tasks.filter((t: any) => {
    const due = t.due_date || t.dueDate;
    if (!due) return false;
    const d = new Date(due);
    return d > todayEnd && d <= weekEnd && !overdue.includes(t);
  });

  const later = tasks.filter((t: any) => {
    const due = t.due_date || t.dueDate;
    if (!due) return true;
    const d = new Date(due);
    return d > weekEnd && !overdue.includes(t);
  });

  // Mock data for empty state
  const mockGroups = {
    overdue:      [{ id: 't1', title: 'Review API documentation', priority: 'high',   project: 'AGM' }],
    dueToday:     [{ id: 't2', title: 'Finalize design mockups', priority: 'high',   project: 'CPR' }, { id: 't3', title: 'Update project status', priority: 'medium', project: 'CPR' }],
    dueThisWeek:  [{ id: 't4', title: 'Code review — backend', priority: 'medium', project: 'AGM' }, { id: 't5', title: 'Write unit tests', priority: 'low',    project: 'MAV2' }],
    later:        [{ id: 't6', title: 'Prepare sprint retrospective', priority: 'low', project: 'CPR' }],
  };

  const groups = tasks.length > 0
    ? { overdue, dueToday, dueThisWeek, later }
    : mockGroups;

  const weeklyHours = weekQ.data?.totalHours ?? 0;
  const targetHours = weekQ.data?.targetHours ?? 40;
  const hoursDisplay = weeklyHours > 0 ? `${weeklyHours}h` : '—';

  const priorityClass: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high:     'bg-red-100 text-red-700 border-red-200',
    medium:   'bg-orange-100 text-orange-700 border-orange-200',
    low:      'bg-green-100 text-green-700 border-green-200',
  };

  const TaskRow = ({ t }: { t: any }) => (
    <div
      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/40 cursor-pointer transition-colors border border-transparent hover:border-border/50"
      onClick={() => navigate('/my-tasks')}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-sm truncate">{t.title}</span>
      </div>
      <div className="flex items-center gap-2 ml-2 shrink-0">
        <Badge variant="outline" className="text-[10px]">{t.project || t.projectKey}</Badge>
        <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', priorityClass[t.priority] || priorityClass.medium)}>
          {t.priority}
        </span>
      </div>
    </div>
  );

  const GroupSection = ({ label, items, dotColor, emptyMsg }: { label: string; items: any[]; dotColor: string; emptyMsg: string }) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-1 mb-1">
          <div className={cn('h-2 w-2 rounded-full', dotColor)} />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
          <span className="text-xs font-bold text-foreground">{items.length}</span>
        </div>
        {items.map((t: any) => <TaskRow key={t.id} t={t} />)}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Time + stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStatChip label="Due Today" value={groups.dueToday.length} color="text-orange-600" />
        <MiniStatChip label="Due This Week" value={groups.dueThisWeek.length} color="text-blue-600" />
        <MiniStatChip label="Overdue" value={groups.overdue.length} color={groups.overdue.length > 0 ? 'text-red-600' : 'text-green-600'} />
        <MiniStatChip label="Hrs This Week" value={hoursDisplay} color="text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Task inbox */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-primary" /> My Task Inbox
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/my-tasks')}>
              All tasks <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {groups.overdue.length === 0 && groups.dueToday.length === 0 && groups.dueThisWeek.length === 0 && groups.later.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                <p className="font-medium">All tasks complete!</p>
                <p className="text-sm text-muted-foreground mt-1">Nothing in your queue right now.</p>
              </div>
            ) : (
              <>
                <GroupSection label="Overdue" items={groups.overdue} dotColor="bg-red-500" emptyMsg="" />
                <GroupSection label="Due Today" items={groups.dueToday} dotColor="bg-orange-500" emptyMsg="" />
                <GroupSection label="Due This Week" items={groups.dueThisWeek} dotColor="bg-blue-500" emptyMsg="" />
                <GroupSection label="Later" items={groups.later} dotColor="bg-gray-400" emptyMsg="" />
              </>
            )}
          </CardContent>
        </Card>

        {/* Time this week */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Timer className="h-4 w-4 text-primary" /> Time This Week
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{hoursDisplay}</p>
                <p className="text-xs text-muted-foreground mt-1">of {targetHours}h target</p>
              </div>
              <ProgressBar value={targetHours > 0 ? (weeklyHours / targetHours) * 100 : 0} />
              <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => navigate('/time-logging')}>
                <Clock className="h-3.5 w-3.5 mr-1" /> Log Time
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-primary" /> My Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(weekQ.data?.byProject ?? []).slice(0, 3).map((p: any) => (
                  <div key={p.projectKey} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted/40 cursor-pointer"
                    onClick={() => navigate('/projects')}>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-sm truncate max-w-[120px]">{p.projectName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{p.hours}h</span>
                  </div>
                ))}
                {(weekQ.data?.byProject ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">No time logged yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Executive Section ────────────────────────────────────────────────────────

function ExecutiveSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const execQ = useExecutiveRollup();
  const org = execQ.data?.orgSummary;
  const scorecards: any[] = execQ.data?.scorecards ?? [];
  const alerts: any[] = execQ.data?.alerts ?? [];

  const mockDivisions = [
    { id: 'd1', divisionName: 'IT Division',          completionRate: 78, activeProjects: 12, color: '#3B82F6' },
    { id: 'd2', divisionName: 'Finance Division',     completionRate: 65, activeProjects: 8,  color: '#8B5CF6' },
    { id: 'd3', divisionName: 'Operations Division',  completionRate: 82, activeProjects: 10, color: '#10B981' },
    { id: 'd4', divisionName: 'Quality Assurance',    completionRate: 43, activeProjects: 6,  color: '#F59E0B' },
  ];

  const display = scorecards.length > 0 ? scorecards : mockDivisions;

  return (
    <div className="space-y-4">
      {/* Org-level KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStatChip label="Divisions" value={org?.divisionsCount ?? display.length} color="text-blue-600" />
        <MiniStatChip label="Active Projects" value={org?.activeProjects ?? '—'} color="text-green-600" />
        <MiniStatChip label="Completion" value={`${org?.completionPct ?? '—'}%`} color="text-purple-600" />
        <MiniStatChip label="Overdue Tasks" value={org?.overdueTasks ?? '—'} color="text-red-600" />
      </div>

      {/* Portfolio Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Portfolio Summary
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/executive/portfolio')}>
            Full portfolio <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {display.map((sc: any) => {
              const pct = sc.completionRate ?? sc.health_score ?? 0;
              const rag = ragColor(pct);
              return (
                <div key={sc.id || sc.divisionId}
                  className={cn('rounded-lg border p-3 space-y-2 cursor-pointer hover:shadow-sm transition-shadow', rag.bg, rag.border)}
                  onClick={() => navigate('/executive/portfolio')}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{sc.divisionName || sc.name}</span>
                    <span className={cn('text-xs font-bold', rag.text)}>{pct}%</span>
                  </div>
                  <ProgressBar value={pct} colorClass={pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'} />
                  <p className="text-xs text-muted-foreground">{sc.activeProjects ?? 0} active projects</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Risks */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Key Risks
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/executive/risk-register')}>
              Risk Register <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.slice(0, 4).map((a, i) => (
              <div key={i} className={cn(
                'flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:opacity-80',
                a.severity === 'high' ? 'border-red-200 bg-red-50 dark:bg-red-950/20 text-red-700' :
                'border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-700'
              )} onClick={() => navigate('/executive/risk-register')}>
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{a.message}</p>
                  <p className="text-xs opacity-75 mt-0.5">{a.division}</p>
                </div>
                <Badge variant="outline" className="ml-auto shrink-0 text-[10px] capitalize">{a.severity}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Viewer Section ───────────────────────────────────────────────────────────

function ViewerSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const projectsQ = useProjects();
  const projects: any[] = projectsQ.data?.items ?? [
    { id: '1', name: 'Customer Portal Redesign', key: 'CPR' },
    { id: '3', name: 'Mobile App v2',            key: 'MAV2' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-primary" /> Assigned Projects
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {projects.slice(0, 5).map((p: any) => (
            <div key={p.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer hover:bg-muted/40"
              onClick={() => navigate(`/projects/${p.id}/board`)}
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{p.key}</Badge>
                <span className="text-sm font-medium">{p.name}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main DashboardPage ───────────────────────────────────────────────────────

export function DashboardPage() {
  const { user, currentRole } = useAuthStore();
  const navigate = useNavigate();
  const firstName = user?.first_name || user?.firstName || 'User';

  const dashboardQuery = useDashboard();
  const stats = dashboardQuery.data?.stats ?? {
    total_projects: 5, active_projects: 3, total_tasks: 47, completed_tasks: 18, overdue_tasks: 3, my_open_tasks: 8,
  };
  const projectProgress: any[] = dashboardQuery.data?.project_progress ?? [
    { project_id: '1', name: 'Customer Portal Redesign', key: 'CPR', color: '#3B82F6', total_tasks: 15, completed_tasks: 7, completion_pct: 46.7 },
    { project_id: '2', name: 'API Gateway Migration',    key: 'AGM', color: '#8B5CF6', total_tasks: 12, completed_tasks: 3, completion_pct: 25.0 },
    { project_id: '3', name: 'Mobile App v2',            key: 'MAV2',color: '#F59E0B', total_tasks: 20, completed_tasks: 8, completion_pct: 40.0 },
  ];
  const recentActivity: any[] = dashboardQuery.data?.recent_activity ?? [
    { actor: 'Carol Johnson', action: 'status_changed', entity: 'CPR-1', detail: 'In Progress → In Review', at: new Date(Date.now() - 3600000).toISOString() },
    { actor: 'David Park',    action: 'created',        entity: 'AGM-5', detail: 'Created new task',        at: new Date(Date.now() - 7200000).toISOString() },
    { actor: 'Bob Martinez',  action: 'commented',      entity: 'CPR-3', detail: 'Left a comment',          at: new Date(Date.now() - 14400000).toISOString() },
  ];

  const isHighLevelRole = ['org_admin', 'division_admin', 'executive'].includes(currentRole || '');
  const isProjectRole   = ['project_manager', 'team_lead', 'vertical_head'].includes(currentRole || '');
  const showProjectProgress = !isHighLevelRole;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {firstName}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {ROLE_LABEL[currentRole || ''] ? `${ROLE_LABEL[currentRole!]} — ` : ''}
            Here's what's happening across your projects
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 shrink-0"
          onClick={() => dashboardQuery.refetch()}>
          <RefreshCw className={cn('h-3.5 w-3.5', dashboardQuery.isFetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Universal stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cursor-pointer group" onClick={() => navigate('/projects')}>
          <StatCard
            title="Active Projects"
            value={stats.active_projects}
            icon={FolderKanban}
            trend={{ value: 12, label: 'vs last month' }}
            className="group-hover:border-primary/40"
          />
        </div>
        <div className="cursor-pointer group" onClick={() => navigate('/my-tasks')}>
          <StatCard
            title="Total Tasks"
            value={stats.total_tasks}
            icon={ListTodo}
            subtitle={`${stats.completed_tasks} completed`}
            className="group-hover:border-primary/40"
          />
        </div>
        <div className="cursor-pointer group" onClick={() => navigate('/my-tasks?tab=open')}>
          <StatCard
            title="My Open Tasks"
            value={stats.my_open_tasks}
            icon={CheckSquare}
            iconColor="text-blue-600"
            className="group-hover:border-blue-300"
          />
        </div>
        <div className="cursor-pointer group" onClick={() => navigate('/my-tasks?tab=overdue')}>
          <StatCard
            title="Overdue"
            value={stats.overdue_tasks}
            icon={AlertTriangle}
            iconColor="text-red-600"
            className={cn('group-hover:border-red-300', stats.overdue_tasks > 0 ? 'border-red-200' : '')}
          />
        </div>
      </div>

      {/* Project Progress + Recent Activity (lower roles) */}
      {showProjectProgress && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Project Progress</CardTitle>
              <button onClick={() => navigate('/projects')} className="text-xs text-primary hover:underline font-medium">
                View all →
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectProgress.map((p) => (
                <div key={p.project_id}
                  className="space-y-2 rounded-lg px-3 py-2 -mx-1 cursor-pointer hover:bg-muted/50 border border-transparent hover:border-border/50"
                  onClick={() => navigate(`/projects/${p.project_id}/board`)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-sm font-medium">{p.name}</span>
                      <Badge variant="outline" className="text-xs">{p.key}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">{p.completion_pct}%</span>
                  </div>
                  <ProgressBar value={p.completion_pct} colorClass="bg-primary" />
                  <p className="text-xs text-muted-foreground">{p.completed_tasks} of {p.total_tasks} tasks</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <button onClick={() => navigate('/my-tasks')} className="text-xs text-primary hover:underline font-medium">
                My Tasks →
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((a, i) => (
                  <div key={i}
                    className="flex gap-3 rounded-lg px-2 py-2 -mx-2 cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate('/my-tasks')}>
                    <Avatar name={a.actor} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{a.actor}</span>{' '}
                        <span className="text-muted-foreground">{safeDetail((a as any).detail)}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">{a.entity}</Badge>
                        <span className="text-xs text-muted-foreground">{timeAgo(a.at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Role-specific sections ─────────────────────────────────────────── */}

      {currentRole === 'org_admin' && (
        <OrgAdminSection navigate={navigate} />
      )}

      {currentRole === 'division_admin' && (
        <DivisionAdminSection navigate={navigate} />
      )}

      {currentRole === 'vertical_head' && (
        <VerticalHeadSection navigate={navigate} />
      )}

      {currentRole === 'project_manager' && (
        <ProjectManagerSection navigate={navigate} />
      )}

      {currentRole === 'team_lead' && (
        <TeamLeadSection navigate={navigate} />
      )}

      {currentRole === 'member' && (
        <MemberSection navigate={navigate} />
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
